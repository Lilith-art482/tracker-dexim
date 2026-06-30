import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

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
