import {
    addWeight,
    setSets,
    setReps,
    deleteExercise,
    removeExerciseFromSplit
} from "./db.js";

export function createExerciseCard({
                                       exercise,
                                       onDelete,
                                        deleteText
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

        <input class="weight-input" type="number" placeholder="Weight">
        <div class="latest-sets">
        Last: ${exercise.sets ?? "-"}x${exercise.reps ?? "-"}
        </div>
        <input class="sets-input" type="number" placeholder="Sets">
        <input class="reps-input" type="number" placeholder="Reps">

        <button class="delete-btn">
            ${deleteText}
        </button>
    </div>
    `;

    const input = card.querySelector(".weight-input");

    input.onchange = async () => {

        const weight = Number(input.value);

        if (!weight) return;

        await addWeight(
            exercise.id || exercise.exerciseId,
            weight
        );
        exercise.latestWeight = weight;

        card.querySelector(".latest-weight").textContent =
            `Last: ${weight} `;

        input.value = "";
    };

    const inputS = card.querySelector(".sets-input");

    inputS.onchange = async () => {

        const sets = Number(inputS.value);

        if (!sets) return;

        await setSets(
            exercise.ref,
            sets);
        exercise.sets = sets;
        card.querySelector(".latest-sets").textContent =
            `Last: ${sets}x${exercise.reps}`;

        inputS.value = "";
    };

    const inputR = card.querySelector(".reps-input");

    inputR.onchange = async () => {

        const reps = Number(inputR.value);

        if (!reps) return;

        await setReps(
            exercise.ref,
            reps);
        exercise.reps = reps;
        card.querySelector(".latest-sets").textContent =
            `Last: ${exercise.sets}x${reps}`;


        inputR.value = "";
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