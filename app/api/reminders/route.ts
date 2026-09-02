import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createReminderSchema } from "@/lib/habit-schema";
import { TableName } from "@/lib/schema";
import {
  getRemindersByOwner,
  getHabitById,
  createReminder,
  updateReminder,
  deleteReminder,
  ensureOwner,
} from "@/lib/habit-models";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const reminders = await getRemindersByOwner(uid);
  return NextResponse.json(reminders);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = createReminderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (!(await ensureOwner(TableName.HABITS, parsed.data.habitId, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  const reminder = await createReminder({ ...parsed.data, ownerId: uid });
  return NextResponse.json(reminder, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  if (!(await ensureOwner(TableName.REMINDERS, id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  const body = await request.json();
  const updated = await updateReminder(id, body);
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
  if (!(await ensureOwner(TableName.REMINDERS, id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }
  await deleteReminder(id);
  return NextResponse.json({ success: true });
}
