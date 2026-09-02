import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  const uid = request.nextUrl.searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const authResult = await requireAuth(request, uid);
  if (!authResult.ok) return authResult.response;

  if (!dbAvailable) {
    return NextResponse.json(null);
  }

  try {
    const db = (await import("@/lib/firebase-admin")).getAdminDb();

    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return NextResponse.json(null);
    return NextResponse.json({ uid: snap.id, ...snap.data() });
  } catch (error) {
    console.error("Ошибка получения пользователя:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
