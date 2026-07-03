import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllPersonalTasks,
  getPersonalTasksByOwner,
  createPersonalTask,
  updatePersonalTask,
  deletePersonalTask,
} from "@/lib/models";
import { mockPersonalTasks } from "@/lib/mock-data";
import {
  createPersonalTaskSchema,
  updatePersonalTaskSchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");
  if (dbAvailable) {
    try {
      if (!uid) return NextResponse.json([]);
      const tasks = await getPersonalTasksByOwner(uid);
      return NextResponse.json(tasks);
    } catch {
      return NextResponse.json([]);
    }
  }

  // in static/mock mode, require uid to avoid exposing all personal tasks
  if (!uid) return NextResponse.json([]);
  const filtered = mockPersonalTasks.filter((t) => t.ownerId === uid || !t.ownerId);
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createPersonalTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  try {
    const ownerId = parsed.success ? parsed.data.ownerId || body.ownerId || null : body.ownerId || null;
    if (!ownerId || typeof ownerId !== "string") {
      return NextResponse.json({ error: "ownerId обязателен" }, { status: 400 });
    }

    const task = await createPersonalTask({
      id: crypto.randomUUID(),
      ...parsed.data,
      completed: false,
      ownerId: ownerId,
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания задачи" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const parsed = updatePersonalTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  try {
    const { id, ...data } = parsed.data;
    const task = await updatePersonalTask(id, data);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Ошибка обновления задачи" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 }
    );
  }

  try {
    await deletePersonalTask(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления задачи" },
      { status: 500 }
    );
  }
}
