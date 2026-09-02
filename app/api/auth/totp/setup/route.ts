import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, getUidFromAuthHeader } from "@/lib/firebase-admin";
import { generateTotpSetup, saveTempSecret } from "@/lib/totp";
import QRCode from "qrcode";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ uid: z.string().min(1) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  if (!isAdminConfigured())
    return NextResponse.json({ error: "База данных недоступна" }, { status: 503 });

  const authUid = await getUidFromAuthHeader(request.headers.get("authorization"));
  if (!authUid || authUid !== parsed.data.uid)
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  try {
    // Use email from Firebase Auth for label
    const { getAdminAuth } = await import("@/lib/firebase-admin");
    const adminAuth = await getAdminAuth();
    let email = parsed.data.uid;
    try {
      const user = await adminAuth?.getUser(parsed.data.uid);
      if (user?.email) email = user.email;
    } catch {}

    const { secret, uri } = generateTotpSetup(email);
    await saveTempSecret(parsed.data.uid, secret, uri);
    const qrDataUrl = await QRCode.toDataURL(uri, { width: 240, margin: 1 });
    return NextResponse.json({ secret, qrDataUrl, uri });
  } catch (e) {
    console.error("TOTP setup error:", e);
    return NextResponse.json({ error: "Ошибка создания GA" }, { status: 500 });
  }
}
