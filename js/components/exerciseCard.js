import { showGlobalError } from "../core/auth.js";
import { createElement } from "./dom.js";

export function createExerciseCard({ exercise, onOpen, onDelete, deleteText = "Delete" }) {
  const card = createElement("article", { className: "card" });
  const name = createElement("div", { className: "exercise-name", text: exercise.name });
  const nameStrong = createElement("b");
  nameStrong.textContent = exercise.name;
  name.replaceChildren(nameStrong);

  const controls = createElement("div", { className: "controls" });
  controls.append(
    createElement("div", {
      className: "latest-weight",
      text: `Weight: ${exercise.latestWeight ?? "-"}`
    }),
    createElement("div", {
      className: "latest-sets",
      text: `Sets x Reps: ${exercise.sets ?? "-"} x ${exercise.reps ?? "-"}`
    })
  );

  const deleteButton = createElement("button", {
    className: "delete-btn",
    text: deleteText,
    attrs: { type: "button" }
  });

  deleteButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    deleteButton.disabled = true;
    try {
      await onDelete();
      card.remove();
    } catch (error) {
      deleteButton.disabled = false;
      showGlobalError(error);
    }
  });

  controls.appendChild(deleteButton);
  card.append(name, controls);
  card.addEventListener("click", async () => {
    try {
      await onOpen();
    } catch (error) {
      showGlobalError(error);
    }
  });
  return card;
}
