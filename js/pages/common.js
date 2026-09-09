import "./registerServiceWorker.js";
import { requireAuth, showGlobalError } from "../core/auth.js";
import { migrateIfNeeded } from "../services/migrationService.js";

export function initPage(callback) {
  return requireAuth(async (user) => {
    await migrateIfNeeded(user);
    await callback(user);
  });
}

export function runSafely(action) {
  return action().catch(showGlobalError);
}
