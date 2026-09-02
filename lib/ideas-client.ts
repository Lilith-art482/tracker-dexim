import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Idea } from "./types";

const COLLECTION = "IDEAS";

function clean<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) delete out[k];
  }
  return out;
}

export async function getIdeasByUser(uid: string): Promise<Idea[]> {
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Idea));
}

export async function addIdea(
  data: Omit<Idea, "id" | "createdAt" | "updatedAt">,
): Promise<Idea> {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const idea: Idea = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(collection(db, COLLECTION), id), clean(idea as unknown as Record<string, unknown>));
  return idea;
}

export async function updateIdea(
  id: string,
  data: Partial<Omit<Idea, "id" | "createdAt">>,
): Promise<void> {
  await updateDoc(
    doc(collection(db, COLLECTION), id),
    clean({ ...data, updatedAt: new Date().toISOString() } as Record<string, unknown>),
  );
}

export async function deleteIdea(id: string): Promise<void> {
  await deleteDoc(doc(collection(db, COLLECTION), id));
}
