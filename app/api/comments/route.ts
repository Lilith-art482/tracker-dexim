
import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getCommentsByTaskId, createComment } from "@/lib/models";
import { mockComments } from "@/lib/mock-data";
import { createCommentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const comments = await getCommentsByTaskId(taskId);
      return NextResponse.json(comments);
    } catch (error) {
      console.error("Ошибка получения комментариев:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 }
      );
    }
  }

  const filtered = mockComments.filter((c) => c.taskId === taskId);
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
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const comment = await createComment({
      id: crypto.randomUUID(),
      taskId: parsed.data.taskId,
      author: parsed.data.author.trim(),
      text: parsed.data.text.trim(),
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания комментария:", error);
    return NextResponse.json(
      { error: "Ошибка создания комментария" },
      { status: 500 }
    );
  }
}
