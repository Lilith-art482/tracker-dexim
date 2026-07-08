import { NextRequest, NextResponse } from "next/server";
import { createHabitSchema, updateHabitSchema } from "@/lib/habit-schema";
import {
  getAllHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
} from "@/lib/habit-models";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const habit = await getHabitById(id);
    if (!habit) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(habit);
  }
  const habits = await getAllHabits();
  return NextResponse.json(habits);
}

export async function POST(request: NextRequest) {
  const parsed = createHabitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const habit = await createHabit({ ...parsed.data, status: "active" });
  return NextResponse.json(habit, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  const parsed = updateHabitSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await updateHabit(id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  await deleteHabit(id);
  return NextResponse.json({ success: true });
}
