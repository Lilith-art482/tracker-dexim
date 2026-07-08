import { NextRequest, NextResponse } from "next/server";
import { createLogSchema } from "@/lib/habit-schema";
import {
  getHabitLogs,
  getAllLogs,
  createLog,
  updateLog,
  getOrCreateLog,
} from "@/lib/habit-models";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const habitId = searchParams.get("habitId");
  if (habitId) {
    const logs = await getHabitLogs(habitId);
    return NextResponse.json(logs);
  }
  const logs = await getAllLogs();
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { habitId, date, status: rawStatus } = body;

  if (habitId && date) {
    const status = rawStatus || "done";
    const log = await getOrCreateLog(habitId, date);
    const updated = await updateLog(log.id, { status });
    return NextResponse.json(updated || log, { status: 201 });
  }

  const parsed = createLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const log = await createLog(parsed.data);
  return NextResponse.json(log, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  const { status, durationMinutes, note } = await request.json();
  const updated = await updateLog(id, { status, durationMinutes, note });
  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}
