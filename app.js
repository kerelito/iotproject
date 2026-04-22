const state = {
  thresholds: {
    tempMax: 28,
    humidityMax: 75,
    pressureMin: 990,
  },
  history: [],
};

const MAX_POINTS = 20;
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

const sensorChart = new Chart(document.getElementById('sensorChart'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Temperatura (°C)',
        data: [],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,.25)',
        tension: 0.35,
      },
      {
        label: 'Wilgotność (%)',
        data: [],
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34,211,238,.2)',
        tension: 0.35,
      },
      {
        label: 'Ciśnienie (hPa)',
        data: [],
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167,139,250,.2)',
        tension: 0.35,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#94a3b8' } },
      y: { ticks: { color: '#94a3b8' } },
    },
    plugins: {
      legend: { labels: { color: '#e2e8f0' } },
    },
  },
});

function simulateSensorData() {
  const now = new Date();
  return {
    timestamp: now,
    temperature: +(22 + Math.random() * 10).toFixed(1),
    humidity: +(50 + Math.random() * 40).toFixed(1),
    pressure: +(985 + Math.random() * 25).toFixed(1),
  };
}

function updateRealtimeCards(sample) {
  refs.tempValue.textContent = sample.temperature;
  refs.humidityValue.textContent = sample.humidity;
  refs.pressureValue.textContent = sample.pressure;
  refs.lastUpdate.textContent = sample.timestamp.toLocaleTimeString('pl-PL');
}

function updateChart(sample) {
  const timeLabel = sample.timestamp.toLocaleTimeString('pl-PL');
  sensorChart.data.labels.push(timeLabel);
  sensorChart.data.datasets[0].data.push(sample.temperature);
  sensorChart.data.datasets[1].data.push(sample.humidity);
  sensorChart.data.datasets[2].data.push(sample.pressure);

  if (sensorChart.data.labels.length > MAX_POINTS) {
    sensorChart.data.labels.shift();
    sensorChart.data.datasets.forEach((dataset) => dataset.data.shift());
  }

  sensorChart.update();
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
  updateChart(sample);
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
