import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getContentTasksByOwner,
  getContentTaskById,
  createContentTask,
  updateContentTask,
  deleteContentTask,
} from "@/lib/models";
import { mockContentTasks } from "@/lib/mock-data";
import {
  createContentTaskSchema,
  updateContentTaskSchema,
} from "@/lib/validation/content";

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
      let tasks = await getContentTasksByOwner(uid);
      if (boardId) {
        tasks = tasks.filter((t) => t.boardId === boardId);
      }
      return NextResponse.json(tasks);
    } catch {
      return NextResponse.json([]);
    }
  }

  // static/mock mode
  let filtered = mockContentTasks.filter(
    (t) => t.ownerId === uid || !t.ownerId,
  );
  if (boardId) {
    filtered = filtered.filter((t) => t.boardId === boardId);
  }
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const parsed = createContentTaskSchema.safeParse(await request.json());
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
    const task = await createContentTask({
      id: crypto.randomUUID(),
      ...parsed.data,
      completed: false,
      ownerId: uid,
    });
    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания контента" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = updateContentTaskSchema.safeParse(await request.json());
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
    const existing = await getContentTaskById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    const task = await updateContentTask(id, data);
    return NextResponse.json(task);
  } catch {
    return NextResponse.json(
      { error: "Ошибка обновления контента" },
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
    const existing = await getContentTaskById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    await deleteContentTask(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления контента" },
      { status: 500 },
    );
  }
}
