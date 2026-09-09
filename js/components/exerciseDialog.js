import { showGlobalError } from "../core/auth.js";
import { getSplits, getExercisesForSplit } from "../services/splitService.js";
import { updateExercise } from "../services/exerciseService.js";
import { createElement, getSelectedPills } from "./dom.js";
import { renderSplitPills } from "./splitPills.js";

export async function openExerciseDialog({ user, exercise, onSaved }) {
  const host = document.getElementById("exDialog");
  host.replaceChildren();

  const dialog = createElement("dialog", { className: "dialog" });
  const title = createElement("h3", { text: exercise.name });
  const form = createElement("form", { attrs: { method: "dialog" } });
  form.className = "dialog-form";

  const weightInput = createNumberInput("Weight", exercise.latestWeight);
  const setsInput = createNumberInput("Sets", exercise.sets);
  const repsInput = createNumberInput("Reps", exercise.reps);

  const splitLabel = createElement("div", { className: "dialog-label", text: "Select splits" });
  const splitContainer = createElement("div", { className: "split-area" });
  const splits = await getSplits(user);

  // Membership is now authoritative in split/items. Determine current membership once.
  const currentSplitIds = [];
  for (const split of splits) {
    const exercises = await getExercisesForSplit(user, split.id);
    if (exercises.some((item) => item.id === exercise.id)) {
      currentSplitIds.push(split.id);
    }
  }

  renderSplitPills(splitContainer, splits, currentSplitIds);

  const cancelButton = createElement("button", {
    className: "button secondary-button",
    text: "Cancel",
    attrs: { type: "button" }
  });
  const saveButton = createElement("button", {
    className: "button",
    text: "Save",
    attrs: { type: "submit" }
  });

  const actions = createElement("div", { className: "dialog-actions" });
  actions.append(cancelButton, saveButton);

  form.append(
    weightInput.wrapper,
    setsInput.wrapper,
    repsInput.wrapper,
    splitLabel,
    splitContainer,
    actions
  );
  dialog.append(title, form);
  host.appendChild(dialog);

  cancelButton.addEventListener("click", () => dialog.close());

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    saveButton.disabled = true;

    try {
      await updateExercise(user, exercise, {
        weight: weightInput.input.value,
        sets: setsInput.input.value,
        reps: repsInput.input.value,
        splitIds: getSelectedPills(splitContainer),
        existingSplitIds: currentSplitIds
      });
      dialog.close();
      await onSaved?.();
    } catch (error) {
      saveButton.disabled = false;
      showGlobalError(error);
    }
  });

  dialog.addEventListener("close", () => host.replaceChildren(), { once: true });
  dialog.showModal();
}

function createNumberInput(label, value) {
  const wrapper = createElement("label", { className: "dialog-field" });
  wrapper.appendChild(createElement("span", { text: label }));
  const input = createElement("input", {
    className: `${label.toLowerCase()}-input`,
    attrs: { type: "number", min: "0", step: "any", placeholder: label }
  });
  if (value !== null && value !== undefined) input.value = value;
  wrapper.appendChild(input);
  return { wrapper, input };
}
