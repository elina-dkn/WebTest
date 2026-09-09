import * as splitRepository from "../data/splitRepository.js";
import * as exerciseRepository from "../data/exerciseRepository.js";
import {
  deleteDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function getSplits(user) {
  return splitRepository.getAll(user);
}

export async function createSplit(user, name) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Split name is required.");
  return splitRepository.create(user, cleanName);
}

export async function getExercisesForSplit(user, splitId) {
  const [items, exercises] = await Promise.all([
    splitRepository.getItems(user, splitId),
    exerciseRepository.getAll(user)
  ]);

  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const result = [];

  for (const item of items) {
    const exercise = exercisesById.get(item.exerciseId);
    if (!exercise) {
      await splitRepository.deleteMembership(user, splitId, item.exerciseId);
      continue;
    }
    result.push({ ...exercise, itemId: item.id });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export async function setMembership(user, splitId, exerciseId, selected) {
  const membershipRef = splitRepository.getMembershipRef(user, splitId, exerciseId);

  if (selected) {
    await setDoc(membershipRef, { exerciseId });
    return;
  }

  // Remove the deterministic document and any old random-ID documents.
  await deleteDoc(membershipRef).catch(() => {});
  const legacyMemberships = await splitRepository.findLegacyMemberships(user, splitId, exerciseId);
  await Promise.all(legacyMemberships.map((item) => deleteDoc(item.ref)));
}

export async function syncMemberships(user, exerciseId, selectedSplitIds, existingSplitIds) {
  const selected = new Set(selectedSplitIds);
  const existing = new Set(existingSplitIds);

  await Promise.all(
    [...selected].map((splitId) => setMembership(user, splitId, exerciseId, true))
  );

  await Promise.all(
    [...existing]
      .filter((splitId) => !selected.has(splitId))
      .map((splitId) => setMembership(user, splitId, exerciseId, false))
  );
}

export async function deleteSplitAndMemberships(user, splitId) {
  await splitRepository.deleteSplit(user, splitId);
}
