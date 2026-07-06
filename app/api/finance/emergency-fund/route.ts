import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import { getEmergencyFund, upsertEmergencyFund } from "@/lib/finance-models";
import { mockFinanceEmergencyFund } from "@/lib/finance-mock";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fund = await getEmergencyFund(uid);
    return NextResponse.json(fund);
  } catch {
    return NextResponse.json(
      mockFinanceEmergencyFund.userId === uid ? mockFinanceEmergencyFund : null,
    );
  }
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const fund = await upsertEmergencyFund(uid, {
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount,
    });
    return NextResponse.json(fund, { status: 201 });
  } catch (error) {
    console.error("Error upserting emergency fund:", error);
    return NextResponse.json(
      { error: "Failed to upsert emergency fund" },
      { status: 500 },
    );
  }
}
