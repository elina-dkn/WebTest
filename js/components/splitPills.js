import { createElement, getSelectedPills } from "./dom.js";

export function renderSplitPills(container, splits, selectedIds = []) {
  container.replaceChildren();
  const selected = new Set(selectedIds);

  for (const split of splits) {
    const pill = createElement("button", {
      className: `pill${selected.has(split.id) ? " selected" : ""}`,
      text: split.name,
      attrs: { type: "button", "data-id": split.id, "aria-pressed": String(selected.has(split.id)) }
    });

    pill.addEventListener("click", () => {
      const isSelected = pill.classList.toggle("selected");
      pill.setAttribute("aria-pressed", String(isSelected));
    });

    container.appendChild(pill);
  }
}

export { getSelectedPills };
