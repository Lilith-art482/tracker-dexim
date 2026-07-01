import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllBoards, createBoard, getBoardsByUser, updateBoard, deleteBoard } from "@/lib/models";
import { mockBoards } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createBoardSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function GET(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  const url = new URL(request.url);
  const uid = url.searchParams.get("uid");

  if (dbAvailable) {
    try {
      const boards = uid ? await getBoardsByUser(uid) : await getAllBoards();
      return NextResponse.json(boards);
    } catch (error) {
      console.error("Ошибка получения досок:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockBoards);
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
    const parsed = createBoardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }


    const ownerId = body.ownerId || null;
    const board = await createBoard({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      ownerId: ownerId || undefined,
      members: ownerId ? [ownerId] : [],
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания доски:", error);
    return NextResponse.json(
      { error: "Ошибка создания доски" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json({ error: "База данных недоступна" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { id, name } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    }
    const updated = await updateBoard(id, { name });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления доски:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json({ error: "База данных недоступна" }, { status: 503 });
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
