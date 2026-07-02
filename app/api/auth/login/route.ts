import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
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
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const auth = getFirebaseAuth();
    const userCredential = await auth.getUserByEmail(parsed.data.email);

    return NextResponse.json({
      uid: userCredential.uid,
      email: userCredential.email,
      nickname: userCredential.displayName || null,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Login error:", err.message);

    if (err.message.includes("not found")) {
      return NextResponse.json(
        { error: "Пользователь с таким email не найден" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Ошибка входа. Проверьте email и пароль." },
      { status: 401 },
    );
  }
}
