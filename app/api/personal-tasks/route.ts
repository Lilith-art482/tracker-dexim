import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllPersonalTasks,
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

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const tasks = await getAllPersonalTasks();
      return NextResponse.json(tasks);
    } catch {
      return NextResponse.json(mockPersonalTasks);
    }
  }
  return NextResponse.json(mockPersonalTasks);
}

export async function POST(request: NextRequest) {
  const parsed = createPersonalTaskSchema.safeParse(await request.json());
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
    const task = await createPersonalTask({
      id: crypto.randomUUID(),
      ...parsed.data,
      completed: false,
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
