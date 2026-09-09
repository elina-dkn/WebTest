import { db } from "../core/firebase.js";
import * as exerciseRepository from "../data/exerciseRepository.js";
import * as logRepository from "../data/logRepository.js";
import * as splitRepository from "../data/splitRepository.js";
import { syncMemberships, setMembership } from "./splitService.js";
import {
  getDocs,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function parseNumber(value, label, { integer = false } = {}) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) {
    throw new Error(`${label} must be a valid non-negative ${integer ? "integer" : "number"}.`);
  }
  return number;
}

export async function getExercises(user) {
  return exerciseRepository.getAll(user);
}

export async function createExercise(user, input) {
  const name = input.name.trim();
  if (!name) throw new Error("Exercise name is required.");

  const weight = parseNumber(input.weight, "Weight");
  const sets = parseNumber(input.sets, "Sets", { integer: true });
  const reps = parseNumber(input.reps, "Reps", { integer: true });
  const splitIds = [...new Set(input.splitIds ?? [])];

  const ref = await exerciseRepository.create(user, { name, weight, sets, reps });

  if (weight !== null) {
    await logRepository.add(user, ref.id, weight);
  }

  await Promise.all(splitIds.map((splitId) => setMembership(user, splitId, ref.id, true)));
  return ref.id;
}

export async function updateExercise(user, exercise, input) {
  const weight = parseNumber(input.weight, "Weight");
  const sets = parseNumber(input.sets, "Sets", { integer: true });
  const reps = parseNumber(input.reps, "Reps", { integer: true });

  const updates = { sets, reps };

  // A blank weight means "leave the current weight alone" in the edit dialog.
  if (weight !== null && weight !== exercise.latestWeight) {
    await logRepository.add(user, exercise.id, weight);
    updates.latestWeight = weight;
  }

  await exerciseRepository.update(user, exercise.id, updates);

  await syncMemberships(
    user,
    exercise.id,
    input.splitIds ?? [],
    input.existingSplitIds ?? []
  );
}

export async function deleteExercise(user, exerciseId) {
  const splits = await splitRepository.getAll(user);
  const membershipRefs = [];

  for (const split of splits) {
    const memberships = await splitRepository.findLegacyMemberships(user, split.id, exerciseId);
    membershipRefs.push(...memberships.map((item) => item.ref));
  }

  const logsSnapshot = await getDocs(exerciseRepository.getLogsCollection(user, exerciseId));
  const refs = [
    exerciseRepository.getRef(user, exerciseId),
    ...membershipRefs,
    ...logsSnapshot.docs.map((item) => item.ref)
  ];

  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

export async function addWeight(user, exerciseId, value) {
  const weight = parseNumber(value, "Weight");
  if (weight === null) throw new Error("Weight is required.");

  await logRepository.add(user, exerciseId, weight);
  await exerciseRepository.update(user, exerciseId, { latestWeight: weight });
}

export async function getWeightLogs(user, exerciseId) {
  return logRepository.getAll(user, exerciseId);
}
