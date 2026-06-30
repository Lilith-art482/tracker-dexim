import { getAdminDb } from "./firebase-admin";

const globalForDbAvailable = globalThis as unknown as {
  _dbAvailable: boolean | null;
  _dbAvailablePromise: Promise<boolean> | null;
};

export async function isDatabaseAvailable(): Promise<boolean> {
  if (process.env.USE_DATABASE === "false") {
    return false;
  }

  if (globalForDbAvailable._dbAvailable != null) {
    return globalForDbAvailable._dbAvailable;
  }

  if (globalForDbAvailable._dbAvailablePromise) {
    return globalForDbAvailable._dbAvailablePromise;
  }

  const promise = (async () => {
    try {
      const db = getAdminDb();
      await db.collection("_health_check").limit(1).get();
      globalForDbAvailable._dbAvailable = true;
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("FIREBASE_PRIVATE_KEY") || message.includes("invalid-credential")) {
        console.warn("Firebase Admin not configured. Running in static mode.");
      } else {
        console.warn("Database is not available. Running in static mode.", message);
      }
      globalForDbAvailable._dbAvailable = false;
      return false;
    }
  })();

  globalForDbAvailable._dbAvailablePromise = promise;
  return promise;
}

export function resetDbAvailableCache(): void {
  globalForDbAvailable._dbAvailable = null;
  globalForDbAvailable._dbAvailablePromise = null;
}
