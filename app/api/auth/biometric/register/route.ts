import { NextRequest, NextResponse } from "next/server";
import { biometricRegisterSchema } from "@/lib/validation/auth";
import { isAdminConfigured, getUidFromAuthHeader } from "@/lib/firebase-admin";
import {
  verifyBiometricRegistration,
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

  const parsed = biometricRegisterSchema.safeParse(await request.json());
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

    return NextResponse.json({
      success: true,
      deviceName: parsed.data.deviceName,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric register error:", err);
    return NextResponse.json(
      { error: "Ошибка сохранения биометрии" },
      { status: 500 },
    );
  }
}
