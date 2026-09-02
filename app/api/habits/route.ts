import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createHabitSchema, updateHabitSchema } from "@/lib/habit-schema";
import { TableName } from "@/lib/schema";
import {
  getHabitsByOwner,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  ensureOwner,
} from "@/lib/habit-models";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const habit = await getHabitById(id);
    if (!habit || habit.ownerId !== uid)
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(habit);
  }
  const habits = await getHabitsByOwner(uid);
  return NextResponse.json(habits);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = createHabitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const habit = await createHabit({
    ...parsed.data,
    status: "active",
    ownerId: uid,
  });
  return NextResponse.json(habit, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  if (!(await ensureOwner(TableName.HABITS, id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  const parsed = updateHabitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const updated = await updateHabit(id, parsed.data);
  if (!updated)
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  if (!(await ensureOwner(TableName.HABITS, id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  await deleteHabit(id);
  return NextResponse.json({ success: true });
}
