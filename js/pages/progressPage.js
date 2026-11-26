
import { getExercises, getWeightLogs } from "../services/exerciseService.js";
import { getWorkoutSessions } from "../services/workoutSessionService.js";
import { initPage, runSafely } from "./common.js";

const select = document.getElementById("select");
const chartCanvas = document.getElementById("chart");
const calendar = document.getElementById("workoutCalendar");
const calendarMonth = document.getElementById("calendarMonth");
const calendarLegend = document.getElementById("calendarLegend");
const selectedDateElement = document.getElementById("selectedDate");
const selectedWorkout = document.getElementById("selectedWorkout");

let chart = null;
let exercises = [];
let sessions = [];
let displayedMonth = new Date();
let selectedDate = getDateKey(new Date());

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
      undefined,
      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );
}

function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();

  calendarMonth.textContent = displayedMonth.toLocaleDateString(
      undefined,
      { month: "long", year: "numeric" }
  );

  calendar.replaceChildren();

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monday-first calendar: Monday = 0, Sunday = 6.
  const offset = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < offset; i++) {
    const blank = document.createElement("span");
    blank.className = "calendar-blank";
    calendar.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = getDateKey(date);
    const daySessions = sessions.filter((session) => session.date === dateKey);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);
    button.setAttribute("aria-label", formatDate(dateKey));

    if (daySessions.length > 0) {
      button.classList.add("has-workout");

      const dots = document.createElement("span");
      dots.className = "calendar-dots";

      for (const session of daySessions.slice(0, 4)) {
        const dot = document.createElement("span");
        dot.className = "calendar-dot";
        dot.style.backgroundColor = session.splitColor ?? "#E99B9B";
        dots.appendChild(dot);
      }

      button.appendChild(dots);
      button.title = daySessions.map((item) => item.splitName).join(", ");
    }

    if (dateKey === selectedDate) {
      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.setAttribute("aria-pressed", "false");
    }

    button.addEventListener("click", () => {
      selectedDate = dateKey;
      renderCalendar();
      renderSelectedDay();
    });

    calendar.appendChild(button);
  }

  renderLegend();
}

function renderLegend() {
  calendarLegend.replaceChildren();

  const splits = new Map();

  for (const session of sessions) {
    if (!splits.has(session.splitId)) {
      splits.set(session.splitId, {
        name: session.splitName,
        color: session.splitColor ?? "#E99B9B"
      });
    }
  }

  if (splits.size === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Your completed workouts will appear here.";
    calendarLegend.appendChild(empty);
    return;
  }

  for (const split of splits.values()) {
    const item = document.createElement("div");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = split.color;

    const name = document.createElement("span");
    name.textContent = split.name;

    item.append(swatch, name);
    calendarLegend.appendChild(item);
  }
}

function renderSelectedDay() {
  selectedDateElement.textContent = formatDate(selectedDate);
  selectedWorkout.replaceChildren();

  const daySessions = sessions.filter(
      (session) => session.date === selectedDate
  );

  if (daySessions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "status-message";
    empty.textContent = "No workouts recorded for this day.";
    selectedWorkout.appendChild(empty);
    return;
  }

  for (const session of daySessions) {
    const item = document.createElement("div");
    item.className = "workout-session";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = session.splitColor ?? "#E99B9B";

    const name = document.createElement("strong");
    name.textContent = session.splitName ?? "Workout";

    item.append(swatch, name);
    selectedWorkout.appendChild(item);
  }
}

function changeMonth(amount) {
  displayedMonth = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + amount,
      1
  );

  renderCalendar();
}

async function init(user) {
  sessions = await getWorkoutSessions(user);

  document.getElementById("prevMonth").addEventListener("click", () => {
    changeMonth(-1);
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    changeMonth(1);
  });

  renderCalendar();
  renderSelectedDay();

  exercises = await getExercises(user);

  select.replaceChildren();

  for (const exercise of exercises) {
    const option = document.createElement("option");
    option.value = exercise.id;
    option.textContent = exercise.name;
    select.appendChild(option);
  }

  if (exercises.length === 0) {
    chartCanvas.hidden = true;
    document.getElementById("progressEmpty").textContent =
        "Add exercises to start tracking your progress.";
    document.getElementById("progressEmpty").hidden = false;
    return;
  }

  const load = () => runSafely(() => renderChart(user, select.value));

  select.addEventListener("change", load);
  await renderChart(user, select.value);
}

async function renderChart(user, exerciseId) {
  const logs = await getWeightLogs(user, exerciseId);
  const exercise = exercises.find((item) => item.id === exerciseId);

  if (chart) {
    chart.destroy();
    chart = null;
  }

  if (logs.length === 0) {
    chartCanvas.hidden = true;

    document.getElementById("progressEmpty").textContent =
        `No weight logs for ${exercise?.name ?? "this exercise"}.`;

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
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

initPage(init).catch(console.error);
