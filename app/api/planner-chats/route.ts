import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getPlannerChatsByOwner,
  getPlannerChatById,
  upsertPlannerChat,
  deletePlannerChat,
} from "@/lib/models";
import {
  upsertPlannerChatSchema,
  deletePlannerChatSchema,
} from "@/lib/validation/planner-chat";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedUid = url.searchParams.get("uid");
  const authResult = await requireAuth(request, requestedUid);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      const chats = await getPlannerChatsByOwner(uid);
      return NextResponse.json(chats);
    } catch {
      return NextResponse.json([]);
    }
  }

  return NextResponse.json([]);
}

export async function POST(request: NextRequest) {
  const parsed = upsertPlannerChatSchema.safeParse(await request.json());
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

  const chat = { ...parsed.data.chat, ownerId: uid };
  try {
    await upsertPlannerChat(chat);
    return NextResponse.json(chat, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка сохранения чата" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = deletePlannerChatSchema.safeParse(await request.json());
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
    const existing = await getPlannerChatById(parsed.data.id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    await deletePlannerChat(parsed.data.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления чата" },
      { status: 500 },
    );
  }
}
