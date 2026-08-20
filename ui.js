import {
    addWeight,
    setSets,
    setReps,
    deleteExercise,
    removeExerciseFromSplit, getSplits,
    setExerciseSplit, removeExerciseSplit
} from "./db.js";

export function createExerciseCard({
                                       exercise,
                                        onOpen,
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
        Weight: ${exercise.latestWeight ?? "-"}
        </div>

        
        <div class="latest-sets">
        Sets x Reps: ${exercise.sets ?? "-"} x ${exercise.reps ?? "-"}
        </div>
       
        <button class="delete-btn">
            ${deleteText}
        </button>
    </div>
    `;

    card.onclick = onOpen;



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

export function createSplitDialog(split, exercises, onOpen ) {
    const dialogContainer =
        document.getElementById("splitDialog");

    dialogContainer.innerHTML = "";

    const dialog = document.createElement("dialog");

    dialog.className = "dialog";

    dialog.innerHTML = `
    <h3>${split.name}</h3>
  `;

    dialogContainer.appendChild(dialog);

    for (const exercise of exercises) {

        const card = createExerciseCard({

            exercise,
            onOpen: async () => //createExerciseDialog(exercise, createSplitDialog),
                onOpen(exercise, () => createSplitDialog(split, exercises, onOpen)),

            onDelete: async () => {

                await removeExerciseFromSplit(
                    split.id,
                    exercise.itemId,
                    exercise.exerciseId
                );
            },

            deleteText: "Remove from split"
    });

        dialog.appendChild(card);
    }

    const closeButton = document.createElement("button");

    closeButton.className = "button";

    closeButton.textContent = "Close";

    closeButton.onclick = () => dialog.close();

    dialog.appendChild(closeButton);

    dialog.showModal();
}

export async function createExerciseDialog(exercise, renderExercises) {
    const dialogContainer =
        document.getElementById("exDialog");

    dialogContainer.innerHTML = "";

    const dialog = document.createElement("dialog");

    dialog.className = "dialog";

    dialog.innerHTML = `
    <h3>${exercise.name}</h3>
    <input class="weight-input" type="number" placeholder="Weight">
    <input class="sets-input" type="number" placeholder="Sets">
        <input class="reps-input" type="number" placeholder="Reps">
  `;

    const splits = await getSplits();

    const container = document.createElement("div");
    container.innerHTML = "";
    container.id = "splitArea";

    let selectedSplits = Array;

    splits.forEach(split => {
        const pill = document.createElement("div");
        pill.className = "pill";
        pill.textContent = split.name;
        pill.dataset.id = split.id;

        exercise.splits.forEach(exSplit => {

            if(split.id === exSplit) {
                pill.classList.toggle("selected");
            }
        })

        pill.onclick = () => {
            pill.classList.toggle("selected");
            selectedSplits = Array.from(
                cont.querySelectorAll(".pill.selected")
            ).map(pill => pill.dataset.id);
        };
        container.appendChild(pill);

    });
    dialog.appendChild(container);
    dialogContainer.appendChild(dialog);

    const cont = document.getElementById("splitArea");

    selectedSplits = Array.from(
        cont.querySelectorAll(".pill.selected")
    ).map(pill => pill.dataset.id);






    const input = dialog.querySelector(".weight-input");

    input.onchange = async () => {

        await commitWeight(exercise, input.value);


    };

    const inputS = dialog.querySelector(".sets-input");

    inputS.onchange = async () => {
        await commitSets(exercise, inputS.value);
    };

    const inputR = dialog.querySelector(".reps-input");

    inputR.onchange = async () => {
        await commitReps(exercise, inputR.value);
    };

    const closeButton = document.createElement("button");

    closeButton.className = "button";

    closeButton.textContent = "Close";

    closeButton.onclick = async () => {
        await commitWeight(exercise, input.value);
        await commitReps(exercise, inputR.value);
        await commitSets(exercise, inputS.value);
        const deselectedSplits = exercise.splits.filter(
            splitId => !selectedSplits.includes(splitId)
        );
        await commitSplits(exercise, selectedSplits, deselectedSplits);

        input.value = "";
        inputS.value = "";
        inputR.value = "";
        cont.querySelectorAll(".pill")
            .forEach(pill => pill.classList.remove("selected"));

        dialog.close();
        await renderExercises();
    };

    dialog.appendChild(closeButton);

    dialog.showModal();
}

async function commitWeight(exercise, value) {
    const raw = value.trim();
    if (raw === "") return;

    const weight = Number(raw);
    if (!Number.isFinite(weight)) return;

    await addWeight(
        exercise.id || exercise.exerciseId,
        weight
    );

    exercise.latestWeight = weight;
}

async function commitSets(exercise, value) {
    const raw = value.trim();
    if (raw === "") return;

    const sets = Number(raw);
    if (!Number.isFinite(sets)) return;

    await setSets(
        exercise.ref,
        sets);
    exercise.sets = sets;
}

async function commitReps(exercise, value) {
    const raw = value.trim();
    if (raw === "") return;

    const reps = Number(raw);
    if (!Number.isFinite(reps)) return;

    await setReps(
        exercise.ref,
        reps);
    exercise.reps = reps;
}

async function commitSplits(exercise, value1, value2) {
    console.log(value1, value2);
    for (const value of value1) {
        await setExerciseSplit(exercise.id, value);
    }
    for (const value of value2) {
        await removeExerciseSplit(exercise.id, value);
    }


}