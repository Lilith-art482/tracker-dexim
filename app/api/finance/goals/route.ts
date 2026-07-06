import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import {
  getGoalsByUser,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const goals = await getGoalsByUser(uid);
    return NextResponse.json(goals);
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
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
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
    const updated = await updateGoal(id, body);
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
    await deleteGoal(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
