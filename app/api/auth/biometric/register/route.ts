import { NextRequest, NextResponse } from "next/server";
import { biometricRegisterSchema } from "@/lib/validation/auth";
import { isAdminConfigured } from "@/lib/firebase-admin";
import {
  verifyBiometricRegistration,
  getWebAuthnOrigin,
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

  const parsed = biometricRegisterSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const origin = getWebAuthnOrigin(request);

  try {
    const result = await verifyBiometricRegistration(
      parsed.data.challengeId,
      parsed.data.uid,
      parsed.data.registrationResponse as never,
      origin,
      parsed.data.deviceName,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, deviceName: parsed.data.deviceName });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric register error:", err.message);
    return NextResponse.json(
      { error: "Ошибка сохранения биометрии" },
      { status: 500 },
    );
  }
}
