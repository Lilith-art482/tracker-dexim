import { NextRequest, NextResponse } from "next/server";
import { biometricRegisterOptionsSchema } from "@/lib/validation/auth";
import { isAdminConfigured, getUidFromAuthHeader } from "@/lib/firebase-admin";
import {
  generateBiometricRegistrationOptions,
  getWebAuthnOrigin,
  getWebAuthnRpId,
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

  const parsed = biometricRegisterOptionsSchema.safeParse(await request.json());
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

  const uid = await getUidFromAuthHeader(request.headers.get("authorization"));
  if (!uid || uid !== parsed.data.uid) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const rpId = getWebAuthnRpId(origin);

  try {
    const { challengeId, options } = await generateBiometricRegistrationOptions(
      parsed.data.uid,
      rpId,
    );
    return NextResponse.json({ challengeId, options, rpId });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric register-options error:", err);
    return NextResponse.json(
      { error: "Ошибка подготовки биометрии" },
      { status: 500 },
    );
  }
}
