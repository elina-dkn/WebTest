export function normalizeExercise(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ref: snapshot.ref,
    name: data.name ?? "Unnamed exercise",
    latestWeight: toNullableNumber(data.latestWeight),
    sets: toNullableNumber(data.sets),
    reps: toNullableNumber(data.reps)
  };
}

export function normalizeSplit(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ref: snapshot.ref,
    name: data.name ?? "Unnamed split"
  };
}

export function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function assertId(id, label = "ID") {
  if (!id || typeof id !== "string") {
    throw new Error(`${label} is required.`);
  }
}

export function userCollection(user, ...segments) {
  assertId(user?.uid, "User ID");
  return ["users", user.uid, ...segments];
}
