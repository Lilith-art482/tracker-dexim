import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getTasksByColumnId,
  getArchivedTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/models";
import { mockTasks } from "@/lib/mock-data";
import { createTaskSchema, updateTaskSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const archived = request.nextUrl.searchParams.get("archived");
  const boardId = request.nextUrl.searchParams.get("boardId");
  
  if (archived === "true") {
    if (!boardId) {
      return NextResponse.json({ error: "boardId обязателен для архива" }, { status: 400 });
    }
    
    const dbAvailable = await isDatabaseAvailable();

    if (dbAvailable) {
      try {
        const tasks = await getArchivedTasks(boardId);
        return NextResponse.json(tasks);
      } catch (error) {
        console.error("Ошибка получения архивированных задач:", error);
        return NextResponse.json(
          { error: "Ошибка получения данных из Firestore" },
          { status: 500 }
        );
      }
    }

    const filtered = mockTasks.filter((t) => t.archived);
    return NextResponse.json(filtered);
  }

  const columnId = request.nextUrl.searchParams.get("columnId");
  
  if (!columnId || !boardId) {
    return NextResponse.json({ error: "columnId и boardId обязательны" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const tasks = await getTasksByColumnId(boardId, columnId);
      console.log(`[api/tasks GET] boardId=${boardId}, columnId=${columnId}, found=${tasks.length}`);
      return NextResponse.json(tasks);
    } catch (error) {
      console.error("Ошибка получения задач:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 }
      );
    }
  }

  const filtered = mockTasks.filter(
    (t) => t.columnId === columnId && !t.archived
  );
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
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
        { status: 400 }
      );
    }

    if (!parsed.data.boardId) {
      return NextResponse.json(
        { error: "boardId обязателен" },
        { status: 400 }
      );
    }

    const task = await createTask({
      id: crypto.randomUUID(),
      columnId: parsed.data.columnId,
      title: parsed.data.title.trim(),
      description: parsed.data.description,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      assignee: parsed.data.assignee,
      completed: false,
      archived: false,
    }, parsed.data.boardId);
    console.log(`[api/tasks POST] created task ${task.id} in column ${task.columnId}`);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания задачи:", error);
    return NextResponse.json(
      { error: "Ошибка создания задачи" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
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
        { status: 400 }
      );
    }

    const { id, boardId, columnId, ...data } = parsed.data;
    
    if (!boardId || !columnId) {
      return NextResponse.json(
        { error: "boardId и columnId обязательны" },
        { status: 400 }
      );
    }
    
    const task = await updateTask(id, data, boardId, columnId);
    console.log(`[api/tasks PATCH] updated task ${id}`, data);
    return NextResponse.json(task);
  } catch (error) {
    console.error("Ошибка обновления задачи:", error);
    return NextResponse.json(
      { error: "Ошибка обновления задачи" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json(
        { error: "Поле id обязательно" },
        { status: 400 }
      );
    }
    
    if (!body.boardId || !body.columnId) {
      return NextResponse.json(
        { error: "boardId и columnId обязательны" },
        { status: 400 }
      );
    }

    await deleteTask(body.boardId, body.columnId, body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления задачи:", error);
    return NextResponse.json(
      { error: "Ошибка удаления задачи" },
      { status: 500 }
    );
  }
}
