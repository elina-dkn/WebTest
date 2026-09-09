import { getExercisesForSplit } from "../services/splitService.js";
import { createElement } from "./dom.js";
import { createExerciseCard } from "./exerciseCard.js";
import { openExerciseDialog } from "./exerciseDialog.js";

export async function openSplitDialog({ user, split, onChanged }) {
  const host = document.getElementById("splitDialog");
  host.replaceChildren();

  const dialog = createElement("dialog", { className: "dialog" });
  const title = createElement("h3", { text: split.name });
  const list = createElement("div", { className: "dialog-list" });
  const closeButton = createElement("button", {
    className: "button",
    text: "Close",
    attrs: { type: "button" }
  });

  const exercises = await getExercisesForSplit(user, split.id);
  if (exercises.length === 0) {
    list.appendChild(createElement("p", { className: "status-message", text: "No exercises in this split." }));
  } else {
    for (const exercise of exercises) {
      list.appendChild(
        createExerciseCard({
          exercise,
          onOpen: () => openExerciseDialog({ user, exercise, onSaved: onChanged }),
          onDelete: async () => {
            const { setMembership } = await import("../services/splitService.js");
            await setMembership(user, split.id, exercise.id, false);
            await onChanged?.();
          },
          deleteText: "Remove"
        })
      );
    }
  }

  dialog.append(title, list, closeButton);
  host.appendChild(dialog);
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => host.replaceChildren(), { once: true });
  dialog.showModal();
}
