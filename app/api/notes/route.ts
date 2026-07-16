import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { createNoteSchema, updateNoteSchema } from "@/lib/validation/notes";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "@/lib/models";
import { mockNotes } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get("uid");
    const noteId = request.nextUrl.searchParams.get("noteId");

    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const dbAvailable = await isDatabaseAvailable();

    if (noteId) {
      if (!dbAvailable) {
        const found = mockNotes.find((n) => n.id === noteId && n.userId === uid);
        if (!found) {
          return NextResponse.json({ error: "Заметка не найдена" }, { status: 404 });
        }
        return NextResponse.json(found);
      }
      const note = await getNoteById(uid, noteId);
      if (!note) {
        return NextResponse.json({ error: "Заметка не найдена" }, { status: 404 });
      }
      return NextResponse.json(note);
    }

    if (!dbAvailable) {
      return NextResponse.json(
        mockNotes.filter((n) => n.userId === uid),
      );
    }

    const notes = await getAllNotes(uid);
    return NextResponse.json(notes);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Get notes error:", err.message);
    return NextResponse.json(
      { error: "Ошибка получения заметок" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, ...noteData } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const parsed = createNoteSchema.safeParse(noteData);
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

    const note = await createNote(uid, parsed.data);
    return NextResponse.json(note, { status: 201 });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Create note error:", err.message);
    return NextResponse.json(
      { error: "Ошибка создания заметки" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, noteId, ...noteData } = body;

    if (!uid || !noteId) {
      return NextResponse.json(
        { error: "uid и noteId обязательны" },
        { status: 400 },
      );
    }

    const parsed = updateNoteSchema.safeParse(noteData);
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

    const note = await updateNote(uid, noteId, parsed.data);
    if (!note) {
      return NextResponse.json(
        { error: "Заметка не найдена" },
        { status: 404 },
      );
    }

    return NextResponse.json(note);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Update note error:", err.message);
    return NextResponse.json(
      { error: "Ошибка обновления заметки" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, noteId } = body;

    if (!uid || !noteId) {
      return NextResponse.json(
        { error: "uid и noteId обязательны" },
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

    const deleted = await deleteNote(uid, noteId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Заметка не найдена" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Delete note error:", err.message);
    return NextResponse.json(
      { error: "Ошибка удаления заметки" },
      { status: 500 },
    );
  }
}
