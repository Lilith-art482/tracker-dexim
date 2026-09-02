import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getColumnsByBoardId,
  createColumn,
  updateColumn,
  deleteColumn,
  boardIncludesUser,
} from "@/lib/models";
import { mockColumns } from "@/lib/mock-data";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createColumnSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().min(1).max(200),
  order: z.number().int().min(0),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const updateColumnSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

async function checkColumnBoardAccess(
  boardId: string,
  uid: string | null,
): Promise<boolean> {
  if (!uid) return false;
  return boardIncludesUser(boardId, uid);
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const boardId = request.nextUrl.searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "boardId обязателен" }, { status: 400 });
  }

  if (!(await checkColumnBoardAccess(boardId, uid))) {
    return NextResponse.json({ error: "Нет доступа к доске" }, { status: 403 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const columns = await getColumnsByBoardId(boardId);
      return NextResponse.json(columns);
    } catch (error) {
      console.error("Ошибка получения колонок:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 },
      );
    }
  }

  const filtered = mockColumns.filter((c) => c.boardId === boardId);
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createColumnSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (!(await checkColumnBoardAccess(parsed.data.boardId, uid))) {
      return NextResponse.json(
        { error: "Нет доступа к доске" },
        { status: 403 },
      );
    }

    const column = await createColumn({
      id: crypto.randomUUID(),
      boardId: parsed.data.boardId,
      name: parsed.data.name.trim(),
      order: parsed.data.order,
      icon: parsed.data.icon,
      color: parsed.data.color,
    });

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания колонки:", error);
    return NextResponse.json(
      { error: "Ошибка создания колонки" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

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

    if (!body.boardId || typeof body.boardId !== "string") {
      return NextResponse.json(
        { error: "Поле boardId обязательно" },
        { status: 400 },
      );
    }

    if (!(await checkColumnBoardAccess(body.boardId, uid))) {
      return NextResponse.json(
        { error: "Нет доступа к доске" },
        { status: 403 },
      );
    }

    const parsed = updateColumnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const column = await updateColumn(body.id, parsed.data, body.boardId);
    return NextResponse.json(column);
  } catch (error) {
    console.error("Ошибка обновления колонки:", error);
    return NextResponse.json(
      { error: "Ошибка обновления колонки" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

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

    if (!body.boardId || typeof body.boardId !== "string") {
      return NextResponse.json(
        { error: "Поле boardId обязательно" },
        { status: 400 },
      );
    }

    if (!(await checkColumnBoardAccess(body.boardId, uid))) {
      return NextResponse.json(
        { error: "Нет доступа к доске" },
        { status: 403 },
      );
    }

    await deleteColumn(body.boardId, body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления колонки:", error);
    return NextResponse.json(
      { error: "Ошибка удаления колонки" },
      { status: 500 },
    );
  }
}
