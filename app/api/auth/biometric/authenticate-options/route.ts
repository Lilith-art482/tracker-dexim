import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase-admin";
import {
  generateBiometricAuthenticationOptions,
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

  const origin = getWebAuthnOrigin(request);
  const rpId = getWebAuthnRpId(origin);

  try {
    const { challengeId, options } =
      await generateBiometricAuthenticationOptions(rpId);
    return NextResponse.json({ challengeId, options, rpId });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric auth-options error:", err.message);
    return NextResponse.json(
      { error: "Ошибка подготовки входа" },
      { status: 500 },
    );
  }
}
