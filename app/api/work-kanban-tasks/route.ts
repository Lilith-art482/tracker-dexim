import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getWorkKanbanTasksByOwner,
  createWorkKanbanTask,
  updateWorkKanbanTask,
  deleteWorkKanbanTask,
} from "@/lib/models";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createTaskSchema = z.object({
  boardId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1).max(200),
  priority: z.enum(["low", "medium", "high", "none"]).default("none"),
  color: z.string().optional(),
  comment: z.string().max(2000).optional(),
  workType: z.enum(["content", "dev"]),
});

const updateTaskSchema = z.object({
  id: z.string().min(1),
  boardId: z.string().min(1).optional(),
  columnId: z.string().min(1).optional(),
  title: z.string().min(1).max(200).optional(),
  priority: z.enum(["low", "medium", "high", "none"]).optional(),
  color: z.string().optional(),
  completed: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
  comment: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const workType = request.nextUrl.searchParams.get("workType") as "content" | "dev" | null;
  if (!workType) {
    return NextResponse.json({ error: "workType обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const tasks = await getWorkKanbanTasksByOwner(uid, workType);
      return NextResponse.json(tasks);
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
    const task = await createWorkKanbanTask({
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
    const task = await updateWorkKanbanTask(id, data);
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
    await deleteWorkKanbanTask(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления задачи" },
      { status: 500 },
    );
  }
}
