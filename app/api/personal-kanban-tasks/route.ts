import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getPersonalKanbanTasksByBoard,
  createPersonalKanbanTask,
  updatePersonalKanbanTask,
  deletePersonalKanbanTask,
  getPersonalKanbanTaskById,
} from "@/lib/models";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createTaskSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  comment: z.string().max(2000).optional(),
  ownerId: z.string().min(1).optional(),
});

const updateTaskSchema = z.object({
  id: z.string().min(1),
  boardId: z.string().min(1).optional(),
  columnId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
  comment: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const boardId = request.nextUrl.searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "boardId обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const tasks = await getPersonalKanbanTasksByBoard(boardId);
      return NextResponse.json(tasks.filter((t) => t.ownerId === uid));
    } catch {
      return NextResponse.json([]);
    }
  }

  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const task = await createPersonalKanbanTask({
      id: crypto.randomUUID(),
      ...parsed.data,
      completed: false,
      ownerId: uid,
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания задачи" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = updateTaskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  try {
    const { id, ...data } = parsed.data;
    const existing = await getPersonalKanbanTaskById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    const task = await updatePersonalKanbanTask(id, data);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Ошибка обновления задачи" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { id } = await request.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  try {
    const existing = await getPersonalKanbanTaskById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    await deletePersonalKanbanTask(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления задачи" },
      { status: 500 },
    );
  }
}
