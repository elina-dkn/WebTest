import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let user;

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = "index.html";
    return;
  }

  user = u;
  render();
});

window.logout = () => signOut(auth);

function col() {
  return collection(db, "users", user.uid, "exercises");
}

async function getData() {
  const snap = await getDocs(col());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function render() {
  const data = await getData();
  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(ex => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <b>${ex.name}</b>
      <input type="number" placeholder="Weight">
      <button>Delete</button>
    `;

    const input = div.querySelector("input");

    input.onchange = async () => {
      const logsRef = collection(db, "users", user.uid, "exercises", ex.id, "logs");

      await addDoc(logsRef, {
        date: new Date().toISOString(),
        weight: Number(input.value)
      });
    };

    div.querySelector("button").onclick = () =>
      deleteDoc(doc(db, "users", user.uid, "exercises", ex.id));

    list.appendChild(div);
  });
}

window.addExercise = async function () {
  const input = document.getElementById("newExercise");

  await addDoc(col(), { name: input.value });

  input.value = "";
  render();
};