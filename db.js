import { db } from "./firebase.js";
import { state } from "./state.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    updateDoc,
    deleteDoc,
    doc,
    arrayUnion,
    query,
    where, arrayRemove
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

export async function createExercise(name, weight, sets, reps, splitsArray) {

    const exerciseRef = await addDoc(
        collection(db, ...userPath("exercises")),
        {
            name,
            latestWeight: weight || null,
            sets: 0 || null,
            reps: 0 || null,
            splits: [] || null
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

    if (splitsArray.length > 0) {
        await Promise.all(
            splitsArray.map(split =>
                setExerciseSplit(exerciseRef.id, split)
            )
        );
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

export async function setExerciseSplit(exerciseId, splitId){
    const itemsRef = collection(
        db,
        ...userPath("splits", splitId, "items")
    );

    const q = query(
        itemsRef,
        where("exerciseId", "==", exerciseId)
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
        return; // Already belongs to this split
    }

    await addDoc(itemsRef, {
        exerciseId: exerciseId
    });

    const exerciseRef = doc(
        db,
        ...userPath("exercises", exerciseId)
    );

    await updateDoc(exerciseRef, {
        splits: arrayUnion(splitId)
    });
}

export async function removeExerciseSplit(exerciseId, splitId){
    const itemsRef = collection(
        db,
        ...userPath("splits", splitId, "items")
    );

    const q = query(
        itemsRef,
        where("exerciseId", "==", exerciseId)
    );

    const existing = await getDocs(q);

    // Remove exercise from the split's items
    for (const item of existing.docs) {
        await deleteDoc(item.ref);
    }

    // Remove split from the exercise's splits array
    const exerciseRef = doc(
        db,
        ...userPath("exercises", exerciseId)
    );

    await updateDoc(exerciseRef, {
        splits: arrayRemove(splitId)
    });
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
            const exSnap = await getDoc(exRef);
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

    return exercises.filter(e => e !== null).sort((a, b) => a.name.localeCompare(b.name));;
}


export async function removeExerciseFromSplit(splitId, itemId, exerciseId) {

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

    await removeExerciseSplit(exerciseId, splitId);
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

export async function migrateExerciseSplits() {

    const splits = await getSplits();

    const splitExercises = await Promise.all(
        splits.map(async (split) => ({
            split,
            exercises: await getSplitExercises(split.id)
        }))
    );
    for (const { split, exercises } of splitExercises) {
        for (const exercise of exercises) {
            await setExerciseSplit(exercise.exerciseId, split.id);
        }
    }

}