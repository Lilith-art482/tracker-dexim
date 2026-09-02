import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { createNoteSchema, updateNoteSchema } from "@/lib/validation/notes";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/models";
import { isDatabaseAvailable } from "@/lib/db";
import type { Note } from "@/lib/types";

const mockNotes: Note[] = [
  {
    id: "mock-note-1",
    title: "Добро пожаловать в заметки",
    blocks: [
      {
        id: "b1",
        type: "heading2",
        content: "Как пользоваться",
      },
      {
        id: "b2",
        type: "paragraph",
        content:
          "Это ваш первый блокнот. Здесь вы можете создавать заметки с разными типами блоков.",
      },
      {
        id: "b3",
        type: "bulletList",
        content: "Нажмите / для выбора типа блока",
      },
      {
        id: "b4",
        type: "bulletList",
        content: "Используйте тулбар для форматирования",
      },
      {
        id: "b5",
        type: "bulletList",
        content: "Добавляйте теги для категоризации",
      },
      {
        id: "b6",
        type: "divider",
        content: "",
      },
      {
        id: "b7",
        type: "quote",
        content: "Заметки сохраняются автоматически",
      },
    ],
    tags: ["инструкция", "старт"],
    userId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const note = await getNoteById(uid, id);
    if (!note)
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    return NextResponse.json(note);
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(mockNotes.map((n) => ({ ...n, userId: uid })));
  }

  const notes = await getAllNotes(uid);
  return NextResponse.json(notes);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = createNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const note = await createNote(uid, parsed.data);
  return NextResponse.json(note, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const parsed = updateNoteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Некорректные данные", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const { id, ...data } = parsed.data;
  const updated = await updateNote(uid, id, data);
  if (!updated)
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "id обязателен" }, { status: 400 });

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const deleted = await deleteNote(uid, id);
  if (!deleted)
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ success: true });
}
