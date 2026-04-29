const data = JSON.parse(localStorage.getItem("exercises")) || [];

const select = document.getElementById("exerciseSelect");
const ctx = document.getElementById("chart");

let chart;

// Fill dropdown
data.forEach((ex, i) => {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = ex.name;
  select.appendChild(option);
});

select.addEventListener("change", renderChart);

function renderChart() {
  const ex = data[select.value];
  if (!ex || !ex.logs) return;

  const sorted = [...ex.logs].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );

  const labels = sorted.map(l => l.date);
  const values = sorted.map(l => l.weight);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: ex.name,
        data: values,
        borderWidth: 2,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

// init
if (data.length > 0) {
  select.value = 0;
  renderChart();
}