import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getTasksByColumnId,
  getArchivedTasks,
  getAllBoardTasks,
  createTask,
  updateTask,
  deleteTask,
  getBoardMembersByBoardId,
  cleanupExpiredArchivedTasks,
} from "@/lib/models";
import { mockTasks, mockBoardMembers } from "@/lib/mock-data";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function checkBoardAccess(
  boardId: string,
  uid: string | null,
): Promise<boolean> {
  if (!uid) return false;

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const members = await getBoardMembersByBoardId(boardId);
      return members.some((m) => m.userId === uid);
    } catch {
      return false;
    }
  }

  // Static fallback
  const members = mockBoardMembers.filter((m) => m.boardId === boardId);
  return members.some((m) => m.userId === uid);
}

export async function GET(request: NextRequest) {
  const archived = request.nextUrl.searchParams.get("archived");
  const boardId = request.nextUrl.searchParams.get("boardId");
  const uid = request.nextUrl.searchParams.get("uid");

  if (archived === "true") {
    if (!boardId) {
      return NextResponse.json(
        { error: "boardId обязателен для архива" },
        { status: 400 },
      );
    }

    if (!(await checkBoardAccess(boardId, uid))) {
      return NextResponse.json(
        { error: "Нет доступа к доске" },
        { status: 403 },
      );
    }

    const dbAvailable = await isDatabaseAvailable();

    if (dbAvailable) {
      try {
        await cleanupExpiredArchivedTasks();
        const tasks = await getArchivedTasks(boardId);
        return NextResponse.json(tasks);
      } catch (error) {
        console.error("Ошибка получения архивированных задач:", error);
        return NextResponse.json(
          { error: "Ошибка получения данных из Firestore" },
          { status: 500 },
        );
      }
    }

    const filtered = mockTasks.filter(
      (t) => t.archived && t.boardId === boardId,
    );
    return NextResponse.json(filtered);
  }

  const all = request.nextUrl.searchParams.get("all");
  if (all === "true") {
    if (!boardId) {
      return NextResponse.json(
        { error: "boardId обязателен" },
        { status: 400 },
      );
    }

    if (!(await checkBoardAccess(boardId, uid))) {
      return NextResponse.json(
        { error: "Нет доступа к доске" },
        { status: 403 },
      );
    }

    const dbAvailable = await isDatabaseAvailable();

    if (dbAvailable) {
      try {
        const tasks = await getAllBoardTasks(boardId);
        return NextResponse.json(tasks);
      } catch (error) {
        console.error("Ошибка получения всех задач:", error);
        return NextResponse.json(
          { error: "Ошибка получения данных из Firestore" },
          { status: 500 },
        );
      }
    }

    const filtered = mockTasks.filter(
      (t) => t.boardId === boardId && !t.archived,
    );
    return NextResponse.json(filtered);
  }

  const columnId = request.nextUrl.searchParams.get("columnId");

  if (!columnId || !boardId) {
    return NextResponse.json(
      { error: "columnId и boardId обязательны" },
      { status: 400 },
    );
  }

  if (!(await checkBoardAccess(boardId, uid))) {
    return NextResponse.json({ error: "Нет доступа к доске" }, { status: 403 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const tasks = await getTasksByColumnId(boardId, columnId);
      console.log(
        `[api/tasks GET] boardId=${boardId}, columnId=${columnId}, found=${tasks.length}`,
      );
      return NextResponse.json(tasks);
    } catch (error) {
      console.error("Ошибка получения задач:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 },
      );
    }
  }

  const filtered = mockTasks.filter(
    (t) => t.columnId === columnId && t.boardId === boardId && !t.archived,
  );
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (!parsed.data.boardId) {
      return NextResponse.json(
        { error: "boardId обязателен" },
        { status: 400 },
      );
    }

    const task = await createTask(
      {
        id: crypto.randomUUID(),
        boardId: parsed.data.boardId,
        columnId: parsed.data.columnId,
        title: parsed.data.title.trim(),
        description: parsed.data.description,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        assignee: parsed.data.assignee,
        assignees: parsed.data.assignees,
        priority: parsed.data.priority,
        completed: false,
        archived: false,
        archivedAt: null,
      },
      parsed.data.boardId,
    );
    console.log(
      `[api/tasks POST] created task ${task.id} in column ${task.columnId}`,
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания задачи:", error);
    return NextResponse.json(
      { error: "Ошибка создания задачи" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    let { id, boardId, columnId, newColumnId, ...data } = parsed.data;

    if (!boardId || !columnId) {
      return NextResponse.json(
        { error: "boardId и columnId обязательны" },
        { status: 400 },
      );
    }

    if (data.archived === true) {
      data.archivedAt = new Date().toISOString();
    } else if (data.archived === false) {
      data.archivedAt = null;
    }

    let task;
    if (newColumnId && newColumnId !== columnId) {
      // Перемещение задачи между колонками
      const existing = await getTasksByColumnId(boardId, columnId);
      const current = existing.find((t) => t.id === id);
      if (!current) {
        return NextResponse.json(
          { error: "Задача не найдена" },
          { status: 404 },
        );
      }
      await deleteTask(boardId, columnId, id);
      const rest = {
        id: current.id,
        title: current.title,
        description: current.description,
        startDate: current.startDate,
        endDate: current.endDate,
        assignee: current.assignee,
        assignees: current.assignees,
        priority: current.priority,
        completed: current.completed,
        archived: current.archived,
        archivedAt: current.archivedAt,
        columnId: current.columnId,
        boardId,
      };
      task = await createTask(
        {
          ...rest,
          ...data,
          columnId: newColumnId,
        },
        boardId,
      );
    } else {
      task = await updateTask(id, data, boardId, columnId);
    }
    console.log(`[api/tasks PATCH] updated task ${id}`, data);
    return NextResponse.json(task);
  } catch (error) {
    console.error("Ошибка обновления задачи:", error);
    return NextResponse.json(
      { error: "Ошибка обновления задачи" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Поле id обязательно" },
        { status: 400 },
      );
    }

    if (!body.boardId || !body.columnId) {
      return NextResponse.json(
        { error: "boardId и columnId обязательны" },
        { status: 400 },
      );
    }

    await deleteTask(body.boardId, body.columnId, body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления задачи:", error);
    return NextResponse.json(
      { error: "Ошибка удаления задачи" },
      { status: 500 },
    );
  }
}
