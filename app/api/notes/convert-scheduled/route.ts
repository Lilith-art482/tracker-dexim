import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllNotes,
  getPersonalTasksByOwner,
  createPersonalTask,
  updateNote,
} from "@/lib/models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, timezoneOffset } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
    }

    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return NextResponse.json({ tasks: [] });
    }

    const notes = await getAllNotes(uid);
    const existingTasks = await getPersonalTasksByOwner(uid);
    const existingNoteTaskMap = new Map<string, string[]>();
    for (const t of existingTasks) {
      if (t.sourceNoteId) {
        const arr = existingNoteTaskMap.get(t.sourceNoteId) || [];
        arr.push(t.date);
        existingNoteTaskMap.set(t.sourceNoteId, arr);
      }
    }

    // Compute user's local time from timezoneOffset (minutes, e.g. -180 for UTC+3)
    const offset = typeof timezoneOffset === "number" ? timezoneOffset : 0;
    const now = new Date();
    const localMs = now.getTime() - offset * 60 * 1000;
    const localDate = new Date(localMs);
    const y = localDate.getUTCFullYear();
    const m = String(localDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(localDate.getUTCDate()).padStart(2, "0");
    const today = `${y}-${m}-${d}`;
    const currentTime = `${String(localDate.getUTCHours()).padStart(2, "0")}:${String(localDate.getUTCMinutes()).padStart(2, "0")}`;

    const createdTasks = [];

    for (const note of notes) {
      if (!note.scheduledDate || !note.scheduledTime) continue;
      if (note.scheduledDate > today) continue;
      if (note.scheduledDate === today && note.scheduledTime > currentTime)
        continue;

      const existingDates = existingNoteTaskMap.get(note.id) || [];
      if (existingDates.includes(note.scheduledDate)) continue;

      const endH = parseInt(note.scheduledTime.split(":")[0], 10) + 1;
      const endTime = `${String(endH).padStart(2, "0")}:${note.scheduledTime.split(":")[1]}`;

      const task = await createPersonalTask({
        id: crypto.randomUUID(),
        date: note.scheduledDate,
        startTime: note.scheduledTime,
        endTime,
        title: note.title || "Без названия",
        priority: "medium",
        completed: false,
        sourceNoteId: note.id,
        ownerId: uid,
      });

      let nextDate: string | null = null;
      let nextTime: string | null = null;

      if (note.recurringInterval) {
        // Advance date using local timezone offset
        const utcMidnight = new Date(
          note.scheduledDate + "T00:00:00Z",
        ).getTime();
        const localMidnight = utcMidnight + offset * 60 * 1000;
        const local = new Date(localMidnight);
        switch (note.recurringInterval) {
          case "daily":
            local.setUTCDate(local.getUTCDate() + 1);
            break;
          case "weekly":
            local.setUTCDate(local.getUTCDate() + 7);
            break;
          case "monthly":
            local.setUTCMonth(local.getUTCMonth() + 1);
            break;
        }
        const nextUtc = new Date(local.getTime() - offset * 60 * 1000);
        nextDate = nextUtc.toISOString().split("T")[0];
        nextTime = note.scheduledTime;
      }

      await updateNote(uid, note.id, {
        scheduledDate: nextDate,
        scheduledTime: nextTime,
      });

      createdTasks.push(task);
    }

    return NextResponse.json({ tasks: createdTasks });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Convert scheduled notes error:", err.message);
    return NextResponse.json(
      { error: "Ошибка конвертации заметок" },
      { status: 500 },
    );
  }
}
