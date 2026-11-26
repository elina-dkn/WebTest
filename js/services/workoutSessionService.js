
import * as workoutSessionRepository from "../data/workoutSessionRepository.js";

export async function getWorkoutSessions(user) {
    return workoutSessionRepository.getAll(user);
}

export async function completeWorkout(user, split) {
    if (!split?.id || !split?.name) {
        throw new Error("A valid workout split is required.");
    }

    return workoutSessionRepository.create(user, split);
}
