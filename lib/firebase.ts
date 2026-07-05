import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, collection, getDocs, limit, query as fbQuery } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDWvrCqMWsdLH1LSGZU3xzVAVg4PEAHnSQ",
  authDomain: "tracker-74204.firebaseapp.com",
  projectId: "tracker-74204",
  storageBucket: "tracker-74204.firebasestorage.app",
  messagingSenderId: "1057788676642",
  appId: "1:1057788676642:web:681c705382e4dd3d69587b",
};

let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

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
      await getDocs(fbQuery(collection(db, "_health_check"), limit(1)));
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
