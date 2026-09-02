import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, getUidFromAuthHeader } from "@/lib/firebase-admin";
import { getTotpDoc } from "@/lib/totp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
  if (!isAdminConfigured())
    return NextResponse.json({ error: "База данных недоступна" }, { status: 503 });
  const authUid = await getUidFromAuthHeader(request.headers.get("authorization"));
  if (!authUid || authUid !== uid)
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  try {
    const doc = await getTotpDoc(uid);
    if (!doc || !doc.enabled) {
      return NextResponse.json({ enabled: false, settings: null });
    }
    return NextResponse.json({ enabled: true, settings: doc.settings });
  } catch (e) {
    console.error("TOTP status error:", e);
    return NextResponse.json({ error: "Ошибка" }, { status: 500 });
  }
}
