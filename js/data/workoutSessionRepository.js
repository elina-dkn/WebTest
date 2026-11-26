
import {
    addDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { db } from "../core/firebase.js";
import { userCollection, assertId } from "./helpers.js";

export async function getAll(user) {
    const snapshot = await getDocs(
        collection(db, ...userCollection(user, "workoutSessions"))
    );

    return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
    })).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

export async function create(user, split) {
    assertId(split.id, "Split ID");

    const now = new Date();
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");

    return addDoc(
        collection(db, ...userCollection(user, "workoutSessions")),
        {
            splitId: split.id,
            splitName: split.name,
            splitColor: split.color ?? "#E99B9B",
            date,
            completedAt: now.toISOString()
        }
    );
}
