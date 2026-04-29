const list = document.getElementById("exerciseList");

function getData() {
  return JSON.parse(localStorage.getItem("exercises")) || [];
}

function saveData(data) {
  localStorage.setItem("exercises", JSON.stringify(data));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function render() {
  const data = getData();
  list.innerHTML = "";

  data.forEach((ex, index) => {
    const card = document.createElement("div");
    card.className = "card";

    // Name
    const nameInput = document.createElement("input");
    nameInput.className = "exercise-name";
    nameInput.value = ex.name;

    nameInput.addEventListener("change", () => {
      data[index].name = nameInput.value;
      saveData(data);
      render();
    });

    // Row
    const row = document.createElement("div");
    row.className = "row";

    // Weight input
    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.className = "weight-input";

    weightInput.value = ex.logs?.at(-1)?.weight || "";

    weightInput.addEventListener("change", () => {
      const value = Number(weightInput.value);

      if (!data[index].logs) data[index].logs = [];

      data[index].logs.push({
        date: today(),
        weight: value
      });

      saveData(data);
    });

    // Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerText = "Delete";

    deleteBtn.onclick = () => {
      data.splice(index, 1);
      saveData(data);
      render();
    };

    row.appendChild(weightInput);
    row.appendChild(deleteBtn);

    card.appendChild(nameInput);
    card.appendChild(row);

    list.appendChild(card);
  });
}

function addExercise() {
  const input = document.getElementById("newExercise");
  const value = input.value.trim();

  if (!value) return;

  const data = getData();

  data.push({
    name: value,
    logs: []
  });

  saveData(data);
  input.value = "";
  render();
}

render();