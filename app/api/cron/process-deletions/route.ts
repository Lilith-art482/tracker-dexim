import { NextRequest, NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/firebase-admin";
import { processAllOverdueDeletions } from "@/lib/deletion";

export const dynamic = "force-dynamic";

/**
 * Processes all accounts whose scheduled deletion date has passed.
 * Triggered by the Vercel Cron defined in vercel.json (daily) and protected by
 * CRON_SECRET. Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const provided =
    authHeader && secret ? authHeader.replace(/^Bearer\s+/i, "") : null;

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
  }

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  try {
    const result = await processAllOverdueDeletions();
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Cron process-deletions error:", err.message);
    return NextResponse.json(
      { error: "Ошибка обработки удалений" },
      { status: 500 },
    );
  }
}
