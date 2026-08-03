import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  const uid = request.nextUrl.searchParams.get("uid");

  if (!dbAvailable) {
    return NextResponse.json(uid ? null : []);
  }

  try {
    const db = (await import("@/lib/firebase-admin")).getAdminDb();

    if (uid) {
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) return NextResponse.json(null);
      return NextResponse.json({ uid: snap.id, ...snap.data() });
    }

    const snap = await db.collection("users").get();
    const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Ошибка получения пользователей:", error);
    return NextResponse.json(uid ? null : [], { status: 500 });
  }
}
