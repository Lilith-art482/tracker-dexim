import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getPersonalPlanEntriesByOwner,
  createPersonalPlanEntry,
  updatePersonalPlanEntry,
  deletePersonalPlanEntry,
  getPersonalPlanEntryById,
} from "@/lib/models";
import { mockPersonalPlanEntries } from "@/lib/mock-data";
import {
  createPersonalPlanEntrySchema,
  updatePersonalPlanEntrySchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedUid = url.searchParams.get("uid");
  const authResult = await requireAuth(request, requestedUid);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;
  const date = url.searchParams.get("date");
  const boardId = url.searchParams.get("boardId");

  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      let entries = await getPersonalPlanEntriesByOwner(uid);
      if (boardId) {
        entries = entries.filter((e) => e.boardId === boardId);
      }
      if (date) {
        entries = entries.filter((e) => e.date === date);
      }
      return NextResponse.json(entries);
    } catch {
      return NextResponse.json([]);
    }
  }

  let filtered = mockPersonalPlanEntries.filter(
    (e) => e.ownerId === uid || !e.ownerId,
  );
  if (boardId) {
    filtered = filtered.filter((e) => e.boardId === boardId);
  }
  if (date) {
    filtered = filtered.filter((e) => e.date === date);
  }
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createPersonalPlanEntrySchema.safeParse(body);
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
    const today = new Date().toISOString().split("T")[0];
    const todayDate = new Date(today + "T00:00:00Z");
    const entryDate = new Date(parsed.data.date + "T00:00:00Z");
    const diffDays = Math.round(
      (entryDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < -7 || diffDays > 7) {
      return NextResponse.json(
        {
          error:
            "План можно создать только в диапазоне ±7 дней от текущей даты",
        },
        { status: 400 },
      );
    }

    const entry = await createPersonalPlanEntry({
      id: crypto.randomUUID(),
      ...parsed.data,
      completed: false,
      ownerId: uid,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ошибка создания записи" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = updatePersonalPlanEntrySchema.safeParse(await request.json());
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
    const existing = await getPersonalPlanEntryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    const entry = await updatePersonalPlanEntry(id, data);
    return NextResponse.json(entry);
  } catch {
    return NextResponse.json(
      { error: "Ошибка обновления записи" },
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
    const existing = await getPersonalPlanEntryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (existing.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    await deletePersonalPlanEntry(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Ошибка удаления записи" },
      { status: 500 },
    );
  }
}
