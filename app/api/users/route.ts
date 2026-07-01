import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json([]);
  }

  try {
    const db = (await import("@/lib/firebase-admin")).getAdminDb();
    const snap = await db.collection("users").get();
    const users = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ uid: d.id, ...d.data() }));
    return NextResponse.json(users);
  } catch (error) {
    console.error("Ошибка получения пользователей:", error);
    return NextResponse.json([], { status: 500 });
  }
}
