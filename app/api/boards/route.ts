import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getBoardsByUser,
  createBoard,
  createColumn,
  updateBoard,
  deleteBoard,
} from "@/lib/models";
import { mockBoards } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createBoardSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["personal", "team"]).default("team"),
});

export async function GET(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");

  // uid обязателен для безопасности
  if (!uid) {
    return NextResponse.json(
      { error: "Требуется авторизация" },
      { status: 401 },
    );
  }

  if (dbAvailable) {
    try {
      const boards = await getBoardsByUser(uid);
      return NextResponse.json(boards);
    } catch (error) {
      console.error("Ошибка получения досок:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 },
      );
    }
  }

  // Static fallback - filter by uid
  const filtered = mockBoards.filter(
    (b) => b.ownerId === uid || b.members?.includes(uid),
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
    const parsed = createBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const ownerId = body.ownerId || null;
    const boardId = crypto.randomUUID();
    const board = await createBoard({
      id: boardId,
      name: parsed.data.name,
      type: parsed.data.type,
      ownerId: ownerId || undefined,
      members: ownerId ? [ownerId] : [],
    });

    if (parsed.data.type === "team") {
      const defaultColumns = [
        { name: "Надо сделать", order: 0 },
        { name: "В работе", order: 1 },
        { name: "Завершено", order: 2 },
        { name: "Отправлено в архив", order: 3 },
      ];
      await Promise.all(
        defaultColumns.map((col) =>
          createColumn({
            id: crypto.randomUUID(),
            boardId,
            name: col.name,
            order: col.order,
          }),
        ),
      );
    }

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания доски:", error);
    return NextResponse.json(
      { error: "Ошибка создания доски" },
      { status: 500 },
    );
  }
}

const updateBoardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  pinned: z.boolean().optional(),
  order: z.number().optional(),
});

export async function PATCH(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const parsed = updateBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id, ...data } = parsed.data;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v ?? undefined;
    }
    const updated = await updateBoard(
      id,
      clean as Parameters<typeof updateBoard>[1],
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления доски:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    }
    await deleteBoard(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления доски:", error);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
