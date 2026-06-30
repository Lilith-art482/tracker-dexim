import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

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
      await getDocs(collection(db, "_health_check"));
      globalForDbAvailable._dbAvailable = true;
      return true;
    } catch {
      console.warn("Database is not available. Running in static mode.");
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
