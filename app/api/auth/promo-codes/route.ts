import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get("uid");
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

    if (!dbAvailable) {
      return NextResponse.json({ promoCodes: [] });
    }

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ promoCodes: [] });
    }

    const userData = userDoc.data();
    let promoCodes = Array.isArray(userData?.promoCodes)
      ? userData.promoCodes
      : [];

    // Backward compat: migrate old single promoCode into array
    if (promoCodes.length === 0 && userData?.promoCode) {
      promoCodes = [
        {
          ...userData.promoCode,
          source: "deletion_reward",
          createdAt:
            userData.deletionScheduledAt ||
            userData.promoCode.createdAt ||
            new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({ promoCodes });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Get promo codes error:", err.message);
    return NextResponse.json(
      { error: "Ошибка получения промокодов" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, code, discountPercent, validUntil, description } = body;

    if (!uid || !code) {
      return NextResponse.json(
        { error: "uid и code обязательны" },
        { status: 400 },
      );
    }

    let dbAvailable = false;
    try {
      getAdminDb();
      dbAvailable = true;
    } catch {
      dbAvailable = false;
    }

    if (!dbAvailable) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const existingCodes = Array.isArray(userData?.promoCodes)
      ? userData.promoCodes
      : [];

    const newEntry = {
      code,
      discountPercent: discountPercent || 0,
      validUntil: validUntil || null,
      description: description || "",
      source: "admin" as const,
      createdAt: new Date().toISOString(),
      used: false,
    };

    await db
      .collection("users")
      .doc(uid)
      .set(
        {
          promoCodes: [...existingCodes, newEntry],
        },
        { merge: true },
      );

    await db.collection("promo_codes").add({
      uid,
      code,
      discountPercent: discountPercent || 0,
      createdAt: new Date().toISOString(),
      validUntil: validUntil || null,
      description: description || "",
      used: false,
    });

    return NextResponse.json({ success: true, promoCode: newEntry });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Add promo code error:", err.message);
    return NextResponse.json(
      { error: "Ошибка добавления промокода" },
      { status: 500 },
    );
  }
}
