import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createLogSchema } from "@/lib/habit-schema";
import { TableName } from "@/lib/schema";
import {
  getHabitLogs,
  getAllLogs,
  getHabitById,
  createLog,
  updateLog,
  getOrCreateLog,
  ensureOwner,
} from "@/lib/habit-models";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const habitId = searchParams.get("habitId");
  if (habitId) {
    const habit = await getHabitById(habitId);
    if (!habit || habit.ownerId !== uid)
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    const logs = await getHabitLogs(habitId);
    return NextResponse.json(logs);
  }
  const logs = await getAllLogs(uid);
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const body = await request.json();
  const parsed = createLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { habitId, date, status, durationMinutes, note } = parsed.data;
  if (!(await ensureOwner(TableName.HABITS, habitId, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const log = await getOrCreateLog(habitId, date);
  const updated = await updateLog(log.id, {
    status,
    durationMinutes,
    note,
    ownerId: uid,
  });
  return NextResponse.json(updated || { ...log, ownerId: uid }, {
    status: 201,
  });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  if (!(await ensureOwner(TableName.HABIT_LOGS, id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  const { status, durationMinutes, note } = await request.json();
  const updated = await updateLog(id, { status, durationMinutes, note });
  if (!updated)
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}
