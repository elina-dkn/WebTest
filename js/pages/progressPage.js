import { getExercises } from "../services/exerciseService.js";
import { getWeightLogs } from "../services/exerciseService.js";
import { initPage, runSafely } from "./common.js";

const select = document.getElementById("select");
const chartCanvas = document.getElementById("chart");
let chart = null;

async function init(user) {
  const exercises = await getExercises(user);

  select.replaceChildren();
  for (const exercise of exercises) {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = exercise.name;
    select.appendChild(option);
  }

  if (exercises.length === 0) {
    chartCanvas.hidden = true;
    document.getElementById("progressEmpty").hidden = false;
    return;
  }

  const load = () => runSafely(() => renderChart(user, select.value));
  select.addEventListener("change", load);
  await renderChart(user, select.value);
}

async function renderChart(user, exerciseId) {
  const logs = await getWeightLogs(user, exerciseId);
  const exercise = (await getExercises(user)).find((item) => item.id === exerciseId);

  if (chart) chart.destroy();

  if (logs.length === 0) {
    chartCanvas.hidden = true;
    document.getElementById("progressEmpty").textContent = `No weight logs for ${exercise?.name ?? "this exercise"}.`;
    document.getElementById("progressEmpty").hidden = false;
    return;
  }

  chartCanvas.hidden = false;
  document.getElementById("progressEmpty").hidden = true;

  chart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: logs.map((log) => new Date(log.date).toLocaleDateString()),
      datasets: [{
        label: exercise?.name ?? "Weight",
        data: logs.map((log) => log.weight),
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: { y: { beginAtZero: false } }
    }
  });
}

initPage(init).catch(console.error);
