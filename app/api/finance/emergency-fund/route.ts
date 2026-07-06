import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import { getEmergencyFund, upsertEmergencyFund } from "@/lib/finance-models";
import { mockStore } from "@/lib/finance-mock-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const fund = await getEmergencyFund(uid);
      return NextResponse.json(fund);
    } catch {}
  }

  return NextResponse.json(
    mockStore.emergencyFund.userId === uid ? mockStore.emergencyFund : null,
  );
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (await isDatabaseAvailable()) {
    try {
      const fund = await upsertEmergencyFund(uid, {
        targetAmount: body.targetAmount,
        currentAmount: body.currentAmount,
      });
      return NextResponse.json(fund, { status: 201 });
    } catch (error) {
      console.error("Error upserting emergency fund:", error);
    }
  }

  mockStore.emergencyFund = {
    id: mockStore.emergencyFund.id,
    userId: uid,
    targetAmount: body.targetAmount ?? mockStore.emergencyFund.targetAmount,
    currentAmount: body.currentAmount ?? mockStore.emergencyFund.currentAmount,
  };
  return NextResponse.json(mockStore.emergencyFund, { status: 201 });
}
