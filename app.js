const state = {
  thresholds: {
    tempMax: 28,
    humidityMax: 75,
    pressureMin: 990,
  },
  history: [],
  simulation: {
    temperature: 22.4,
    humidity: 53.0,
    pressure: 1004.8,
  },
};

const MAX_POINTS = 30;
const REFRESH_MS = 3000;

const refs = {
  tempValue: document.getElementById('tempValue'),
  humidityValue: document.getElementById('humidityValue'),
  pressureValue: document.getElementById('pressureValue'),
  lastUpdate: document.getElementById('lastUpdate'),
  alertList: document.getElementById('alertList'),
  historyBody: document.getElementById('historyBody'),
  thresholdForm: document.getElementById('thresholdForm'),
  tempThreshold: document.getElementById('tempThreshold'),
  humidityThreshold: document.getElementById('humidityThreshold'),
  pressureThreshold: document.getElementById('pressureThreshold'),
};

function createSingleMetricChart(canvasId, label, borderColor, backgroundColor, yConfig = {}) {
  return new Chart(document.getElementById(canvasId), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label,
          data: [],
          borderColor,
          backgroundColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.28,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: {
        mode: 'nearest',
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 6,
            autoSkip: true,
          },
          grid: { color: 'rgba(148,163,184,0.12)' },
        },
        y: {
          ticks: {
            color: '#94a3b8',
            maxTicksLimit: 6,
          },
          grid: { color: 'rgba(148,163,184,0.12)' },
          ...yConfig,
        },
      },
      plugins: {
        legend: { labels: { color: '#e2e8f0' } },
      },
    },
  });
}

const charts = {
  temp: createSingleMetricChart(
    'tempChart',
    'Temperatura (°C)',
    '#f97316',
    'rgba(249,115,22,.2)',
    { suggestedMin: 18, suggestedMax: 30 }
  ),
  humidity: createSingleMetricChart(
    'humidityChart',
    'Wilgotność (%)',
    '#22d3ee',
    'rgba(34,211,238,.18)',
    { min: 0, max: 100 }
  ),
  pressure: createSingleMetricChart(
    'pressureChart',
    'Ciśnienie (hPa)',
    '#a78bfa',
    'rgba(167,139,250,.18)',
    { suggestedMin: 995, suggestedMax: 1015 }
  ),
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drift(current, step, min, max, centerPull = 0.03) {
  const center = (min + max) / 2;
  const pull = (center - current) * centerPull;
  const noise = (Math.random() * 2 - 1) * step;
  return clamp(current + pull + noise, min, max);
}

function simulateSensorData() {
  state.simulation.temperature = drift(state.simulation.temperature, 0.25, 19.5, 30.5, 0.035);
  state.simulation.humidity = drift(state.simulation.humidity, 0.9, 35, 82, 0.03);
  state.simulation.pressure = drift(state.simulation.pressure, 0.65, 996, 1013, 0.02);

  const now = new Date();

  return {
    timestamp: now,
    temperature: +state.simulation.temperature.toFixed(1),
    humidity: +state.simulation.humidity.toFixed(1),
    pressure: +state.simulation.pressure.toFixed(1),
  };
}

function updateRealtimeCards(sample) {
  refs.tempValue.textContent = sample.temperature;
  refs.humidityValue.textContent = sample.humidity;
  refs.pressureValue.textContent = sample.pressure;
  refs.lastUpdate.textContent = sample.timestamp.toLocaleTimeString('pl-PL');
}

function pushPoint(chart, label, value) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);

  if (chart.data.labels.length > MAX_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update('none');
}

function updateCharts(sample) {
  const timeLabel = sample.timestamp.toLocaleTimeString('pl-PL');
  pushPoint(charts.temp, timeLabel, sample.temperature);
  pushPoint(charts.humidity, timeLabel, sample.humidity);
  pushPoint(charts.pressure, timeLabel, sample.pressure);
}

function updateHistory(sample) {
  state.history.unshift(sample);
  if (state.history.length > MAX_POINTS) state.history.pop();

  refs.historyBody.innerHTML = state.history
    .map(
      (row) => `
        <tr>
          <td>${row.timestamp.toLocaleString('pl-PL')}</td>
          <td>${row.temperature}</td>
          <td>${row.humidity}</td>
          <td>${row.pressure}</td>
        </tr>`
    )
    .join('');
}

function updateAlerts(sample) {
  const alerts = [];

  if (sample.temperature > state.thresholds.tempMax) {
    alerts.push({
      level: 'danger',
      text: `Temperatura ${sample.temperature}°C > próg ${state.thresholds.tempMax}°C`,
    });
  }

  if (sample.humidity > state.thresholds.humidityMax) {
    alerts.push({
      level: 'alert',
      text: `Wilgotność ${sample.humidity}% > próg ${state.thresholds.humidityMax}%`,
    });
  }

  if (sample.pressure < state.thresholds.pressureMin) {
    alerts.push({
      level: 'alert',
      text: `Ciśnienie ${sample.pressure} hPa < próg ${state.thresholds.pressureMin} hPa`,
    });
  }

  if (alerts.length === 0) {
    refs.alertList.innerHTML = '<li class="ok">Wszystkie odczyty w normie.</li>';
    return;
  }

  refs.alertList.innerHTML = alerts
    .map((a) => `<li class="${a.level}">${a.text}</li>`)
    .join('');
}

function collectAndRenderData() {
  const sample = simulateSensorData();
  updateRealtimeCards(sample);
  updateCharts(sample);
  updateHistory(sample);
  updateAlerts(sample);
}

refs.thresholdForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.thresholds.tempMax = Number(refs.tempThreshold.value);
  state.thresholds.humidityMax = Number(refs.humidityThreshold.value);
  state.thresholds.pressureMin = Number(refs.pressureThreshold.value);
});

collectAndRenderData();
setInterval(collectAndRenderData, REFRESH_MS);
