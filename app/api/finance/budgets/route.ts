import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getBudgetPlansByUser,
  createBudgetPlan,
  updateBudgetPlan,
  deleteBudgetPlan,
  ensureOwned,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function genId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const budgets = await getBudgetPlansByUser(uid);
    return NextResponse.json(budgets);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const budget = await createBudgetPlan({
      id: genId(),
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
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!(await ensureOwned("FINANCE_BUDGETS", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    const updated = await updateBudgetPlan(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!(await ensureOwned("FINANCE_BUDGETS", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await deleteBudgetPlan(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
