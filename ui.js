import {
    addWeight,
    deleteExercise,
    removeExerciseFromSplit
} from "./db.js";

export function createExerciseCard({
                                       exercise,
                                       onDelete
                                   }) {

    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
    <div class="exercise-name">
        <b>${exercise.name}</b>
    </div>
    
    <div class="controls">
        <div class="latest-weight">
        Last: ${exercise.latestWeight ?? "-"}
        </div>

        <input type="number" placeholder="Weight">

        <button class="delete-btn">
            Delete
        </button>
    </div>
    `;
    const input = card.querySelector("input");

    input.onchange = async () => {

        const weight = Number(input.value);

        if (!weight) return;

        await addWeight(
            exercise.exerciseId || exercise.id,
            weight
        );

        card.querySelector(".latest-weight").textContent =
            `Last: ${weight} kg`;

        input.value = "";
    };

    const button = card.querySelector("button");

    button.onclick = async (e) => {

        e.stopPropagation();

        await onDelete();

        card.remove();
    };

    return card;
}
export function createSplitCard(split, onOpen, onDelete) {

    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
    <b>${split.name}</b>

    <button class="delete-btn">
      Delete
    </button>
  `;

    card.onclick = onOpen;

    card.querySelector("button").onclick = async (e) => {

        e.stopPropagation();

        await onDelete();

        card.remove();
    };

    return card;
}