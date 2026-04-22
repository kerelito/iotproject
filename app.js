const CHART_POINTS = 144;
const TABLE_POINTS = 48;
const REFRESH_MS = 3000;
const SIMULATED_STEP_MINUTES = 10;

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
    timestamp: new Date(),
  },
};

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
          tension: 0.3,
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
            maxTicksLimit: 8,
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
    { suggestedMin: 17, suggestedMax: 31 }
  ),
  humidity: createSingleMetricChart(
    'humidityChart',
    'Wilgotność (%)',
    '#22d3ee',
    'rgba(34,211,238,.18)',
    { min: 20, max: 90 }
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

function formatChartTime(timestamp) {
  return timestamp.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTableTime(timestamp) {
  return timestamp.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDailyCycle(minutesOfDay, amplitude, phaseShiftHours = 0) {
  const normalized = ((minutesOfDay / 1440) + phaseShiftHours / 24) * Math.PI * 2;
  return Math.sin(normalized) * amplitude;
}

function getPressureCycle(minutesOfDay, amplitude) {
  const normalized = (minutesOfDay / 1440) * Math.PI * 4;
  return Math.cos(normalized) * amplitude;
}

function createTrendNoise(scale) {
  return (Math.random() * 2 - 1) * scale;
}

function generateNextSample(previousTimestamp) {
  const timestamp = new Date(previousTimestamp.getTime() + SIMULATED_STEP_MINUTES * 60 * 1000);
  const minutesOfDay = timestamp.getHours() * 60 + timestamp.getMinutes();

  const targetTemperature = 23 + getDailyCycle(minutesOfDay, 3.9, -0.2);
  const targetHumidity = 56 - getDailyCycle(minutesOfDay, 10.5, -0.15);
  const targetPressure = 1004 + getPressureCycle(minutesOfDay, 2.6);

  state.simulation.temperature = clamp(
    state.simulation.temperature + (targetTemperature - state.simulation.temperature) * 0.22 + createTrendNoise(0.22),
    17.5,
    31.5
  );

  state.simulation.humidity = clamp(
    state.simulation.humidity + (targetHumidity - state.simulation.humidity) * 0.18 + createTrendNoise(0.8),
    30,
    88
  );

  state.simulation.pressure = clamp(
    state.simulation.pressure + (targetPressure - state.simulation.pressure) * 0.12 + createTrendNoise(0.35),
    994,
    1016
  );

  state.simulation.timestamp = timestamp;

  return {
    timestamp,
    temperature: +state.simulation.temperature.toFixed(1),
    humidity: +state.simulation.humidity.toFixed(1),
    pressure: +state.simulation.pressure.toFixed(1),
  };
}

function updateRealtimeCards(sample) {
  refs.tempValue.textContent = sample.temperature;
  refs.humidityValue.textContent = sample.humidity;
  refs.pressureValue.textContent = sample.pressure;
  refs.lastUpdate.textContent = sample.timestamp.toLocaleString('pl-PL');
}

function pushPoint(chart, label, value) {
  chart.data.labels.push(label);
  chart.data.datasets[0].data.push(value);

  if (chart.data.labels.length > CHART_POINTS) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.update('none');
}

function updateCharts(sample) {
  const timeLabel = formatChartTime(sample.timestamp);
  pushPoint(charts.temp, timeLabel, sample.temperature);
  pushPoint(charts.humidity, timeLabel, sample.humidity);
  pushPoint(charts.pressure, timeLabel, sample.pressure);
}

function updateHistory(sample) {
  state.history.unshift(sample);
  if (state.history.length > TABLE_POINTS) state.history.pop();

  refs.historyBody.innerHTML = state.history
    .map(
      (row) => `
        <tr>
          <td>${formatTableTime(row.timestamp)}</td>
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
    .map((alert) => `<li class="${alert.level}">${alert.text}</li>`)
    .join('');
}

function renderSample(sample) {
  updateRealtimeCards(sample);
  updateCharts(sample);
  updateHistory(sample);
  updateAlerts(sample);
}

function seedHistoricalData() {
  const initialTimestamp = new Date(Date.now() - CHART_POINTS * SIMULATED_STEP_MINUTES * 60 * 1000);
  state.simulation.timestamp = initialTimestamp;

  for (let index = 0; index < CHART_POINTS; index += 1) {
    const sample = generateNextSample(state.simulation.timestamp);
    renderSample(sample);
  }
}

function collectAndRenderData() {
  const sample = generateNextSample(state.simulation.timestamp);
  renderSample(sample);
}

refs.thresholdForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.thresholds.tempMax = Number(refs.tempThreshold.value);
  state.thresholds.humidityMax = Number(refs.humidityThreshold.value);
  state.thresholds.pressureMin = Number(refs.pressureThreshold.value);
  updateAlerts(state.history[0]);
});

seedHistoricalData();
setInterval(collectAndRenderData, REFRESH_MS);
