import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let chart;

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const exercisesSnap = await getDocs(
    collection(db, "users", user.uid, "exercises")
  );

  const exercises = exercisesSnap.docs;

  const select = document.getElementById("select");

  exercises.forEach((docSnap, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = docSnap.data().name;
    select.appendChild(option);
  });

  select.onchange = () => loadChart(user, exercises[select.value]);

  if (exercises.length > 0) {
    loadChart(user, exercises[0]);
  }
});

async function loadChart(user, exDoc) {
  const logsSnap = await getDocs(
    collection(db, "users", user.uid, "exercises", exDoc.id, "logs")
  );

  const logs = logsSnap.docs.map(d => d.data());

  logs.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = logs.map(l => l.date.split("T")[0]);
  const values = logs.map(l => l.weight);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: exDoc.data().name,
        data: values
      }]
    }
  });
}