import "firebase-admin";
import { initializeApp, getApps, cert, App, AppOptions } from "firebase-admin/app";
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
    console.log("FIREBASE_PRIVATE_KEY_BASE64 found");
    try {
      privateKey = Buffer.from(base64Key, "base64").toString("utf-8");
      // Замена литеральных \n на реальные переносы
      privateKey = privateKey.replace(/\\n/g, "\n");
      console.log("Decoded base64 key, length:", privateKey.length);
      console.log("Starts with BEGIN:", privateKey.startsWith("-----BEGIN"));
      console.log("Ends with END:", privateKey.trim().endsWith("END PRIVATE KEY-----"));
    } catch (e) {
      console.error("Failed to decode base64 key:", e);
    }
  } else if (rawKey) {
    console.log("FIREBASE_PRIVATE_KEY found, length:", rawKey.length);
    
    if (rawKey.includes("\\n")) {
      privateKey = rawKey.replace(/\\n/g, "\n");
      console.log("Replaced literal \\n");
    } else if (rawKey.includes("\n")) {
      privateKey = rawKey;
      console.log("Using key with real newlines");
    } else {
      privateKey = rawKey.replace(/-----BEGIN PRIVATE KEY-----/, "-----BEGIN PRIVATE KEY-----\n")
        .replace(/-----END PRIVATE KEY-----/, "\n-----END PRIVATE KEY-----");
      console.log("Attempted to format key");
    }
  }

  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error("Missing credentials:");
    console.error("- PRIVATE_KEY exists:", !!rawKey);
    console.error("- PRIVATE_KEY_BASE64 exists:", !!base64Key);
    console.error("- CLIENT_EMAIL exists:", !!process.env.FIREBASE_CLIENT_EMAIL);
    throw new Error(
      "Firebase Admin SDK: missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY."
    );
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "tracker-74204",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully");
    adminApp = app;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Failed to initialize Firebase Admin:", err.message);
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
