import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { TABLE_NAMES } from "@/lib/schema";

const OWNER_FIELDS = ["ownerId", "userId", "uid", "createdBy"];

export interface DeletionSchedule {
  deletionScheduledAt?: string | null;
  deletionDate?: string | null;
  deletionCancelledAt?: string | null;
}

/**
 * A deletion request is overdue when it was scheduled, never cancelled, and the
 * deletion date has already passed.
 */
export function isDeletionOverdue(
  data: DeletionSchedule | null | undefined,
): boolean {
  if (!data?.deletionScheduledAt || !data?.deletionDate) return false;
  if (data.deletionCancelledAt) return false;
  return new Date(data.deletionDate).getTime() <= Date.now();
}

async function deleteByOwner(
  db: FirebaseFirestore.Firestore,
  collection: string,
  field: string,
  uid: string,
): Promise<number> {
  const snap = await db.collection(collection).where(field, "==", uid).get();
  if (snap.empty) return 0;

  let deleted = 0;
  let batch = db.batch();
  let count = 0;
  for (const doc of snap.docs) {
    batch.delete(doc.ref);
    count++;
    deleted++;
    if (count >= 450) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
  return deleted;
}

/**
 * Permanently removes a user: their Firebase Auth account, the user document,
 * all known per-user collections (boards, tasks, finance, notes, promo codes,
 * deletion requests, …) and any auxiliary records keyed by owner field.
 */
export async function performAccountDeletion(uid: string): Promise<void> {
  const db = getAdminDb();

  for (const name of TABLE_NAMES) {
    for (const field of OWNER_FIELDS) {
      try {
        await deleteByOwner(db, name, field, uid);
      } catch (e) {
        console.error(
          `performAccountDeletion: failed wiping ${name}.${field}=${uid}`,
          e,
        );
      }
    }
  }

  // Explicitly drop the user document itself.
  try {
    await db.collection("users").doc(uid).delete();
  } catch {
    // ignore – may already be gone
  }

  // Finally, revoke the Firebase Auth credentials so the user cannot sign in.
  try {
    const auth = await getAdminAuth();
    if (auth) {
      await auth.deleteUser(uid);
    }
  } catch (e) {
    console.error(
      `performAccountDeletion: failed deleting auth user ${uid}`,
      e,
    );
  }
}

/**
 * Finds every user with a passed deletion date and executes the deletion.
 * Intended to be called by a scheduled job (cron) so deletions happen even if
 * the user never opens the profile page.
 */
export async function processAllOverdueDeletions(): Promise<{
  processed: number;
  deleted: string[];
  errors: string[];
}> {
  const db = getAdminDb();
  const nowIso = new Date().toISOString();

  const snap = await db
    .collection("users")
    .where("deletionDate", "<=", nowIso)
    .get();

  const uids: string[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as DeletionSchedule;
    if (isDeletionOverdue(data)) uids.push(doc.id);
  }

  const deleted: string[] = [];
  const errors: string[] = [];
  for (const uid of uids) {
    try {
      await performAccountDeletion(uid);
      deleted.push(uid);
    } catch (e) {
      errors.push(uid);
      console.error(`processAllOverdueDeletions: failed for ${uid}`, e);
    }
  }

  return { processed: uids.length, deleted, errors };
}
