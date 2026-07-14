import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";

let adminApp: App;

function getFirebaseAdmin() {
  if (!adminApp || getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("Firebase Admin not configured");
    }
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "tracker-74204",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return getAdminDb();
}

function generatePromoCode(uid: string): string {
  const suffix = uid.slice(0, 6).toUpperCase();
  return `INMOTION25-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const { uid, reason } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const db = getFirebaseAdmin();
    const now = new Date();
    const deletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const promoCode = generatePromoCode(uid);

    // 1. Save deletion feedback
    if (reason) {
      await db.collection("deletion_feedback").add({
        uid,
        reason,
        createdAt: now.toISOString(),
      });
    }

    // 2. Mark user for deletion + attach promo code
    await db
      .collection("users")
      .doc(uid)
      .update({
        deletionScheduledAt: now.toISOString(),
        deletionDate: deletionDate.toISOString(),
        promoCode: {
          code: promoCode,
          discountPercent: 25,
          validUntil: deletionDate.toISOString(),
          used: false,
        },
      });

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
