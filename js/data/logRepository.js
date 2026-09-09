import {
  addDoc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "../core/firebase.js";
import { userCollection, toNullableNumber } from "./helpers.js";

export async function getAll(user, exerciseId) {
  const snapshot = await getDocs(
    collection(db, ...userCollection(user, "exercises", exerciseId, "logs"))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    weight: toNullableNumber(item.data().weight),
    date: item.data().date ?? null
  })).sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0));
}

export async function add(user, exerciseId, weight) {
  return addDoc(
    collection(db, ...userCollection(user, "exercises", exerciseId, "logs")),
    {
      weight,
      date: new Date().toISOString()
    }
  );
}
