import { db } from "../core/firebase.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { normalizeSplit, userCollection } from "./helpers.js";

export async function getAll(user) {
  const snapshot = await getDocs(collection(db, ...userCollection(user, "splits")));
  return snapshot.docs
    .map(normalizeSplit)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function create(user, name) {
  const ref = doc(collection(db, ...userCollection(user, "splits")));
  await setDoc(ref, { name });
  return ref;
}

export function getRef(user, splitId) {
  return doc(db, ...userCollection(user, "splits", splitId));
}

export function getMembershipRef(user, splitId, exerciseId) {
  return doc(db, ...userCollection(user, "splits", splitId, "items", exerciseId));
}

export function getItemsCollection(user, splitId) {
  return collection(db, ...userCollection(user, "splits", splitId, "items"));
}

export async function getItems(user, splitId) {
  const snapshot = await getDocs(getItemsCollection(user, splitId));
  return snapshot.docs.map((item) => ({
    id: item.id,
    exerciseId: item.data().exerciseId ?? item.id,
    ref: item.ref
  }));
}

export async function deleteMembership(user, splitId, exerciseId) {
  await deleteDoc(getMembershipRef(user, splitId, exerciseId));
}

export async function deleteSplit(user, splitId) {
  const items = await getItems(user, splitId);
  const refs = [...items.map((item) => item.ref), getRef(user, splitId)];

  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function findLegacyMemberships(user, splitId, exerciseId) {
  const snapshot = await getDocs(getItemsCollection(user, splitId));
  return snapshot.docs.filter((item) => item.data().exerciseId === exerciseId);
}
