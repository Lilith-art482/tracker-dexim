import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyDWvrCqMWsdLH1LSGZU3xzVAVg4PEAHnSQ";
const IDENTITYTOOLKIT_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

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

    const res = await fetch(`${IDENTITYTOOLKIT_URL}?key=${FIREBASE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: parsed.data.email,
        password: parsed.data.password,
        returnSecureToken: true,
      }),
    });

    if (!res.ok) {
      let message = "Неверный email или пароль";
      try {
        const errBody = (await res.json()) as { error?: { message?: string } };
        message = errBody.error?.message || message;
      } catch {
        // ignore
      }
      if (
        message === "EMAIL_NOT_FOUND" ||
        message === "INVALID_PASSWORD" ||
        message === "USER_DISABLED" ||
        message === "INVALID_LOGIN_CREDENTIALS"
      ) {
        message = "Неверный email или пароль";
      }
      return NextResponse.json({ error: message }, { status: 401 });
    }

    const data = (await res.json()) as {
      localId: string;
      email?: string;
      displayName?: string | null;
    };

    return NextResponse.json({
      uid: data.localId,
      email: data.email || null,
      nickname: data.displayName || null,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Login error:", err.message);
    return NextResponse.json(
      { error: "Ошибка входа. Проверьте email и пароль." },
      { status: 401 },
    );
  }
}
