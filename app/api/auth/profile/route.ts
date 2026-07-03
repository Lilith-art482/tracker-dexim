import { NextRequest, NextResponse } from "next/server";
import { updateProfileSchema } from "@/lib/validation/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminApp: App;

function getFirebaseAuth() {
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
  return getAuth(adminApp);
}

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
    }

    return NextResponse.json(userDoc.data());
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Get profile error:", err.message);
    return NextResponse.json(
      { error: "Ошибка получения профиля" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const uid = body.uid;
    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const auth = getFirebaseAuth();
    const db = getAdminDb();

    // Обновление displayName в Firebase Auth
    await auth.updateUser(uid, {
      displayName: parsed.data.nickname,
    });

    // Обновление в Firestore
    await db.collection("users").doc(uid).update({
      nickname: parsed.data.nickname,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      uid,
      nickname: parsed.data.nickname,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Update profile error:", err.message);
    return NextResponse.json(
      { error: "Ошибка обновления профиля: " + err.message },
      { status: 500 }
    );
  }
}
