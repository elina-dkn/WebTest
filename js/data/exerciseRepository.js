import { db } from "../core/firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { normalizeExercise, userCollection } from "./helpers.js";

export async function getAll(user) {
  const snapshot = await getDocs(collection(db, ...userCollection(user, "exercises")));
  return snapshot.docs
    .map(normalizeExercise)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getById(user, exerciseId) {
  const ref = doc(db, ...userCollection(user, "exercises", exerciseId));
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? normalizeExercise(snapshot) : null;
}

export async function create(user, data) {
  const ref = await addDoc(
    collection(db, ...userCollection(user, "exercises")),
    {
      name: data.name,
      latestWeight: data.weight ?? null,
      sets: data.sets ?? null,
      reps: data.reps ?? null,
      createdAt: serverTimestamp()
    }
  );

  return ref;
}

export async function update(user, exerciseId, data) {
  const ref = doc(db, ...userCollection(user, "exercises", exerciseId));
  await updateDoc(ref, data);
}

export async function deleteById(user, exerciseId) {
  const ref = doc(db, ...userCollection(user, "exercises", exerciseId));
  await deleteDoc(ref);
}

export function getRef(user, exerciseId) {
  return doc(db, ...userCollection(user, "exercises", exerciseId));
}

export function getLogsCollection(user, exerciseId) {
  return collection(db, ...userCollection(user, "exercises", exerciseId, "logs"));
}
