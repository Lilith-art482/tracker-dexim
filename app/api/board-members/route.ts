import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getBoardMembersByBoardId,
  createBoardMember,
  deleteBoardMember,
} from "@/lib/models";
import { mockBoardMembers } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createBoardMemberSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  userId: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const boardId = request.nextUrl.searchParams.get("boardId");
  if (!boardId) {
    return NextResponse.json({ error: "boardId обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const members = await getBoardMembersByBoardId(boardId);
      return NextResponse.json(members);
    } catch (error) {
      console.error("Ошибка получения участников:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 },
      );
    }
  }

  const filtered = mockBoardMembers.filter((m) => m.boardId === boardId);
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
    const parsed = createBoardMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const member = await createBoardMember({
      id: crypto.randomUUID(),
      boardId: parsed.data.boardId,
      name: parsed.data.name || "",
      userId: parsed.data.userId,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Ошибка добавления участника:", error);
    return NextResponse.json(
      { error: "Ошибка добавления участника" },
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

    await deleteBoardMember(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления участника:", error);
    return NextResponse.json(
      { error: "Ошибка удаления участника" },
      { status: 500 },
    );
  }
}
