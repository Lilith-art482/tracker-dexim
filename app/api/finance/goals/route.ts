import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getGoalsByUser,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/finance-models";
import { mockStore } from "@/lib/finance-mock-store";
import type { FinanceGoal } from "@/lib/finance-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const goals = await getGoalsByUser(uid);
      return NextResponse.json(goals);
    } catch {}
  }

  const filtered = mockStore.goals.filter((g) => g.userId === uid);
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
      const goal = await createGoal({
        id: body.id || crypto.randomUUID(),
        userId: uid,
        name: body.name,
        targetAmount: body.targetAmount,
        currentAmount: body.currentAmount,
        deadline: body.deadline,
        priority: body.priority,
        accountId: body.accountId,
        autoDepositPercent: body.autoDepositPercent,
        completed: false,
      });
      return NextResponse.json(goal, { status: 201 });
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  }

  const goal: FinanceGoal = {
    id: body.id || crypto.randomUUID(),
    userId: uid,
    name: body.name,
    targetAmount: body.targetAmount,
    currentAmount: body.currentAmount,
    deadline: body.deadline,
    priority: body.priority,
    accountId: body.accountId,
    autoDepositPercent: body.autoDepositPercent,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockStore.goals.push(goal);
  return NextResponse.json(goal, { status: 201 });
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
      const updated = await updateGoal(id, body);
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.goals.findIndex((g) => g.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.goals[idx] = {
    ...mockStore.goals[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(mockStore.goals[idx]);
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
      await deleteGoal(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.goals.findIndex((g) => g.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.goals.splice(idx, 1);
  return NextResponse.json({ success: true });
}
