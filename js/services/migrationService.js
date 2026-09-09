import { db } from "../core/firebase.js";
import * as exerciseRepository from "../data/exerciseRepository.js";
import * as splitRepository from "../data/splitRepository.js";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { userCollection, toNullableNumber } from "../data/helpers.js";

const CURRENT_SCHEMA_VERSION = 2;

export async function migrateIfNeeded(user) {
  const metaRef = doc(db, ...userCollection(user, "_meta", "schema"));
  const metaSnapshot = await getDoc(metaRef);
  const currentVersion = Number(metaSnapshot.data()?.version ?? 0);

  if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

  await migrateLegacyData(user);

  await setDoc(metaRef, {
    version: CURRENT_SCHEMA_VERSION,
    migratedAt: serverTimestamp()
  });
}

async function migrateLegacyData(user) {
  const exercises = await exerciseRepository.getAll(user);
  const splits = await splitRepository.getAll(user);

  for (const exercise of exercises) {
    const logs = await getDocs(exerciseRepository.getLogsCollection(user, exercise.id));
    let latestWeight = exercise.latestWeight;

    if (latestWeight === null && !logs.empty) {
      const sorted = logs.docs
        .map((log) => ({
          weight: toNullableNumber(log.data().weight),
          date: log.data().date ?? ""
        }))
        .filter((log) => log.weight !== null)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      latestWeight = sorted[0]?.weight ?? null;
    }

    await updateDoc(exerciseRepository.getRef(user, exercise.id), {
      latestWeight,
      sets: exercise.sets,
      reps: exercise.reps,
      splits: deleteField()
    });
  }

  for (const split of splits) {
    const items = await splitRepository.getItems(user, split.id);
    const operations = [];
    const deterministicIds = new Set();

    for (const item of items) {
      const deterministicRef = splitRepository.getMembershipRef(user, split.id, item.exerciseId);
      const deterministicSnapshot = await getDoc(deterministicRef);

      if (!deterministicSnapshot.exists() && !deterministicIds.has(item.exerciseId)) {
        deterministicIds.add(item.exerciseId);
        operations.push({ type: "set", ref: deterministicRef, data: { exerciseId: item.exerciseId } });
      }

      if (item.id !== item.exerciseId) {
        operations.push({ type: "delete", ref: item.ref });
      }
    }

    for (let i = 0; i < operations.length; i += 450) {
      const batch = writeBatch(db);
      operations.slice(i, i + 450).forEach((operation) => {
        if (operation.type === "set") batch.set(operation.ref, operation.data);
        else batch.delete(operation.ref);
      });
      await batch.commit();
    }
  }
}
