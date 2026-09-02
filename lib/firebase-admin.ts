import "firebase-admin";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { App as FirebaseAdminApp } from "firebase-admin/app";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { db as clientDb } from "./firebase";

let adminApp: FirebaseAdminApp | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

function getAdminApp(): FirebaseAdminApp | null {
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

let authModulePromise: Promise<typeof import("firebase-admin/auth")> | null =
  null;

function lazyAuth(): Promise<typeof import("firebase-admin/auth")> {
  if (!authModulePromise) {
    authModulePromise = import("firebase-admin/auth");
  }
  return authModulePromise;
}

export async function getAdminAuth(): Promise<Auth | null> {
  if (adminAuthInstance) return adminAuthInstance;
  const app = getAdminApp();
  if (!app) return null;
  const { getAuth } = await lazyAuth();
  adminAuthInstance = getAuth(app);
  return adminAuthInstance;
}

export function isAdminConfigured(): boolean {
  return (
    (!!process.env.FIREBASE_PRIVATE_KEY ||
      !!process.env.FIREBASE_PRIVATE_KEY_BASE64) &&
    !!process.env.FIREBASE_CLIENT_EMAIL
  );
}

export async function getUidFromAuthHeader(
  authorizationHeader: string | null,
): Promise<string | null> {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
  if (!match) return null;

  const auth = await getAdminAuth();
  if (!auth) return null;

  try {
    const decoded = await auth.verifyIdToken(match[1]);
    return decoded.uid;
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("verifyIdToken error:", err.message);
    return null;
  }
}
