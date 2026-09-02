"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Tag,
  X,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Save,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUid } from "@/lib/use-auth-uid";
import { patchFetch } from "@/lib/authed-fetch";
import { toast } from "sonner";
import type { Note } from "@/lib/types";

patchFetch();

interface NoteBlock {
  id: string;
  type: string;
  content: string;
  checked?: boolean;
  language?: string;
}

const BLOCK_TYPES = [
  { type: "paragraph", label: "Текст", icon: FileText, keywords: ["текст", "параграф", "paragraph"] },
  { type: "heading1", label: "Заголовок 1", icon: Heading1, keywords: ["заголовок", "h1", "heading"] },
  { type: "heading2", label: "Заголовок 2", icon: Heading2, keywords: ["заголовок", "h2", "heading"] },
  { type: "heading3", label: "Заголовок 3", icon: Heading3, keywords: ["заголовок", "h3", "heading"] },
  { type: "bulletList", label: "Маркированный список", icon: List, keywords: ["список", "маркированный", "bullet"] },
  { type: "numberedList", label: "Нумерованный список", icon: ListOrdered, keywords: ["список", "нумерованный", "numbered"] },
  { type: "todo", label: "Задача", icon: CheckSquare, keywords: ["задача", "чекбокс", "todo", "checkbox"] },
  { type: "quote", label: "Цитата", icon: Quote, keywords: ["цитата", "quote"] },
  { type: "code", label: "Код", icon: Code, keywords: ["код", "code"] },
  { type: "divider", label: "Разделитель", icon: Minus, keywords: ["разделитель", "divider", "линия"] },
];

function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getDefaultBlock(): NoteBlock {
  return { id: generateId(), type: "paragraph", content: "" };
}

function plainPreview(blocks: NoteBlock[], maxLen = 80): string {
  const text = blocks
    .filter((b) => b.type !== "divider")
    .map((b) => {
      if (b.type === "todo") return (b.checked ? "[x] " : "[ ] ") + b.content;
      return b.content;
    })
    .join(" ");
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD} дн назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function getBlockEl(editor: HTMLDivElement, index: number): HTMLElement | null {
  return editor.querySelector(`[data-block="${index}"]`);
}

export function NotesPageClient() {
  const { uid, ready } = useAuthUid();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashBlockIndex, setSlashBlockIndex] = useState(0);
  const [aiExtracting, setAiExtracting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId],
  );

  const [editTitle, setEditTitle] = useState("");
  const [editBlocks, setEditBlocks] = useState<NoteBlock[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);

  const blocksRef = useRef<NoteBlock[]>([]);
  blocksRef.current = editBlocks;

  const slashJustClosed = useRef(false);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditBlocks(
        selectedNote.blocks.length > 0
          ? selectedNote.blocks
          : [getDefaultBlock()],
      );
      setEditTags([...selectedNote.tags]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNote?.id]);

  const fetchNotes = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch {
      toast.error("Ошибка загрузки заметок");
    }
  }, [uid]);

  useEffect(() => {
    if (ready) fetchNotes();
  }, [ready, fetchNotes]);

  const saveNote = useCallback(
    async (title: string, blocks: NoteBlock[], tags: string[]) => {
      if (!uid || !selectedId) return;
      setSaving(true);
      try {
        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedId, title, blocks, tags }),
        });
        if (res.ok) {
          const updated = await res.json();
          setNotes((prev) =>
            prev
              .map((n) => (n.id === updated.id ? updated : n))
              .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)),
          );
        }
      } catch {
        toast.error("Ошибка сохранения");
      } finally {
        setSaving(false);
      }
    },
    [uid, selectedId],
  );

  const createNewNote = useCallback(async () => {
    if (!uid) return;
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Без заголовка",
          blocks: [getDefaultBlock()],
          tags: [],
        }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setSelectedId(note.id);
        setMobileShowEditor(true);
        setTimeout(() => titleRef.current?.focus(), 100);
      }
    } catch {
      toast.error("Ошибка создания заметки");
    }
  }, [uid]);

  const deleteNoteById = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          setNotes((prev) => prev.filter((n) => n.id !== id));
          if (selectedId === id) setSelectedId(null);
          toast.success("Заметка удалена");
        }
      } catch {
        toast.error("Ошибка удаления");
      }
    },
    [selectedId],
  );

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.blocks.some((b) => b.content.toLowerCase().includes(q)) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [notes, searchQuery]);

  const addBlockAfter = useCallback((index: number, type = "paragraph") => {
    const editor = editorRef.current;
    if (!editor) return;
    const newBlock: NoteBlock = { id: generateId(), type, content: "" };
    setEditBlocks((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, newBlock);
      return next;
    });
    requestAnimationFrame(() => {
      const target = getBlockEl(editor, index + 1);
      target?.focus();
    });
  }, []);

  const removeBlock = useCallback(
    (index: number) => {
      if (blocksRef.current.length <= 1) return;
      const editor = editorRef.current;
      setEditBlocks((prev) => prev.filter((_, i) => i !== index));
      if (editor) {
        requestAnimationFrame(() => {
          const target = getBlockEl(editor, Math.max(0, index - 1));
          target?.focus();
        });
      }
    },
    [],
  );

  const changeBlockType = useCallback((index: number, type: string) => {
    const editor = editorRef.current;
    setEditBlocks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], type, content: "" };
      return next;
    });
    if (editor) {
      requestAnimationFrame(() => {
        const target = getBlockEl(editor, index);
        if (target) {
          target.textContent = "";
          target.focus();
        }
      });
    }
  }, []);

  const handleBlockKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const blocks = blocksRef.current;
      const block = blocks[index];
      if (!block) return;

      if (e.key === "Enter" && !e.shiftKey) {
        if (block.type === "code") return;
        if (slashMenuOpen) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        if (block.content === "" && block.type !== "paragraph") {
          changeBlockType(index, "paragraph");
        } else {
          const inheritable = ["bulletList", "numberedList", "todo", "quote"];
          const nextType = inheritable.includes(block.type) ? block.type : "paragraph";
          addBlockAfter(index, nextType);
        }
        return;
      }

      if (e.key === "Backspace" && block.content === "" && index > 0) {
        e.preventDefault();
        removeBlock(index);
        return;
      }

      if (e.key === "ArrowUp" && index > 0) {
        const editor = editorRef.current;
        if (editor) {
          const prev = getBlockEl(editor, index - 1);
          if (prev && prev.textContent === "") {
            e.preventDefault();
            prev.focus();
          }
        }
      }

      if (e.key === "ArrowDown" && index < blocks.length - 1) {
        const editor = editorRef.current;
        if (editor) {
          const next = getBlockEl(editor, index + 1);
          if (next && next.textContent === "") {
            e.preventDefault();
            next.focus();
          }
        }
      }
    },
    [slashMenuOpen, addBlockAfter, removeBlock, changeBlockType],
  );

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, index: number) => {
      if (slashJustClosed.current) return;
      const text = e.currentTarget.textContent || "";

      setEditBlocks((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], content: text };
        return next;
      });

      if (text === "/") {
        setSlashMenuOpen(true);
        setSlashFilter("");
        setSlashBlockIndex(index);
      } else if (slashMenuOpen && slashBlockIndex === index) {
        const afterSlash = text.slice(text.lastIndexOf("/") + 1);
        setSlashFilter(afterSlash);
      }
    },
    [slashMenuOpen, slashBlockIndex],
  );

  const selectSlashOption = useCallback(
    (type: string) => {
      const editor = editorRef.current;
      const idx = slashBlockIndex;
      slashJustClosed.current = true;
      setTimeout(() => {
        slashJustClosed.current = false;
      }, 100);

      setEditBlocks((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], type, content: "" };
        return next;
      });
      setSlashMenuOpen(false);
      setSlashFilter("");

      if (editor) {
        requestAnimationFrame(() => {
          const target = getBlockEl(editor, idx);
          if (target) {
            target.textContent = "";
            target.focus();
          }
        });
      }
    },
    [slashBlockIndex],
  );

  const filteredSlashOptions = useMemo(() => {
    if (!slashFilter) return BLOCK_TYPES;
    const q = slashFilter.toLowerCase();
    return BLOCK_TYPES.filter(
      (bt) =>
        bt.label.toLowerCase().includes(q) ||
        bt.keywords.some((k) => k.includes(q)),
    );
  }, [slashFilter]);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (!tag || editTags.includes(tag)) {
      setTagInput("");
      return;
    }
    setEditTags([...editTags, tag]);
    setTagInput("");
  }, [tagInput, editTags]);

  const removeTag = useCallback(
    (tag: string) => {
      setEditTags(editTags.filter((t) => t !== tag));
    },
    [editTags],
  );

  const extractTasks = useCallback(async () => {
    if (!selectedNote) return;
    setAiExtracting(true);
    try {
      const text = editBlocks
        .filter((b) => b.type !== "divider")
        .map((b) => b.content)
        .join("\n");
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Извлеки задачи из этого текста. Верни JSON массив объектов {title, priority: "low"|"medium"|"high"}. Текст:\n\n${text}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.content || data.message || "";
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          const tasks = JSON.parse(match[0]);
          toast.success(
            `Найдено ${tasks.length} задач. Функция создания задач будет доступна в следующем обновлении.`,
          );
        } else {
          toast.info("Не удалось извлечь задачи из текста");
        }
      }
    } catch {
      toast.error("Ошибка AI-обработки");
    } finally {
      setAiExtracting(false);
    }
  }, [selectedNote, editBlocks]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/40">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold">Заметки</h2>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={createNewNote}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Поиск заметок..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-muted/30 border border-border/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-3">
              <FileText className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground/50">
              {searchQuery ? "Ничего не найдено" : "Нет заметок"}
            </p>
          </div>
        )}
        {filteredNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => {
              setSelectedId(note.id);
              setMobileShowEditor(true);
            }}
            className={cn(
              "w-full text-left p-3 rounded-xl transition-all group",
              selectedId === note.id
                ? "bg-primary/10 ring-1 ring-primary/20"
                : "hover:bg-muted/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">
                  {note.title || "Без заголовка"}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 line-clamp-2">
                  {plainPreview(note.blocks)}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {note.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary/70"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="text-[9px] text-muted-foreground/30">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNoteById(note.id);
                }}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const editor = selectedNote ? (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
        <button
          onClick={() => setMobileShowEditor(false)}
          className="lg:hidden flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          ref={titleRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Заголовок"
          className="flex-1 text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/30"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => saveNote(editTitle, editBlocks, editTags)}
            disabled={saving}
            className="flex h-7 items-center gap-1.5 px-3 rounded-lg text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Сохранить</span>
          </button>
          <button
            onClick={extractTasks}
            disabled={aiExtracting}
            className="flex h-7 items-center gap-1.5 px-2 rounded-lg text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          >
            {aiExtracting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">AI задачи</span>
          </button>
          <button
            onClick={() => setShowTagInput(!showTagInput)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
              showTagInput
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <Tag className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showTagInput && (
        <div className="px-4 py-2 border-b border-border/40 flex items-center gap-2 flex-wrap">
          {editTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Добавить тег..."
            className="text-[11px] bg-transparent outline-none placeholder:text-muted-foreground/40 w-24"
          />
        </div>
      )}

      <div className="px-4 py-1.5 border-b border-border/40 flex items-center gap-0.5 overflow-x-auto">
        {[
          { icon: Bold, action: () => document.execCommand("bold"), title: "Bold" },
          { icon: Italic, action: () => document.execCommand("italic"), title: "Italic" },
          { icon: Underline, action: () => document.execCommand("underline"), title: "Underline" },
          { icon: Strikethrough, action: () => document.execCommand("strikeThrough"), title: "Strikethrough" },
        ].map(({ icon: Icon, action, title }) => (
          <button
            key={title}
            onMouseDown={(e) => {
              e.preventDefault();
              action();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
            title={title}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="h-4 w-px bg-border/40 mx-0.5" />
        {[
          { icon: Heading1, type: "heading1", title: "H1" },
          { icon: Heading2, type: "heading2", title: "H2" },
          { icon: Heading3, type: "heading3", title: "H3" },
        ].map(({ icon: Icon, type, title }) => (
          <button
            key={title}
            onMouseDown={(e) => {
              e.preventDefault();
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const node = sel.anchorNode;
                const blockEl = node ? (node.parentElement?.closest("[data-block]") as HTMLElement) : null;
                if (blockEl) {
                  const idx = parseInt(blockEl.dataset.block || "0");
                  changeBlockType(idx, type);
                }
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
            title={title}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="h-4 w-px bg-border/40 mx-0.5" />
        {[
          { icon: List, type: "bulletList", title: "Список" },
          { icon: ListOrdered, type: "numberedList", title: "Нумерованный" },
          { icon: CheckSquare, type: "todo", title: "Задача" },
          { icon: Quote, type: "quote", title: "Цитата" },
          { icon: Code, type: "code", title: "Код" },
          { icon: Minus, type: "divider", title: "Разделитель" },
        ].map(({ icon: Icon, type, title }) => (
          <button
            key={title}
            onMouseDown={(e) => {
              e.preventDefault();
              const sel = window.getSelection();
              if (sel && sel.rangeCount > 0) {
                const node = sel.anchorNode;
                const blockEl = node ? (node.parentElement?.closest("[data-block]") as HTMLElement) : null;
                if (blockEl) {
                  const idx = parseInt(blockEl.dataset.block || "0");
                  changeBlockType(idx, type);
                }
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
            title={title}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-16 py-6"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const lastBlock = editorRef.current?.querySelector(
              "[data-block]:last-child",
            ) as HTMLElement;
            lastBlock?.focus();
          }
        }}
      >
        <div className="max-w-2xl mx-auto space-y-1 relative">
          {editBlocks.map((block, index) => (
            <div
              key={block.id}
              className="group/block relative"
              data-block-wrapper
            >
              {block.type === "divider" ? (
                <div
                  data-block={index}
                  className="h-px bg-border/40 my-3"
                  tabIndex={0}
                  onKeyDown={(e) => handleBlockKeyDown(e, index)}
                />
              ) : block.type === "todo" ? (
                <div
                  data-block={index}
                  className="flex items-start gap-2 py-0.5"
                  tabIndex={0}
                >
                  <button
                    onClick={() => {
                      setEditBlocks((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], checked: !next[index].checked };
                        return next;
                      });
                    }}
                    className={cn(
                      "mt-1 h-4 w-4 rounded border shrink-0 flex items-center justify-center transition-colors",
                      block.checked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/60 hover:border-primary/50",
                    )}
                  >
                    {block.checked && <Check className="h-3 w-3" />}
                  </button>
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => handleBlockInput(e, index)}
                    onKeyDown={(e) => handleBlockKeyDown(e, index)}
                    className={cn(
                      "flex-1 outline-none text-sm leading-relaxed",
                      block.checked && "line-through text-muted-foreground/50",
                    )}
                  />
                </div>
              ) : (
                <div
                  data-block={index}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleBlockInput(e, index)}
                  onKeyDown={(e) => handleBlockKeyDown(e, index)}
                  className={cn(
                    "outline-none text-sm leading-relaxed",
                    block.type === "heading1" && "text-xl font-bold mt-4",
                    block.type === "heading2" && "text-lg font-semibold mt-3",
                    block.type === "heading3" && "text-base font-medium mt-2",
                    block.type === "bulletList" &&
                      "pl-5 relative before:content-['•'] before:absolute before:left-1 before:text-muted-foreground/40",
                    block.type === "numberedList" &&
                      "pl-5 relative before:content-[attr(data-num)] before:absolute before:left-0 before:text-muted-foreground/40",
                    block.type === "quote" &&
                      "pl-4 border-l-2 border-primary/30 text-muted-foreground italic",
                    block.type === "code" &&
                      "font-mono text-xs bg-muted/30 rounded-lg px-3 py-2 border border-border/30",
                  )}
                  data-num={
                    block.type === "numberedList"
                      ? `${editBlocks.filter((b, i) => i <= index && b.type === "numberedList").length}.`
                      : undefined
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {slashMenuOpen && filteredSlashOptions.length > 0 && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => {
            slashJustClosed.current = true;
            setTimeout(() => {
              slashJustClosed.current = false;
            }, 100);
            setSlashMenuOpen(false);
          }}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-border/60 bg-popover shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
              Блоки
            </p>
            {filteredSlashOptions.map((bt) => (
              <button
                key={bt.type}
                onClick={() => selectSlashOption(bt.type)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs text-foreground/80 hover:bg-muted/50 transition-all text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/40 shrink-0">
                  <bt.icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <span className="font-medium">{bt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center justify-center h-full pl-8">
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 mx-auto mb-4">
          <FileText className="h-7 w-7 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground/50 mb-3">
          Выберите заметку или создайте новую
        </p>
        <button
          onClick={createNewNote}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Новая заметка
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-3.5rem-3rem)] flex flex-col">
      <div
        className={cn(
          "flex flex-1 min-h-0",
          mobileShowEditor ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="w-full lg:w-72 xl:w-80 border-r border-border/40 shrink-0 overflow-hidden">
          {sidebar}
        </div>
        <div className="flex-1 min-w-0 hidden lg:flex">{editor}</div>
      </div>
      <div
        className={cn(
          "flex-1 min-h-0 flex lg:hidden",
          mobileShowEditor ? "flex" : "hidden",
        )}
      >
        {editor}
      </div>
    </div>
  );
}
