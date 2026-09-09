import { getExercises, deleteExercise } from "../services/exerciseService.js";
import { createExerciseCard } from "../components/exerciseCard.js";
import { openExerciseDialog } from "../components/exerciseDialog.js";
import { clear, showEmpty, showLoading } from "../components/dom.js";
import { initPage } from "./common.js";

const list = document.getElementById("list");

async function render(user) {
  showLoading(list);
  const exercises = await getExercises(user);

  if (exercises.length === 0) {
    showEmpty(list, "No exercises yet. Add your first exercise to start tracking.");
    return;
  }

  clear(list);
  for (const exercise of exercises) {
    list.appendChild(
      createExerciseCard({
        exercise,
        onOpen: () => openExerciseDialog({ user, exercise, onSaved: () => render(user) }),
        onDelete: () => deleteExercise(user, exercise.id),
        deleteText: "Delete"
      })
    );
  }
}

initPage((user) => render(user)).catch(console.error);
