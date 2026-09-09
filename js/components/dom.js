export function clear(element) {
  element.replaceChildren();
}

export function createElement(tag, { className, text, attrs = {} } = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
}

export function showLoading(container, text = "Loading...") {
  clear(container);
  container.appendChild(createElement("p", { className: "status-message", text }));
}

export function showEmpty(container, text) {
  clear(container);
  container.appendChild(createElement("p", { className: "status-message", text }));
}

export function getSelectedPills(container) {
  return [...container.querySelectorAll(".pill.selected")].map((pill) => pill.dataset.id);
}
