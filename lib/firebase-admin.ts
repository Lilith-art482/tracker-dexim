import "firebase-admin";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const base64Key = process.env.FIREBASE_PRIVATE_KEY_BASE64;
  let privateKey: string | undefined;

  if (base64Key) {
    // Декодирование base64 (Node.js)
    privateKey = Buffer.from(base64Key, "base64").toString("utf-8").replace(/\\n/g, "\n");
  } else if (rawKey) {
    // Замена литеральных \n на реальные переносы
    privateKey = rawKey.replace(/\\n/g, "\n");
  }

  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error(
      "Firebase Admin SDK: missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY."
    );
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
    throw err;
  }

  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    const app = getAdminApp();
    adminDbInstance = getFirestore(app);
  }
  return adminDbInstance;
}

