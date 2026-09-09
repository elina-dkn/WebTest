import { getSplits } from "../services/splitService.js";
import { createExercise } from "../services/exerciseService.js";
import { renderSplitPills } from "../components/splitPills.js";
import { getSelectedPills } from "../components/dom.js";
import { initPage, runSafely } from "./common.js";

const form = document.getElementById("exerciseForm");
const splitArea = document.getElementById("splitArea");
const submitButton = document.getElementById("addExerciseButton");

async function init(user) {
  const splits = await getSplits(user);
  renderSplitPills(splitArea, splits);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runSafely(async () => {
      submitButton.disabled = true;
      try {
        await createExercise(user, {
          name: document.getElementById("newExercise").value,
          weight: document.getElementById("newExerciseWeight").value,
          sets: document.getElementById("newExerciseSets").value,
          reps: document.getElementById("newExerciseReps").value,
          splitIds: getSelectedPills(splitArea)
        });
        window.location.href = "exerciseList.html";
      } finally {
        submitButton.disabled = false;
      }
    });
  });
}

initPage(init).catch(console.error);
