import { NextRequest, NextResponse } from "next/server";
import { createReminderSchema } from "@/lib/habit-schema";
import {
  getAllReminders,
  createReminder,
  updateReminder,
  deleteReminder,
} from "@/lib/habit-models";

export async function GET() {
  const reminders = await getAllReminders();
  return NextResponse.json(reminders);
}

export async function POST(request: NextRequest) {
  const parsed = createReminderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const reminder = await createReminder(parsed.data);
  return NextResponse.json(reminder, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  const body = await request.json();
  const updated = await updateReminder(id, body);
  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  await deleteReminder(id);
  return NextResponse.json({ success: true });
}
