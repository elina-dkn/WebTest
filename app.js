import { auth } from "./firebase.js";
import { state } from "./state.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getExercises,
  getSplits,
  getSplitExercises,
  createExercise,
  createSplit,
  deleteExercise,
  deleteSplit,
  removeExerciseFromSplit,
  migrateLatestWeights
} from "./db.js";

import {
  createExerciseCard,
  createSplitCard
} from "./ui.js";


const currentPage =
    location.pathname.split("/").pop();

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    location.href = "auth.html";
    return;
  }
  state.user = user;
  await migrateLatestWeights();
  if (currentPage === "exerciseList.html") {
    await renderExercises();
  }
  else if (currentPage === "index.html") {
    await renderSplits();
  }
});

window.logout = async () => {

  await signOut(auth);

  location.href = "auth.html";
};


async function renderExercises() {

  const list = document.getElementById("list");

  list.innerHTML = "";

  const exercises = await getExercises();

  for (const exercise of exercises) {

    const card = createExerciseCard({

      exercise,

      onDelete: async () => {
        await deleteExercise(exercise.id);
      }
    });

    list.appendChild(card);
  }
}

async function renderSplits() {

  const list = document.getElementById("list");

  list.innerHTML = "";

  const splits = await getSplits();

  for (const split of splits) {

    const card = createSplitCard(

        split,

        () => openSplit(split),

        async () => {
          await deleteSplit(split.id);
        }
    );

    list.appendChild(card);
  }
}
async function openSplit(split) {

  const dialogContainer =
      document.getElementById("splitDialog");

  dialogContainer.innerHTML = "";

  const dialog = document.createElement("dialog");

  dialog.className = "dialog";

  dialog.innerHTML = `
    <h3>${split.name}</h3>
  `;

  dialogContainer.appendChild(dialog);

  const exercises =
      await getSplitExercises(split.id);

  for (const exercise of exercises) {

    const card = createExerciseCard({

      exercise,

      onDelete: async () => {

        await removeExerciseFromSplit(
            split.id,
            exercise.itemId
        );
      }
    });

    dialog.appendChild(card);
  }

  const closeButton = document.createElement("button");

  closeButton.className = "button";

  closeButton.textContent = "Close";

  closeButton.onclick = () => dialog.close();

  dialog.appendChild(closeButton);

  dialog.showModal();
}

window.addExercise = async () => {

  const nameInput =
      document.getElementById("newExercise");

  const weightInput =
      document.getElementById("newExerciseWeight");

  const splitSelect =
      document.getElementById("selectSplit");

  const name = nameInput.value.trim();

  const weight = weightInput.value;

  if (!name) return;

  await createExercise(
      name,
      weight,
      splitSelect.value
  );

  nameInput.value = "";
  weightInput.value = "";

  await renderExercises();
};

window.addSplit = async () => {

  const input =
      document.getElementById("newSplit");

  const name = input.value.trim();

  if (!name) return;

  await createSplit(name);

  input.value = "";

  await renderSplits();
};