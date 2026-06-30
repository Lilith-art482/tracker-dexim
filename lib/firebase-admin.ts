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
  let privateKey: string | undefined;

  if (rawKey) {
    // Vercel может хранить как literal \n, так и реальные переносы
    if (rawKey.includes("\\n")) {
      privateKey = rawKey.replace(/\\n/g, "\n");
    } else {
      privateKey = rawKey;
    }
  }

  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    throw new Error(
      "Firebase Admin SDK: missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY. " +
        "Set these environment variables to enable Firestore."
    );
  }

  const options: AppOptions = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || "tracker-74204",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  };

  adminApp = initializeApp(options);
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    const app = getAdminApp();
    adminDbInstance = getFirestore(app);
  }
  return adminDbInstance;
}
