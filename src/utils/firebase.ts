// Firebase integration — uncomment when firebase package is installed
//
// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
//
// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
// };
//
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
//
// export async function syncToFirestore(userId: string, collectionName: string, data: any) {
//   const ref = doc(db, 'users', userId, collectionName, 'data');
//   await setDoc(ref, data);
// }
//
// export async function loadFromFirestore(userId: string, collectionName: string) {
//   const ref = doc(db, 'users', userId, collectionName, 'data');
//   const snap = await getDoc(ref);
//   return snap.exists() ? snap.data() : null;
// }
//
// export { db };

export {};
