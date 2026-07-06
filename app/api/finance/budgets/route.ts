import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getBudgetPlansByUser,
  createBudgetPlan,
  updateBudgetPlan,
  deleteBudgetPlan,
} from "@/lib/finance-models";
import { mockStore } from "@/lib/finance-mock-store";
import type { BudgetPlan } from "@/lib/finance-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const budgets = await getBudgetPlansByUser(uid);
      return NextResponse.json(budgets);
    } catch {}
  }

  const filtered = mockStore.budgets.filter((b) => b.userId === uid);
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (await isDatabaseAvailable()) {
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
    }
  }

  const budget: BudgetPlan = {
    id: crypto.randomUUID(),
    userId: uid,
    period: body.period,
    periodStart: body.periodStart,
    periodEnd: body.periodEnd,
    expectedIncome: body.expectedIncome,
    categoryBudgets: body.categoryBudgets,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockStore.budgets.push(budget);
  return NextResponse.json(budget, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await request.json();

  if (await isDatabaseAvailable()) {
    try {
      const updated = await updateBudgetPlan(id, body);
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.budgets.findIndex((b) => b.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.budgets[idx] = {
    ...mockStore.budgets[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(mockStore.budgets[idx]);
}

export async function DELETE(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (await isDatabaseAvailable()) {
    try {
      await deleteBudgetPlan(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.budgets.findIndex((b) => b.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.budgets.splice(idx, 1);
  return NextResponse.json({ success: true });
}
