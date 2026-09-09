import { showGlobalError } from "../core/auth.js";
import { createElement } from "./dom.js";

export function createSplitCard({ split, onOpen, onDelete }) {
  const card = createElement("article", { className: "card split-card" });
  const title = createElement("b", { text: split.name });
  const deleteButton = createElement("button", {
    className: "delete-btn",
    text: "Delete",
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

  card.append(title, deleteButton);
  card.addEventListener("click", async () => {
    try {
      await onOpen();
    } catch (error) {
      showGlobalError(error);
    }
  });
  return card;
}
