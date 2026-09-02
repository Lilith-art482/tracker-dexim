import { NextRequest, NextResponse } from "next/server";
import { getAllRates } from "@/lib/exchange-rates";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const rates = await getAllRates();
    return NextResponse.json({ rates });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Get rates error:", err.message);
    return NextResponse.json(
      { error: "Ошибка получения курсов" },
      { status: 500 },
    );
  }
}
