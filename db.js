import { db } from "./firebase.js";
import { state } from "./state.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function userPath(...segments) {
    return ["users", state.user.uid, ...segments];
}


export async function getExercises() {
    const snap = await getDocs(
        collection(db, ...userPath("exercises"))
    );

    return snap.docs.map(d => ({
            id: d.id,
            ref: d.ref,
            ...d.data()
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
export async function getSplits() {
    const snap = await getDocs(
        collection(db, ...userPath("splits"))
    );

    return snap.docs.map(d => ({
        id: d.id,
        ...d.data()
    }));
}

export async function createExercise(name, weight, sets, reps, splitId) {

    const exerciseRef = await addDoc(
        collection(db, ...userPath("exercises")),
        {
            name,
            latestWeight: weight || null,
            sets: 0 || null,
            reps: 0 || null
        }
    );
    if (weight !== "") {

        await addDoc(
            collection(
                db,
                ...userPath(
                    "exercises",
                    exerciseRef.id,
                    "logs"
                )
            ),
            {
                weight: Number(weight),
                date: new Date().toISOString()
            }
        );
    }

    if (sets !== "" && reps !== ""){

        await setReps(exerciseRef, reps);
        await setSets(exerciseRef, sets);
    }

    if (splitId) {

        await setExerciseSplit(exerciseRef.id, splitId);
    }
}

export async function setReps(exerciseRef, reps){
    await updateDoc(exerciseRef, {
        reps: reps
    });
}

export async function setSets(exerciseRef, sets){
    await updateDoc(exerciseRef, {
        sets: sets
    });
}

async function setExerciseSplit(exerciseId, splitId){
    await addDoc(
        collection(
            db,
            ...userPath(
                "splits",
                splitId,
                "items"
            )
        ),
        {
            exerciseId: exerciseId
        }
    );
}

export async function addWeight(exerciseId, weight) {

    const exerciseRef = doc(
        db,
        ...userPath("exercises", exerciseId)
    );

    await addDoc(
        collection(exerciseRef, "logs"),
        {
            weight,
            date: new Date().toISOString()
        }
    );

    await updateDoc(exerciseRef, {
        latestWeight: weight
    });
}

export async function deleteExercise(exerciseId) {

    await deleteDoc(
        doc(
            db,
            ...userPath("exercises", exerciseId)
        )
    );
}

export async function createSplit(name) {

    await addDoc(
        collection(db, ...userPath("splits")),
        {
            name
        }
    );
}

export async function deleteSplit(splitId) {

    await deleteDoc(
        doc(
            db,
            ...userPath("splits", splitId)
        )
    );
}

export async function getSplitExercises(splitId) {

    const itemsSnap = await getDocs(
        collection(
            db,
            ...userPath(
                "splits",
                splitId,
                "items"
            )
        )
    );

    const items = itemsSnap.docs.map(d => ({
        itemId: d.id,
        ...d.data()
    }));

    const exercises = await Promise.all(

        items.map(async (item) => {

            const exRef = doc(
                db,
                ...userPath(
                    "exercises",
                    item.exerciseId
                )
            );
            console.log("exRef:", exRef);
            const exSnap = await getDoc(exRef);
            console.log("exSnap:", exSnap);
            console.log("exSnap data:", exSnap.data());
            if (!exSnap.exists()) {

                await deleteDoc(
                    doc(
                        db,
                        ...userPath(
                            "splits",
                            splitId,
                            "items",
                            item.itemId
                        )
                    )
                );

                return null;
            }

            return {
                itemId: item.itemId,
                exerciseId: item.exerciseId,
                ref: exRef,
                ...exSnap.data()
            };
        })
    );

    return exercises.filter(e => e !== null);
}


export async function removeExerciseFromSplit(splitId, itemId) {

    await deleteDoc(
        doc(
            db,
            ...userPath(
                "splits",
                splitId,
                "items",
                itemId
            )
        )
    );
}

export async function migrateLatestWeights() {

    const exercises = await getExercises();

    for (const exercise of exercises) {

        if (exercise.latestWeight != null)
            continue;

        const logsSnap = await getDocs(
            collection(
                db,
                ...userPath(
                    "exercises",
                    exercise.id,
                    "logs"
                )
            )
        );

        const logs =
            logsSnap.docs.map(d => d.data());

        logs.sort(
            (a, b) =>
                new Date(b.date) - new Date(a.date)
        );

        const latestWeight =
            logs.length > 0
                ? logs[0].weight
                : null;

        await updateDoc(
            doc(
                db,
                ...userPath(
                    "exercises",
                    exercise.id
                )),
            {
                latestWeight
            }
        );
    }
}