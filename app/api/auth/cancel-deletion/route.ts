import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const { uid: requestedUid } = await request.json();

    if (!requestedUid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const authResult = await requireAuth(request, requestedUid);
    if (!authResult.ok) return authResult.response;
    const uid = authResult.uid!;

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
        await db.collection("users").doc(uid).set(
          {
            deletionScheduledAt: null,
            deletionDate: null,
            deletionCancelledAt: new Date().toISOString(),
          },
          { merge: true },
        );

        // The deletion-reward promo must stay valid after cancellation:
        // drop its validUntil so it no longer auto-expires.
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const existingCodes = Array.isArray(userData?.promoCodes)
          ? (userData.promoCodes as Array<Record<string, unknown>>)
          : [];
        const keptCodes = existingCodes.map((c) =>
          c.source === "deletion_reward" ? { ...c, validUntil: null } : c,
        );
        if (keptCodes.length > 0) {
          await db
            .collection("users")
            .doc(uid)
            .set({ promoCodes: keptCodes }, { merge: true });
        }

        // Update deletion_requests status
        const requests = await db
          .collection("deletion_requests")
          .where("uid", "==", uid)
          .where("status", "==", "scheduled")
          .get();

        for (const doc of requests.docs) {
          await doc.ref.update({
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
          });
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
