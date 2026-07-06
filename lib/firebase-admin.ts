import "firebase-admin";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { db as clientDb } from "./firebase";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  let privateKey: string | undefined;

  if (base64Key) {
    privateKey = Buffer.from(base64Key, "base64")
      .toString("utf-8")
      .replace(/\\n/g, "\n");
  } else if (rawKey) {
    privateKey = rawKey.replace(/\\n/g, "\n");
  }

  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.warn(
      "Firebase Admin SDK not configured. Falling back to Client SDK.",
    );
    return null;
  }

  try {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "tracker-74204",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Firebase init error:", err.message);
    return null;
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (adminDbInstance) return adminDbInstance;

  const app = getAdminApp();
  if (app) {
    adminDbInstance = getFirestore(app);
    return adminDbInstance;
  }

  // Fall back to Client SDK when Admin SDK isn't available
  adminDbInstance = clientDb as unknown as Firestore;
  return adminDbInstance;
}
