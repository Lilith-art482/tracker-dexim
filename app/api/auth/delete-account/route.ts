import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

function generatePromoCode(_uid: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GIFT25-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const { uid, reason } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const now = new Date();
    const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const promoCode = generatePromoCode(uid);

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

        if (reason) {
          await db.collection("deletion_requests").add({
            uid,
            reason: reason.trim() || "Не указана",
            createdAt: now.toISOString(),
            deletionDate: deletionDate.toISOString(),
            status: "scheduled",
          });
        }

        await db.collection("promo_codes").add({
          uid,
          code: promoCode,
          discountPercent: 25,
          createdAt: now.toISOString(),
          validUntil: deletionDate.toISOString(),
          used: false,
        });

        await db
          .collection("users")
          .doc(uid)
          .set(
            {
              deletionScheduledAt: now.toISOString(),
              deletionDate: deletionDate.toISOString(),
              promoCode: {
                code: promoCode,
                discountPercent: 25,
                validUntil: deletionDate.toISOString(),
                used: false,
              },
            },
            { merge: true },
          );
      } catch (e) {
        console.error("DB write error in delete-account:", e);
      }
    }

    return NextResponse.json({
      success: true,
      deletionDate: deletionDate.toISOString(),
      promoCode,
      discountPercent: 25,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Delete account error:", err.message);
    return NextResponse.json(
      { error: "Ошибка удаления аккаунта" },
      { status: 500 },
    );
  }
}
