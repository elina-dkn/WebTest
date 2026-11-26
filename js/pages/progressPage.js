import { getExercises, getWeightLogs } from "../services/exerciseService.js";
import { getSplits } from "../services/splitService.js";
import { getWorkoutSessions } from "../services/workoutSessionService.js";
import { initPage, runSafely } from "./common.js";

const countLabel = document.getElementById("countLabel");
const workoutCount = document.getElementById("workoutCount");
const monthViewButton = document.getElementById("monthViewButton");
const yearViewButton = document.getElementById("yearViewButton");
const monthCalendar = document.getElementById("monthCalendar");
const yearCalendar = document.getElementById("yearCalendar");
const monthTitle = document.getElementById("monthTitle");
const calendarGrid = document.getElementById("calendarGrid");
const calendarLegend = document.getElementById("calendarLegend");
const selectedDayTitle = document.getElementById("selectedDayTitle");
const selectedWorkout = document.getElementById("selectedWorkout");
const yearTitle = document.getElementById("yearTitle");
const yearGrid = document.getElementById("yearGrid");
const recentWorkouts = document.getElementById("recentWorkouts");
const exerciseSelect = document.getElementById("exerciseSelect");
const chartCanvas = document.getElementById("chart");
const progressEmpty = document.getElementById("progressEmpty");

let sessions = [];
let splits = [];
let exercises = [];
let chart = null;

const today = new Date();
let displayedDate = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = dateKey(today);
let view = "month";

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, options = { month: "long", day: "numeric", year: "numeric" }) {
  return parseDateKey(value).toLocaleDateString(undefined, options);
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function sessionsForDate(value) {
  return sessions.filter((session) => session.date === value);
}

function sessionsForMonth(year, month) {
  return sessions.filter((session) => {
    const date = parseDateKey(session.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

function sessionsForYear(year) {
  return sessions.filter((session) => parseDateKey(session.date).getFullYear() === year);
}

function getSplitColor(session) {
  return session.splitColor || splits.find((split) => split.id === session.splitId)?.color || "#E99B9B";
}

function updateCount() {
  const year = displayedDate.getFullYear();

  if (view === "year") {
    countLabel.textContent = `WORKOUTS IN ${year}`;
    workoutCount.textContent = sessionsForYear(year).length;
  } else {
    countLabel.textContent = `WORKOUTS IN ${displayedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase()}`;
    workoutCount.textContent = sessionsForMonth(year, displayedDate.getMonth()).length;
  }
}

function renderLegend() {
  calendarLegend.replaceChildren();

  const usedSplitIds = new Set(
      sessions.map((session) => session.splitId)
  );

  const usedNames = new Set();

  for (const session of sessions) {
    const name = session.splitName || "Workout";
    if (usedNames.has(name)) continue;
    usedNames.add(name);

    const item = makeElement("div", "legend-item");
    const swatch = makeElement("span", "legend-swatch");
    swatch.style.backgroundColor = getSplitColor(session);
    item.append(swatch, makeElement("span", "", name));
    calendarLegend.appendChild(item);
  }

  if (calendarLegend.children.length === 0) {
    calendarLegend.appendChild(makeElement("p", "", "Your completed workouts will appear here."));
  }
}

function renderSelectedDay() {
  const daySessions = sessionsForDate(selectedDate);
  selectedDayTitle.textContent = formatDate(selectedDate);
  selectedWorkout.replaceChildren();

  if (daySessions.length === 0) {
    selectedWorkout.appendChild(makeElement("p", "status-message", "No completed workouts on this day."));
    return;
  }

  for (const session of daySessions) {
    const row = makeElement("div", "workout-session");
    const swatch = makeElement("span", "legend-swatch");
    swatch.style.backgroundColor = getSplitColor(session);
    row.append(swatch, makeElement("span", "", session.splitName || "Workout"));
    selectedWorkout.appendChild(row);
  }
}

function renderMonthCalendar() {
  const year = displayedDate.getFullYear();
  const month = displayedDate.getMonth();

  monthTitle.textContent = displayedDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  calendarGrid.replaceChildren();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(makeElement("div", "calendar-blank"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const value = dateKey(new Date(year, month, day));
    const daySessions = sessionsForDate(value);
    const button = makeElement("button", "calendar-day", String(day));
    button.type = "button";

    if (daySessions.length) button.classList.add("has-workout");
    if (value === selectedDate) button.classList.add("selected");
    if (value === dateKey(today)) button.classList.add("today");

    if (daySessions.length) {
      const dots = makeElement("span", "calendar-dots");
      const colors = [...new Set(daySessions.map(getSplitColor))].slice(0, 3);

      for (const color of colors) {
        const dot = makeElement("span", "calendar-dot");
        dot.style.backgroundColor = color;
        dots.appendChild(dot);
      }
      button.appendChild(dots);
    }

    button.addEventListener("click", () => {
      selectedDate = value;
      renderMonthCalendar();
      renderSelectedDay();
    });

    calendarGrid.appendChild(button);
  }

  renderLegend();
  renderSelectedDay();
}

function renderYearCalendar() {
  const year = displayedDate.getFullYear();
  yearTitle.textContent = String(year);
  yearGrid.replaceChildren();

  for (let month = 0; month < 12; month++) {
    const card = makeElement("button", "mini-month");
    card.type = "button";
    card.appendChild(makeElement("strong", "mini-month-title",
        new Date(year, month, 1).toLocaleDateString(undefined, { month: "long" })
    ));

    const grid = makeElement("span", "mini-month-grid");
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(makeElement("span", "mini-day empty"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const value = dateKey(new Date(year, month, day));
      const dayElement = makeElement("span", "mini-day", String(day));
      const daySessions = sessionsForDate(value);

      if (daySessions.length) {
        dayElement.classList.add("has-workout");
        dayElement.style.backgroundColor = getSplitColor(daySessions[0]);
      }
      grid.appendChild(dayElement);
    }

    card.appendChild(grid);
    card.addEventListener("click", () => {
      displayedDate = new Date(year, month, 1);
      selectedDate = dateKey(displayedDate);
      setView("month");
    });
    yearGrid.appendChild(card);
  }
}

function renderRecentWorkouts() {
  recentWorkouts.replaceChildren();

  const latest = [...sessions]
      .sort((a, b) => (b.completedAt || b.date || "").localeCompare(a.completedAt || a.date || ""))
      .slice(0, 2);

  if (latest.length === 0) {
    recentWorkouts.appendChild(makeElement("p", "status-message", "No workouts completed yet."));
    return;
  }

  for (const session of latest) {
    const button = makeElement("button", "recent-workout");
    button.type = "button";

    const stripe = makeElement("span", "recent-workout-stripe");
    stripe.style.backgroundColor = getSplitColor(session);

    const swatch = makeElement("span", "legend-swatch");
    swatch.style.backgroundColor = getSplitColor(session);

    const details = makeElement("span", "recent-workout-details");
    details.append(
        makeElement("span", "recent-workout-date", formatDate(session.date, { month: "long", day: "numeric" })),
        makeElement("strong", "", session.splitName || "Workout")
    );

    button.append(stripe, swatch, details, makeElement("span", "recent-workout-arrow", "›"));
    button.addEventListener("click", () => {
      displayedDate = new Date(parseDateKey(session.date).getFullYear(), parseDateKey(session.date).getMonth(), 1);
      selectedDate = session.date;
      setView("month");
    });

    recentWorkouts.appendChild(button);
  }
}

function setView(nextView) {
  view = nextView;
  const isMonth = view === "month";

  monthCalendar.hidden = false;
  document.getElementById("monthCalendar").hidden = !isMonth;
  yearCalendar.hidden = isMonth;
  monthViewButton.classList.toggle("active", isMonth);
  yearViewButton.classList.toggle("active", !isMonth);

  updateCount();
  if (isMonth) renderMonthCalendar();
  else renderYearCalendar();
}

async function renderChart(exerciseId) {
  if (!exerciseId) {
    if (chart) chart.destroy();
    chartCanvas.hidden = true;
    progressEmpty.textContent = "Choose an exercise to see your weight progression.";
    progressEmpty.hidden = false;
    return;
  }

  const logs = await getWeightLogs(currentUser, exerciseId);
  const exercise = exercises.find((item) => item.id === exerciseId);

  if (chart) chart.destroy();

  if (!logs.length) {
    chartCanvas.hidden = true;
    progressEmpty.textContent = `No weight logs for ${exercise?.name ?? "this exercise"}.`;
    progressEmpty.hidden = false;
    return;
  }

  chartCanvas.hidden = false;
  progressEmpty.hidden = true;

  chart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: logs.map((log) => new Date(log.date).toLocaleDateString()),
      datasets: [{
        label: exercise?.name ?? "Weight",
        data: logs.map((log) => log.weight),
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

let currentUser;

async function init(user) {
  currentUser = user;

  [sessions, splits, exercises] = await Promise.all([
    getWorkoutSessions(user),
    getSplits(user),
    getExercises(user)
  ]);

  exerciseSelect.replaceChildren();
  exerciseSelect.appendChild(new Option("Select an exercise", ""));

  for (const exercise of exercises) {
    exerciseSelect.appendChild(new Option(exercise.name, exercise.id));
  }

  document.getElementById("previousMonth").addEventListener("click", () => {
    displayedDate = new Date(displayedDate.getFullYear(), displayedDate.getMonth() - 1, 1);
    selectedDate = dateKey(displayedDate);
    updateCount();
    renderMonthCalendar();
  });

  document.getElementById("nextMonth").addEventListener("click", () => {
    displayedDate = new Date(displayedDate.getFullYear(), displayedDate.getMonth() + 1, 1);
    selectedDate = dateKey(displayedDate);
    updateCount();
    renderMonthCalendar();
  });

  monthViewButton.addEventListener("click", () => setView("month"));
  yearViewButton.addEventListener("click", () => setView("year"));

  exerciseSelect.addEventListener("change", () => {
    runSafely(() => renderChart(exerciseSelect.value));
  });

  renderRecentWorkouts();
  setView("month");
  await renderChart("");
}

initPage(init).catch(console.error);