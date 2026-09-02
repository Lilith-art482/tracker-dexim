import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getPersonalTasksByOwner,
  createPersonalTask,
  updatePersonalTask,
  deletePersonalTask,
  getPersonalTaskById,
  cleanupExpiredPersonalTasks,
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
  const requestedUid = url.searchParams.get("uid");
  const authResult = await requireAuth(request, requestedUid);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;
  const boardId = url.searchParams.get("boardId");
  if (dbAvailable) {
    try {
      await cleanupExpiredPersonalTasks(uid);
      let tasks = await getPersonalTasksByOwner(uid);
      if (boardId) {
        tasks = tasks.filter((t) => t.boardId === boardId);
      }
      return NextResponse.json(tasks);
    } catch {
      return NextResponse.json([]);
    }
  }

  // in static/mock mode, uid comes from the token
  let filtered = mockPersonalTasks.filter(
    (t) => t.ownerId === uid || !t.ownerId,
  );
  if (boardId) {
    filtered = filtered.filter((t) => t.boardId === boardId);
  }
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createPersonalTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  try {
    const task = await createPersonalTask({
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

  const parsed = updatePersonalTaskSchema.safeParse(await request.json());
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
    const existing = await getPersonalTaskById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    const task = await updatePersonalTask(id, data);
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
    const existing = await getPersonalTaskById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    await deletePersonalTask(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления задачи" },
      { status: 500 },
    );
  }
}
