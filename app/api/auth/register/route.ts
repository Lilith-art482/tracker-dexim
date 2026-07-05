import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const auth = getFirebaseAuth();
    const db = getAdminDb();

    // Проверка существования пользователя
    try {
      await auth.getUserByEmail(parsed.data.email);
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    } catch {
      // Пользователь не найден - можно регистрировать
    }

    // Создание пользователя
    const userRecord = await auth.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      displayName: parsed.data.nickname,
    });

    // Сохранение дополнительного профиля в Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email: parsed.data.email,
      nickname: parsed.data.nickname,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        uid: userRecord.uid,
        email: userRecord.email,
        nickname: parsed.data.nickname,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Register error:", err.message);

    return NextResponse.json(
      { error: "Ошибка регистрации: " + err.message },
      { status: 500 },
    );
  }
}
