import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let user;
let split;

onAuthStateChanged(auth, async (u) => {
  if (!u) {
    window.location.href = "auth.html";
    return;
  }

  user = u;
  if (window.location.pathname.includes("exerciseList.html")) {
    await render();
  }else{
    await renderSplits();
  }

});

window.logout = () => {
  signOut(auth);
  window.location.href = "auth.html";
}

function col() {
  return collection(db, "users", user.uid, "exercises");
}

function colSplit() {
  return collection(db, "users", user.uid, "splits");
}

async function getData() {
  const snap = await getDocs(col());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getDataSplits() {
  const snap = await getDocs(colSplit());
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function render() {
  const data = await getData();
  const list = document.getElementById("list");
  list.innerHTML = "";

  for (const ex of data) {

    const logsSnap = await getDocs(
        collection(
            db,
            "users",
            user.uid,
            "exercises",
            ex.id,
            "logs"
        )
    );

    const logs = logsSnap.docs.map(doc => doc.data());

    logs.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );

    const latestWeight =
        logs.length > 0
            ? logs[0].weight
            : "-";

    const div = document.createElement("div");

    div.className = "card";

    div.innerHTML = `
    <b>${ex.name}</b>

    <div class="latest-weight">
      Last: ${latestWeight} kg
    </div>

    <input type="number" placeholder="Weight">

    <button class="delete-btn">
      Delete
    </button>
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
      deleteDoc(doc(db, "users", user.uid, "exercises", ex.id)) && render();

    list.appendChild(div);
  }
}

async function renderSplits() {
  const data = await getDataSplits();
  const list = document.getElementById("list");
  list.innerHTML = "";

  for (const ex of data) {

    const div = document.createElement("div");

    div.className = "card";
    div.addEventListener("click", () => openSplit(ex.id, ex.name));

    div.innerHTML = `
    <b>${ex.name}</b>

    <button class="delete-btn">
      Delete
    </button>
  `;


    div.querySelector("button").onclick = () =>
        deleteDoc(doc(db, "users", user.uid, "splits", ex.id)) && renderSplits();

    list.appendChild(div);
  }
}

async function openSplit(exID, exName) {
  const dialog = document.getElementById("splitDialog");
  dialog.innerHTML = "";
  const div = document.createElement("dialog");
  div.className = "dialog";
  const p = document.createElement("h3");
  p.textContent = exName;
  div.appendChild(p);
  dialog.appendChild(div);



  const itemsSnap = await getDocs(
        collection(
            db,
            "users",
            user.uid,
            "splits",
            exID,
            "items"
        )
    );

  const items = itemsSnap.docs.map(doc => ({
    itemId: doc.id,
    ...doc.data()
  }));

  if(items.length > 0) {
    for (const i of items) {
      const exRef = doc(db, "users", user.uid, "exercises", i.exerciseId);
      const exSnap = await getDoc(exRef);

      if (!exSnap.exists()) {
        console.log("Exercise not found");

        await deleteDoc(
            doc(
                db,
                "users",
                user.uid,
                "splits",
                exID,
                "items",
                i.itemId
            )
        );

        continue;
      }

      const logsSnap = await getDocs(collection(exRef, "logs"));
      const logs = logsSnap.docs.map(doc => doc.data());

      logs.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
      );

      const latestWeight =
          logs.length > 0
              ? logs[0].weight
              : "-";

      const exercise = exSnap.data();
      console.log(exercise.name);
      const divContainer = document.createElement("div");

      divContainer.className = "card";

      divContainer.innerHTML = `
    <b>${exercise.name}</b>

    <div class="latest-weight">
      Last: ${latestWeight} kg
    </div>

    <input type="number" placeholder="Weight">

    <button class="delete-btn">
      Delete from split
    </button>
  `;


      const input = divContainer.querySelector("input");

      input.onchange = async () => {
        const logsRef = collection(exRef, "logs");

        await addDoc(logsRef, {
          date: new Date().toISOString(),
          weight: Number(input.value)
        });
      };

      divContainer.querySelector("button").onclick = async () =>
          await deleteDoc(
              doc(
                  db,
                  "users",
                  user.uid,
                  "splits",
                  exID,
                  "items",
                  i.itemId
              )
          );

      div.appendChild(divContainer);
    }

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "Close";
    closeButton.id = "close";
    closeButton.className = "button";
    div.appendChild(closeButton);

    closeButton.addEventListener("click", () => div.close());
    div.showModal();
  }


}




window.addExercise = async function () {
  const inputName = document.getElementById("newExercise");
  const inputWeight = document.getElementById("newExerciseWeight");

  const name = inputName.value.trim();
  const weight = Number(inputWeight.value);

  if (!name) return;

  // CREATE EXERCISE
  const exerciseRef = await addDoc(
      collection(
          db,
          "users",
          user.uid,
          "exercises"
      ),
      {
        name: name
      }
  );

  // CREATE FIRST LOG
  if (inputWeight.value !== "") {

    await addDoc(
        collection(
            db,
            "users",
            user.uid,
            "exercises",
            exerciseRef.id,
            "logs"
        ),
        {
          weight: weight,
          date: new Date().toISOString()
        }
    );
  }

  if (split.value !== "") {
    await addDoc(
        collection(
            db,
            "users",
            user.uid,
            "splits",
            split,
            "items"
        ),
        {
          exerciseId: exerciseRef.id
        }
    );
  }

  inputName.value = "";
  inputWeight.value = "";
  //split = "";
  await render();
};


window.addSplit = async function () {
  const inputName = document.getElementById("newSplit");

  const name = inputName.value.trim();

  if (!name) return;

  // CREATE EXERCISE
  const splitRef = await addDoc(
      collection(
          db,
          "users",
          user.uid,
          "splits"
      ),
      {
        name: name
      }
  );



  inputName.value = "";
  await renderSplits();
};

export function setSplit(value){
  split = value;
}


