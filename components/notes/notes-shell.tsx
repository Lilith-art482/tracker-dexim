"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import type { Note } from "@/lib/models";
import { NoteList } from "./note-list";
import { BlockEditor, type Block } from "./block-editor";
import type { CanvasState } from "@/lib/models";

function createEmptyNote(): {
  title: string;
  blocks: Block[];
  tags: string[];
} {
  return {
    title: "",
    blocks: [{ id: "b-init", type: "paragraph", content: "" }],
    tags: [],
  };
}

export function NotesShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get("noteId");
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showLeft, setShowLeft] = useState(true);
  const [showCenter, setShowCenter] = useState(true);

  // Editing state
  const [editTitle, setEditTitle] = useState("");
  const [editBlocks, setEditBlocks] = useState<Block[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editScheduledDate, setEditScheduledDate] = useState<string | null>(
    null,
  );
  const [editScheduledTime, setEditScheduledTime] = useState<string | null>(
    null,
  );
  const [editRecurringInterval, setEditRecurringInterval] = useState<
    string | null
  >(null);
  const [editCanvasState, setEditCanvasState] = useState<CanvasState | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalNoteRef = useRef<string>("");

  const noteIdParamRef = useRef(noteIdParam);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/auth");
        return;
      }
      setUid(user.uid);
      try {
        const res = await fetch(`/api/notes?uid=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          setNotes(data);
          // Auto-select note if noteIdParam is present
          if (noteIdParamRef.current) {
            const target = data.find(
              (n: Note) => n.id === noteIdParamRef.current,
            );
            if (target) {
              setSelectedId(target.id);
              setEditTitle(target.title);
              setEditBlocks(target.blocks as Block[]);
              setEditTags(target.tags || []);
              setEditScheduledDate(target.scheduledDate ?? null);
              setEditScheduledTime(target.scheduledTime ?? null);
              setEditRecurringInterval(target.recurringInterval ?? null);
              setEditCanvasState(target.canvasState ?? null);
              originalNoteRef.current = JSON.stringify({
                title: target.title,
                blocks: target.blocks,
                tags: target.tags,
                scheduledDate: target.scheduledDate ?? null,
                scheduledTime: target.scheduledTime ?? null,
                recurringInterval: target.recurringInterval ?? null,
                canvasState: target.canvasState ?? null,
              });
              setHasChanges(false);
              // Clean URL
              window.history.replaceState(null, "", "/notes");
            }
          }
        }
      } catch {
        // fallback
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Auto-save
  const saveNote = useCallback(
    async (
      noteId: string,
      title: string,
      blocks: Block[],
      tags: string[],
      scheduledDate?: string | null,
      scheduledTime?: string | null,
      recurringInterval?: string | null,
      canvasState?: CanvasState | null,
    ) => {
      if (!uid) return;
      setSaving(true);
      try {
        const res = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid,
            noteId,
            title,
            blocks,
            tags,
            scheduledDate: scheduledDate ?? null,
            scheduledTime: scheduledTime ?? null,
            recurringInterval: recurringInterval ?? null,
            canvasState: canvasState ?? null,
          }),
        });
        if (!res.ok) return;
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  title,
                  blocks,
                  tags,
                  scheduledDate: scheduledDate ?? null,
                  scheduledTime: scheduledTime ?? null,
                  recurringInterval: recurringInterval ?? null,
                  canvasState: canvasState ?? null,
                  updatedAt: new Date().toISOString(),
                }
              : n,
          ),
        );
      } catch {
        // silent
      } finally {
        setSaving(false);
      }
    },
    [uid],
  );

  useEffect(() => {
    if (!hasChanges || !selectedId || saving) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveNote(
        selectedId,
        editTitle,
        editBlocks,
        editTags,
        editScheduledDate,
        editScheduledTime,
        editRecurringInterval,
        editCanvasState,
      );
      setHasChanges(false);
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    hasChanges,
    selectedId,
    editTitle,
    editBlocks,
    editTags,
    editScheduledDate,
    editScheduledTime,
    editRecurringInterval,
    editCanvasState,
    saving,
    saveNote,
  ]);

  const handleSelectNote = useCallback(
    (id: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (selectedId && hasChanges) {
        saveNote(
          selectedId,
          editTitle,
          editBlocks,
          editTags,
          editScheduledDate,
          editScheduledTime,
          editRecurringInterval,
        );
      }
      setSelectedId(id);
      const note = notes.find((n) => n.id === id);
      if (note) {
        setEditTitle(note.title);
        setEditBlocks(note.blocks as Block[]);
        setEditTags(note.tags || []);
        setEditScheduledDate(note.scheduledDate ?? null);
        setEditScheduledTime(note.scheduledTime ?? null);
        setEditRecurringInterval(note.recurringInterval ?? null);
        setEditCanvasState(note.canvasState ?? null);
        originalNoteRef.current = JSON.stringify({
          title: note.title,
          blocks: note.blocks,
          tags: note.tags,
          scheduledDate: note.scheduledDate ?? null,
          scheduledTime: note.scheduledTime ?? null,
          recurringInterval: note.recurringInterval ?? null,
          canvasState: note.canvasState ?? null,
        });
        setHasChanges(false);
      }
      // On mobile-ish, auto-show editor
      if (window.innerWidth < 768) {
        setShowLeft(false);
        setShowCenter(false);
      }
    },
    [notes, selectedId, hasChanges, editTitle, editBlocks, editTags, saveNote],
  );

  const handleNewNote = useCallback(async () => {
    if (!uid) return;
    const empty = createEmptyNote();
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, ...empty }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error || "Ошибка создания заметки");
        return;
      }
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setSelectedId(note.id);
      setEditTitle(note.title);
      setEditBlocks(note.blocks as Block[]);
      setEditTags(note.tags || []);
      setEditScheduledDate(note.scheduledDate ?? null);
      setEditScheduledTime(note.scheduledTime ?? null);
      setEditRecurringInterval(note.recurringInterval ?? null);
      setEditCanvasState(note.canvasState ?? null);
      originalNoteRef.current = JSON.stringify({
        title: note.title,
        blocks: note.blocks,
        tags: note.tags,
        scheduledDate: note.scheduledDate ?? null,
        scheduledTime: note.scheduledTime ?? null,
        recurringInterval: note.recurringInterval ?? null,
        canvasState: note.canvasState ?? null,
      });
      setHasChanges(false);
      toast.success("Заметка создана");
    } catch {
      toast.error("Ошибка создания заметки");
    }
  }, [uid]);

  const handleDeleteNote = useCallback(
    async (id: string) => {
      if (!uid) return;
      setDeletingId(id);
      const deletedNote = notes.find((n) => n.id === id);
      try {
        const res = await fetch("/api/notes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, noteId: id }),
        });
        if (!res.ok) throw new Error("Delete failed");
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (selectedId === id) {
          setSelectedId(null);
        }
        toast("Заметка удалена", {
          action: {
            label: "Отменить",
            onClick: async () => {
              if (!uid || !deletedNote) return;
              try {
                const restoreRes = await fetch("/api/notes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    uid,
                    title: deletedNote.title,
                    blocks: deletedNote.blocks,
                    tags: deletedNote.tags,
                  }),
                });
                if (restoreRes.ok) {
                  const restored = await restoreRes.json();
                  setNotes((prev) => [restored, ...prev]);
                  toast.success("Заметка восстановлена");
                }
              } catch {
                toast.error("Ошибка восстановления");
              }
            },
          },
        });
      } catch {
        toast.error("Ошибка удаления");
      } finally {
        setDeletingId(null);
      }
    },
    [uid, notes, selectedId],
  );

  const handleContentChange = useCallback(
    (
      title: string,
      blocks: Block[],
      tags: string[],
      scheduledDate?: string | null,
      scheduledTime?: string | null,
      recurringInterval?: string | null,
      canvasState?: CanvasState | null,
    ) => {
      setEditTitle(title);
      setEditBlocks(blocks);
      setEditTags(tags);
      if (scheduledDate !== undefined) setEditScheduledDate(scheduledDate);
      if (scheduledTime !== undefined) setEditScheduledTime(scheduledTime);
      if (recurringInterval !== undefined)
        setEditRecurringInterval(recurringInterval);
      if (canvasState !== undefined) setEditCanvasState(canvasState);
      const current = JSON.stringify({
        title,
        blocks,
        tags,
        scheduledDate: scheduledDate ?? editScheduledDate,
        scheduledTime: scheduledTime ?? editScheduledTime,
        recurringInterval: recurringInterval ?? editRecurringInterval,
        canvasState: canvasState ?? editCanvasState,
      });
      setHasChanges(current !== originalNoteRef.current);
    },
    [
      editScheduledDate,
      editScheduledTime,
      editRecurringInterval,
      editCanvasState,
    ],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selectedNote = notes.find((n) => n.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[2000px] px-4 h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-end py-2 border-b border-border/20 shrink-0">
          <button
            onClick={() => {
              setShowLeft(!showLeft);
              setShowCenter(true);
            }}
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-all"
            title="Показать теги"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>

        {/* Three-column layout */}
        <div className="flex flex-1 min-h-0">
          {/* Left column — Tags (15%) */}
          {showLeft && (
            <div className="w-[15%] min-w-[120px] border-r border-border/20 hidden md:flex flex-col">
              <div className="p-3 border-b border-border/20">
                <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  Теги
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-none">
                {Array.from(new Set(notes.flatMap((n) => n.tags || [])))
                  .sort()
                  .map((tag) => (
                    <button
                      key={tag}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground transition-all truncate"
                    >
                      #{tag}
                    </button>
                  ))}
                {notes.length === 0 && (
                  <p className="text-[10px] text-muted-foreground/30 text-center py-4">
                    Пока нет тегов
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Center column — Note list (25%) */}
          {showCenter && (
            <div className="w-[25%] min-w-[200px] border-r border-border/20 flex-shrink-0">
              <NoteList
                notes={notes}
                selectedId={selectedId}
                onSelect={handleSelectNote}
                onNew={handleNewNote}
                onDelete={handleDeleteNote}
                onSearch={setSearchQuery}
                searchQuery={searchQuery}
                deletingId={deletingId}
              />
            </div>
          )}

          {/* Right column — Editor (60%) */}
          <div className="flex-1 min-w-0">
            {selectedNote ? (
              <BlockEditor
                uid={uid ?? ""}
                noteId={selectedNote.id}
                blocks={editBlocks}
                onChange={(blocks) =>
                  handleContentChange(editTitle, blocks, editTags)
                }
                noteTitle={editTitle}
                noteTags={editTags}
                scheduledDate={editScheduledDate}
                scheduledTime={editScheduledTime}
                recurringInterval={editRecurringInterval}
                linkedNoteIds={selectedNote.linkedNoteIds ?? []}
                noteTitles={Object.fromEntries(
                  notes.map((n) => [n.id, n.title]),
                )}
                canvasState={editCanvasState}
                onTitleChange={(title) =>
                  handleContentChange(title, editBlocks, editTags)
                }
                onTagsChange={(tags) =>
                  handleContentChange(editTitle, editBlocks, tags)
                }
                onScheduleChange={(date, time, interval) =>
                  handleContentChange(
                    editTitle,
                    editBlocks,
                    editTags,
                    date,
                    time,
                    interval,
                  )
                }
                onCanvasStateChange={(state) => {
                  setEditCanvasState(state);
                  handleContentChange(
                    editTitle,
                    editBlocks,
                    editTags,
                    undefined,
                    undefined,
                    undefined,
                    state,
                  );
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-base font-medium text-muted-foreground/60">
                  Выберите заметку
                </p>
                <p className="text-sm text-muted-foreground/30 mt-1">
                  или создайте новую
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
