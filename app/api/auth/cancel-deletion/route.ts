import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    let dbAvailable = false;
    try {
      getAdminDb();
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }

    if (dbAvailable) {
      try {
        const db = getAdminDb();

        // Remove deletion schedule, keep promoCode intact
        await db
          .collection("users")
          .doc(uid)
          .set(
            {
              deletionScheduledAt: null,
              deletionDate: null,
              deletionCancelledAt: new Date().toISOString(),
            },
            { merge: true },
          );

        // Update deletion_requests status
        const requests = await db
          .collection("deletion_requests")
          .where("uid", "==", uid)
          .where("status", "==", "scheduled")
          .get();

        for (const doc of requests.docs) {
          await doc.ref.update({ status: "cancelled", cancelledAt: new Date().toISOString() });
        }
      } catch (e) {
        console.error("DB write error in cancel-deletion:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Cancel deletion error:", err.message);
    return NextResponse.json(
      { error: "Ошибка отмены удаления" },
      { status: 500 },
    );
  }
}
