import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllBoards, createBoard } from "@/lib/models";
import { mockBoards } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

const createBoardSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const boards = await getAllBoards();
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

    const board = await createBoard({
      id: crypto.randomUUID(),
      name: parsed.data.name,
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
