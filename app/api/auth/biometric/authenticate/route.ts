import { NextRequest, NextResponse } from "next/server";
import { biometricAuthenticateSchema } from "@/lib/validation/auth";
import { isAdminConfigured, getAdminAuth } from "@/lib/firebase-admin";
import {
  verifyBiometricAuthentication,
  getWebAuthnOrigin,
  isOriginAllowed,
} from "@/lib/webauthn-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const parsed = biometricAuthenticateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const origin = getWebAuthnOrigin(request);
  if (!isOriginAllowed(origin)) {
    return NextResponse.json(
      { error: "Недопустимый источник запроса" },
      { status: 403 },
    );
  }

  try {
    const result = await verifyBiometricAuthentication(
      parsed.data.challengeId,
      parsed.data.authenticationResponse as never,
      origin,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const auth = await getAdminAuth();
    if (!auth) {
      return NextResponse.json(
        { error: "База данных недоступна" },
        { status: 503 },
      );
    }

    const token = await auth.createCustomToken(result.uid);
    return NextResponse.json({ success: true, token });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric auth error:", err.message);
    return NextResponse.json(
      { error: "Ошибка входа по биометрии" },
      { status: 500 },
    );
  }
}
