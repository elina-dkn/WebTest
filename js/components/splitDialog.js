
import { getExercisesForSplit, setMembership, updateSplit } from "../services/splitService.js";
import { completeWorkout } from "../services/workoutSessionService.js";
import { createElement } from "./dom.js";
import { createExerciseCard } from "./exerciseCard.js";
import { openExerciseDialog } from "./exerciseDialog.js";
import { showGlobalError } from "../core/auth.js";

export async function openSplitDialog({ user, split, onChanged }) {
  const host = document.getElementById("splitDialog");
  host.replaceChildren();

  const dialog = createElement("dialog", { className: "dialog" });
  const title = createElement("h3", { text: split.name });
  const list = createElement("div", { className: "dialog-list" });

  const colorField = createElement("label", {
    className: "dialog-field"
  });

  const colorLabel = createElement("span", {
    text: "Calendar color"
  });

  const colorInput = createElement("input", {
    attrs: {
      type: "color",
      value: split.color ?? "#E99B9B"
    }
  });

  colorField.append(colorLabel, colorInput);

  const saveColorButton = createElement("button", {
    className: "button secondary-button",
    text: "Save color",
    attrs: { type: "button" }
  });

  const completeButton = createElement("button", {
    className: "button",
    text: "Complete Workout",
    attrs: { type: "button" }
  });

  const closeButton = createElement("button", {
    className: "button secondary-button",
    text: "Close",
    attrs: { type: "button" }
  });

  saveColorButton.addEventListener("click", async () => {
    saveColorButton.disabled = true;

    try {
      await updateSplit(user, split.id, {
        color: colorInput.value
      });

      split.color = colorInput.value;
      await onChanged?.();
      saveColorButton.textContent = "Color saved";
    } catch (error) {
      showGlobalError(error);
    } finally {
      saveColorButton.disabled = false;
    }
  });

  completeButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
        `Mark "${split.name}" as completed today?`
    );

    if (!confirmed) return;

    completeButton.disabled = true;

    try {
      await completeWorkout(user, split);
      completeButton.textContent = "Workout recorded";
    } catch (error) {
      showGlobalError(error);
      completeButton.disabled = false;
    }
  });

  const exercises = await getExercisesForSplit(user, split.id);

  if (exercises.length === 0) {
    list.appendChild(
        createElement("p", {
          className: "status-message",
          text: "No exercises in this split."
        })
    );
  } else {
    for (const exercise of exercises) {
      list.appendChild(
          createExerciseCard({
            exercise,
            onOpen: () => openExerciseDialog({
              user,
              exercise,
              onSaved: onChanged
            }),
            onDelete: async () => {
              await setMembership(user, split.id, exercise.id, false);
              await onChanged?.();
            },
            deleteText: "Remove"
          })
      );
    }
  }

  dialog.append(
      title,
      colorField,
      saveColorButton,
      completeButton,
      list,
      closeButton
  );

  host.appendChild(dialog);

  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener(
      "close",
      () => host.replaceChildren(),
      { once: true }
  );

  dialog.showModal();
}
