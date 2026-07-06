import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { getEmergencyFund, upsertEmergencyFund } from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fund = await getEmergencyFund(uid);
    return NextResponse.json(fund);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const uid = auth.currentUser?.uid || body.userId;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fund = await upsertEmergencyFund(uid, {
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount,
    });
    return NextResponse.json(fund, { status: 201 });
  } catch (error) {
    console.error("Error upserting emergency fund:", error);
    return NextResponse.json(
      { error: "Failed to save emergency fund" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const uid =
    auth.currentUser?.uid ||
    request.nextUrl.searchParams.get("uid") ||
    body.userId;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { targetAmount, currentAmount } = body;

  if (targetAmount == null && currentAmount == null) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const existing = await getEmergencyFund(uid);
    const fund = await upsertEmergencyFund(uid, {
      targetAmount: targetAmount ?? existing?.targetAmount ?? 0,
      currentAmount: currentAmount ?? existing?.currentAmount ?? 0,
    });
    return NextResponse.json(fund);
  } catch (error) {
    console.error("Error updating emergency fund:", error);
    return NextResponse.json(
      { error: "Failed to update emergency fund" },
      { status: 500 },
    );
  }
}
