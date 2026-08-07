import { NextRequest, NextResponse } from "next/server";
import { biometricRegisterOptionsSchema } from "@/lib/validation/auth";
import { isAdminConfigured } from "@/lib/firebase-admin";
import {
  generateBiometricRegistrationOptions,
  getWebAuthnOrigin,
  getWebAuthnRpId,
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

  const parsed = biometricRegisterOptionsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const origin = getWebAuthnOrigin(request);
  const rpId = getWebAuthnRpId(origin);

  try {
    const { challengeId, options } = await generateBiometricRegistrationOptions(
      parsed.data.uid,
      rpId,
    );
    return NextResponse.json({ challengeId, options, rpId });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric register-options error:", err.message);
    return NextResponse.json(
      { error: "Ошибка подготовки биометрии" },
      { status: 500 },
    );
  }
}
