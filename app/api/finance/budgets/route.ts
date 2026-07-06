import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import {
  getBudgetPlansByUser,
  createBudgetPlan,
  updateBudgetPlan,
  deleteBudgetPlan,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budgets = await getBudgetPlansByUser(uid);
    return NextResponse.json(budgets);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const uid = auth.currentUser?.uid || body.userId;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const budget = await createBudgetPlan({
      id: crypto.randomUUID(),
      userId: uid,
      period: body.period,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      expectedIncome: body.expectedIncome,
      categoryBudgets: body.categoryBudgets,
    });
    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json({ error: "Failed to create budget" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid") || body.userId;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const updated = await updateBudgetPlan(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteBudgetPlan(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
