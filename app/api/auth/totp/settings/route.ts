import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured, getUidFromAuthHeader } from "@/lib/firebase-admin";
import { updateTotpSettings, type TotpSettings } from "@/lib/totp";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  uid: z.string().min(1),
  settings: z.object({
    requireOnLogin: z.boolean().optional(),
    requireOnEmailChange: z.boolean().optional(),
    requireOnPasswordChange: z.boolean().optional(),
    requireForBiometric: z.boolean().optional(),
  }),
});

export async function PATCH(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });

  if (!isAdminConfigured())
    return NextResponse.json({ error: "База данных недоступна" }, { status: 503 });

  const authUid = await getUidFromAuthHeader(request.headers.get("authorization"));
  if (!authUid || authUid !== parsed.data.uid)
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });

  try {
    const updated = await updateTotpSettings(parsed.data.uid, parsed.data.settings);
    return NextResponse.json({ settings: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
