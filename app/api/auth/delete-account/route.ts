import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

function generatePromoCode(): string {
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

    let dbAvailable = false;
    try {
      getAdminDb();
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }

    const now = new Date();
    const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let promoCode: string | null = null;
    let alreadyHadPromo = false;

    if (dbAvailable) {
      try {
        const db = getAdminDb();

        // Check user doc for existing deletion request and promo history
        const userDoc = await db.collection("users").doc(uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        // If there's already an active deletion request, return existing data
        if (userData?.deletionScheduledAt && !userData?.deletionCancelledAt) {
          const existingPromo = userData?.promoCode?.code || null;
          return NextResponse.json({
            success: true,
            deletionDate: userData.deletionDate,
            promoCode: existingPromo,
            discountPercent: existingPromo ? (userData?.promoCode?.discountPercent || 25) : null,
            alreadyExists: true,
          });
        }

        // Generate promo only if user never got one from deletion before
        if (!userData?.gotDeletionPromo) {
          promoCode = generatePromoCode();
          alreadyHadPromo = false;

          await db.collection("promo_codes").add({
            uid,
            code: promoCode,
            discountPercent: 25,
            createdAt: now.toISOString(),
            validUntil: deletionDate.toISOString(),
            used: false,
          });

          const newPromoEntry = {
            code: promoCode,
            discountPercent: 25,
            validUntil: deletionDate.toISOString(),
            used: false,
            source: "deletion_reward" as const,
            createdAt: now.toISOString(),
          };

          const existingCodes = Array.isArray(userData?.promoCodes)
            ? userData.promoCodes
            : [];
          const updatedCodes = [...existingCodes, newPromoEntry];

          await db
            .collection("users")
            .doc(uid)
            .set(
              {
                deletionScheduledAt: now.toISOString(),
                deletionDate: deletionDate.toISOString(),
                deletionCancelledAt: null,
                gotDeletionPromo: true,
                promoCode: newPromoEntry,
                promoCodes: updatedCodes,
              },
              { merge: true },
            );
        } else {
          alreadyHadPromo = true;
          // Repeat deletion after cancel — no promo, just schedule
          await db
            .collection("users")
            .doc(uid)
            .set(
              {
                deletionScheduledAt: now.toISOString(),
                deletionDate: deletionDate.toISOString(),
                deletionCancelledAt: null,
              },
              { merge: true },
            );
        }

        if (reason) {
          await db.collection("deletion_requests").add({
            uid,
            reason: reason.trim() || "Не указана",
            createdAt: now.toISOString(),
            deletionDate: deletionDate.toISOString(),
            status: "scheduled",
          });
        }
      } catch (e) {
        console.error("DB write error in delete-account:", e);
      }
    }

    return NextResponse.json({
      success: true,
      deletionDate: deletionDate.toISOString(),
      promoCode,
      discountPercent: promoCode ? 25 : null,
      alreadyHadPromo,
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
