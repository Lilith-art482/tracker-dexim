import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, getUidFromAuthHeader } from "@/lib/firebase-admin";
import { verifyTotpCode, getTotpDoc } from "@/lib/totp";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ uid: z.string().min(1), token: z.string().min(6).max(6) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  if (!isAdminConfigured())
    return NextResponse.json({ error: "База недоступна" }, { status: 503 });

  const authUid = await getUidFromAuthHeader(request.headers.get("authorization"));
  if (!authUid || authUid !== parsed.data.uid)
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  const doc = await getTotpDoc(parsed.data.uid);
  if (!doc?.enabled) return NextResponse.json({ error: "GA не включён" }, { status: 400 });
  if (!verifyTotpCode(doc.secret, parsed.data.token))
    return NextResponse.json({ error: "Неверный код" }, { status: 400 });
  return NextResponse.json({ success: true });
}
