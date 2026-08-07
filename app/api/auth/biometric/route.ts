import { NextRequest, NextResponse } from "next/server";
import { biometricRemoveSchema } from "@/lib/validation/auth";
import { isAdminConfigured } from "@/lib/firebase-admin";
import {
  removeBiometricCredential,
  getBiometricCredentials,
} from "@/lib/webauthn-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const uid = request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
  }

  try {
    const credentials = await getBiometricCredentials(uid);
    const devices = credentials.map((c) => ({
      id: c.id,
      deviceName: c.deviceName ?? "Устройство",
      createdAt: c.createdAt ?? null,
      lastUsedAt: c.lastUsedAt ?? null,
      counter: c.counter,
    }));
    return NextResponse.json({ devices });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric list error:", err.message);
    return NextResponse.json(
      { error: "Ошибка получения биометрии" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const parsed = biometricRemoveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const removed = await removeBiometricCredential(
      parsed.data.uid,
      parsed.data.credentialId,
    );
    if (!removed) {
      return NextResponse.json(
        { error: "Устройство не найдено" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Biometric remove error:", err.message);
    return NextResponse.json(
      { error: "Ошибка удаления биометрии" },
      { status: 500 },
    );
  }
}
