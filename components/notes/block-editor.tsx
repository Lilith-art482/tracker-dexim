"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Minus,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Undo2,
  Redo2,
  Pilcrow,
  Calendar,
  Clock,
  Repeat,
  Sparkles,
  Loader2,
  LayoutDashboard,
  AlignLeft,
} from "lucide-react";
import { toast } from "sonner";
import { CanvasView } from "./canvas-view";
import type { CanvasState } from "@/lib/models";

export type BlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bulletList"
  | "numberedList"
  | "todo"
  | "quote"
  | "code"
  | "divider";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
}

let blockIdCounter = 0;
function generateBlockId(): string {
  blockIdCounter++;
  return `b${Date.now()}-${blockIdCounter}`;
}

const SLASH_ITEMS: Array<{
  type: BlockType | "bold" | "italic" | "underline" | "strikethrough" | "inlineCode";
  label: string;
  icon: React.ReactNode;
  category: string;
}> = [
  { type: "heading1", label: "Заголовок 1", icon: <Heading1 className="h-4 w-4" />, category: "Блоки" },
  { type: "heading2", label: "Заголовок 2", icon: <Heading2 className="h-4 w-4" />, category: "Блоки" },
  { type: "heading3", label: "Заголовок 3", icon: <Heading3 className="h-4 w-4" />, category: "Блоки" },
  { type: "paragraph", label: "Текст", icon: <Type className="h-4 w-4" />, category: "Блоки" },
  { type: "bulletList", label: "Маркированный список", icon: <List className="h-4 w-4" />, category: "Блоки" },
  { type: "numberedList", label: "Нумерованный список", icon: <ListOrdered className="h-4 w-4" />, category: "Блоки" },
  { type: "todo", label: "Чек-лист", icon: <CheckSquare className="h-4 w-4" />, category: "Блоки" },
  { type: "quote", label: "Цитата", icon: <Quote className="h-4 w-4" />, category: "Блоки" },
  { type: "code", label: "Блок кода", icon: <Code2 className="h-4 w-4" />, category: "Блоки" },
  { type: "divider", label: "Разделитель", icon: <Minus className="h-4 w-4" />, category: "Блоки" },
  { type: "bold", label: "Полужирный", icon: <Bold className="h-4 w-4" />, category: "Формат" },
  { type: "italic", label: "Курсив", icon: <Italic className="h-4 w-4" />, category: "Формат" },
  { type: "underline", label: "Подчёркнутый", icon: <Underline className="h-4 w-4" />, category: "Формат" },
  { type: "strikethrough", label: "Зачёркнутый", icon: <Strikethrough className="h-4 w-4" />, category: "Формат" },
  { type: "inlineCode", label: "Моноширинный", icon: <Code2 className="h-4 w-4" />, category: "Формат" },
];

function getBlockPlaceholder(type: BlockType): string {
  switch (type) {
    case "heading1": return "Заголовок 1";
    case "heading2": return "Заголовок 2";
    case "heading3": return "Заголовок 3";
    case "bulletList": return "Список";
    case "numberedList": return "Нумерованный список";
    case "todo": return "Задача";
    case "quote": return "Цитата";
    case "code": return "Код";
    default: return "Напишите / чтобы открыть меню...";
  }
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function exec(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

function FormatToolbar({ blockType, onBlockTypeChange }: {
  blockType: BlockType;
  onBlockTypeChange: (type: BlockType) => void;
}) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const blockTypeOptions: Array<{ type: BlockType; label: string; icon: React.ReactNode }> = [
    { type: "paragraph", label: "Текст", icon: <Pilcrow className="h-3.5 w-3.5" /> },
    { type: "heading1", label: "H1", icon: <Heading1 className="h-3.5 w-3.5" /> },
    { type: "heading2", label: "H2", icon: <Heading2 className="h-3.5 w-3.5" /> },
    { type: "heading3", label: "H3", icon: <Heading3 className="h-3.5 w-3.5" /> },
    { type: "quote", label: "Цитата", icon: <Quote className="h-3.5 w-3.5" /> },
    { type: "code", label: "Код", icon: <Code2 className="h-3.5 w-3.5" /> },
    { type: "bulletList", label: "Список", icon: <List className="h-3.5 w-3.5" /> },
    { type: "numberedList", label: "Нум. список", icon: <ListOrdered className="h-3.5 w-3.5" /> },
    { type: "todo", label: "Задача", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  ];

  const currentLabel = blockTypeOptions.find((o) => o.type === blockType)?.label || "Текст";

  return (
    <div className="flex items-center gap-0.5 px-1 py-1 rounded-lg bg-muted/20 border border-border/20 flex-wrap">
      <div className="relative">
        <button
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all whitespace-nowrap"
        >
          {currentLabel}
        </button>
        {showBlockMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowBlockMenu(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-xl border border-border/60 bg-popover shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-1 space-y-0.5">
                {blockTypeOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => { onBlockTypeChange(opt.type); setShowBlockMenu(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                      opt.type === blockType
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50",
                    )}
                  >
                    <span className="text-muted-foreground">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <span className="w-px h-5 bg-border/30 mx-0.5" />

      <button onClick={() => exec("bold")} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all" title="Полужирный (Ctrl+B)">
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => exec("italic")} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all" title="Курсив (Ctrl+I)">
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => exec("underline")} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all" title="Подчёркнутый (Ctrl+U)">
        <Underline className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => exec("strikeThrough")} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all" title="Зачёркнутый">
        <Strikethrough className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          const sel = window.getSelection();
          if (sel && sel.toString()) {
            if (document.queryCommandState("insertHTML")) {
              document.execCommand("removeFormat");
            } else {
              document.execCommand("insertHTML", false, `<code>${sel.toString()}</code>`);
            }
          }
        }}
        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all"
        title="Моноширинный"
      >
        <Code2 className="h-3.5 w-3.5" />
      </button>

      <span className="w-px h-5 bg-border/30 mx-0.5" />

      <button onClick={() => exec("undo")} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all" title="Отменить (Ctrl+Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button onClick={() => exec("redo")} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-all" title="Повторить (Ctrl+Shift+Z)">
        <Redo2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BlockRenderer({
  block,
  onContentChange,
  onFocus,
  onKeyDown,
  onSlashCommand,
  isFocused,
}: {
  block: Block;
  onContentChange: (content: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSlashCommand: () => void;
  isFocused: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef(block.content);
  const showPlaceholder = !block.content;

  useEffect(() => {
    if (ref.current && ref.current.innerText !== block.content) {
      ref.current.innerText = block.content;
    }
    contentRef.current = block.content;
  }, [block.content]);

  useEffect(() => {
    if (isFocused && ref.current) {
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      ref.current.focus();
    }
  }, [isFocused]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.innerText;
      contentRef.current = text;
    }
  }, []);

  const handleBlur = useCallback(() => {
    if (ref.current && ref.current.innerText !== block.content) {
      onContentChange(ref.current.innerText);
    }
  }, [block.content, onContentChange]);

  const handleKeyDownInner = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["b", "i", "u", "z", "y"].includes(e.key.toLowerCase())) {
        return;
      }
      if (e.key === "/") {
        onSlashCommand();
        return;
      }
      onKeyDown(e);
    },
    [onKeyDown, onSlashCommand],
  );

  if (block.type === "divider") {
    return <div className="my-2 border-t border-border/40" />;
  }

  const baseClass = "outline-none w-full py-0.5 leading-relaxed";
  const typeClasses: Record<string, string> = {
    heading1: "text-2xl font-bold tracking-tight mt-2",
    heading2: "text-xl font-semibold tracking-tight mt-1.5",
    heading3: "text-lg font-medium mt-1",
    paragraph: "text-base",
    bulletList: "text-base ml-5",
    numberedList: "text-base ml-5",
    todo: "text-base",
    quote: "text-base italic border-l-4 border-primary/40 pl-4 py-1 text-muted-foreground bg-muted/10 rounded-r-lg",
    code: "text-sm font-mono bg-muted/20 rounded-lg p-3 border border-border/40",
  };

  return (
    <div className="relative group flex items-start gap-2">
      {block.type === "todo" && (
        <input
          type="checkbox"
          checked={block.checked || false}
          onChange={() => onContentChange(block.content)}
          className="h-4 w-4 rounded border-border accent-primary shrink-0 mt-1.5"
        />
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onFocus={onFocus}
        onKeyDown={handleKeyDownInner}
        className={cn(baseClass, typeClasses[block.type] || "text-base")}
        data-placeholder={showPlaceholder ? getBlockPlaceholder(block.type) : undefined}
      >
        {block.content}
      </div>
      {showPlaceholder && (
        <div
          className="pointer-events-none absolute left-0 top-0 text-muted-foreground/30 select-none truncate"
          style={
            block.type === "todo" || block.type === "bulletList" || block.type === "numberedList"
              ? { left: block.type === "todo" ? "1.75rem" : "1.25rem" }
              : {}
          }
        >
          {getBlockPlaceholder(block.type)}
        </div>
      )}
    </div>
  );
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

interface SlashMenuProps {
  open: boolean;
  onSelect: (type: string) => void;
  onClose: () => void;
  search: string;
}

function SlashMenu({ open, onSelect, onClose, search }: SlashMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(
    () =>
      SLASH_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.type.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const grouped = useMemo(() => groupBy(filtered, (i) => i.category), [filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const flatItems = useMemo(() => filtered, [filtered]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === "Enter" && flatItems[selectedIndex]) {
        e.preventDefault();
        onSelect(flatItems[selectedIndex].type);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [open, flatItems, selectedIndex, onSelect, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const categories = Object.keys(grouped);

  return (
    <div
      ref={ref}
      className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 w-[400px] max-h-[50vh] rounded-xl border border-border/60 bg-popover shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-y-auto"
      style={{ maxWidth: "calc(100vw - 2rem)" }}
    >
      <div className="p-2">
        {categories.map((cat) => (
          <div key={cat}>
            <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              {cat}
            </p>
            {grouped[cat].map((item, _i) => {
              const globalIndex = flatItems.indexOf(item);
              return (
                <button
                  key={item.type}
                  onClick={() => onSelect(item.type)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                    globalIndex === selectedIndex
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md",
                      globalIndex === selectedIndex ? "bg-primary/15" : "bg-muted/50",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-3 text-sm text-muted-foreground/50">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}

function toDateInputValue(dateStr?: string | null): string {
  if (dateStr) return dateStr;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function BlockEditor({
  uid,
  noteId,
  blocks,
  onChange,
  noteTitle,
  noteTags,
  scheduledDate,
  scheduledTime,
  recurringInterval,
  linkedNoteIds,
  noteTitles,
  canvasState,
  onTitleChange,
  onTagsChange,
  onScheduleChange,
  onCanvasStateChange,
}: {
  uid?: string;
  noteId?: string;
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  noteTitle: string;
  noteTags: string[];
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  recurringInterval?: string | null;
  linkedNoteIds?: string[];
  noteTitles?: Record<string, string>;
  canvasState?: CanvasState | null;
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
  onScheduleChange?: (
    date: string | null,
    time: string | null,
    interval: string | null,
  ) => void;
  onCanvasStateChange?: (state: CanvasState) => void;
}) {
  const [canvasMode, setCanvasMode] = useState(false);
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashSearch, setSlashSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const updateBlock = useCallback(
    (index: number, updates: Partial<Block>) => {
      const updated = blocks.map((b, i) =>
        i === index ? { ...b, ...updates } : b,
      );
      onChange(updated);
    },
    [blocks, onChange],
  );

  const addBlock = useCallback(
    (index: number, type: BlockType = "paragraph") => {
      const newBlock: Block = {
        id: generateBlockId(),
        type,
        content: "",
      };
      const updated = [...blocks];
      updated.splice(index + 1, 0, newBlock);
      onChange(updated);
      setFocusedBlockIndex(index + 1);
    },
    [blocks, onChange],
  );

  const removeBlock = useCallback(
    (index: number) => {
      if (blocks.length <= 1) return;
      const updated = blocks.filter((_, i) => i !== index);
      onChange(updated);
      setFocusedBlockIndex(Math.max(0, index - 1));
    },
    [blocks, onChange],
  );

  const handleBlockKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      const block = blocks[index];
      if (e.key === "Enter" && !e.shiftKey && block?.type !== "code") {
        e.preventDefault();
        addBlock(index);
      } else if (e.key === "Enter" && e.shiftKey && block?.type === "code") {
        return;
      } else if (e.key === "Backspace" && !block?.content) {
        e.preventDefault();
        removeBlock(index);
      }
    },
    [addBlock, removeBlock, blocks],
  );

  const handleSlashCommand = useCallback(
    (type: string) => {
      if (type === "bold") { exec("bold"); setSlashMenuOpen(false); return; }
      if (type === "italic") { exec("italic"); setSlashMenuOpen(false); return; }
      if (type === "underline") { exec("underline"); setSlashMenuOpen(false); return; }
      if (type === "strikethrough") { exec("strikeThrough"); setSlashMenuOpen(false); return; }
      if (type === "inlineCode") {
        const sel = window.getSelection();
        if (sel && sel.toString()) {
          document.execCommand("insertHTML", false, `<code>${sel.toString()}</code>`);
        }
        setSlashMenuOpen(false);
        return;
      }

      if (focusedBlockIndex === null) return;
      const block = blocks[focusedBlockIndex];

      if (type === "divider") {
        const updated = blocks.map((b, i) =>
          i === focusedBlockIndex ? { ...b, type: "divider" as const, content: "" } : b,
        );
        onChange(updated);
        setSlashMenuOpen(false);
        return;
      }

      const cleanContent = block.content.startsWith("/")
        ? block.content.slice(1).trimStart()
        : block.content;
      updateBlock(focusedBlockIndex, { type: type as BlockType, content: cleanContent });
      setSlashMenuOpen(false);
    },
    [focusedBlockIndex, blocks, onChange, updateBlock],
  );

  const handleBlockTypeChange = useCallback(
    (type: BlockType) => {
      if (focusedBlockIndex === null) return;
      updateBlock(focusedBlockIndex, { type });
    },
    [focusedBlockIndex, updateBlock],
  );

  const handleAddTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase();
      if (trimmed && !noteTags.includes(trimmed)) {
        onTagsChange([...noteTags, trimmed]);
      }
      setTagInput("");
    },
    [noteTags, onTagsChange],
  );

  const removeTag = useCallback(
    (tag: string) => {
      onTagsChange(noteTags.filter((t) => t !== tag));
    },
    [noteTags, onTagsChange],
  );

  const handleSlashTrigger = useCallback((index: number) => {
    setFocusedBlockIndex(index);
    setSlashSearch("");
    setSlashMenuOpen(true);
  }, []);

  // AI extraction
  const [extracting, setExtracting] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<
    Array<{ title: string; priority?: string; date?: string; comment?: string }>
  >([]);
  const [extractDialogOpen, setExtractDialogOpen] = useState(false);

  const handleExtractTasks = useCallback(async () => {
    const text = blocks
      .filter((b) => b.type !== "divider" && b.content.trim())
      .map((b) => {
        const prefix =
          b.type === "heading1"
            ? "## "
            : b.type === "heading2"
              ? "### "
              : b.type === "heading3"
                ? "#### "
                : b.type === "bulletList"
                  ? "- "
                  : b.type === "numberedList"
                    ? "1. "
                    : b.type === "todo"
                      ? `[${b.checked ? "x" : " "}] `
                      : "";
        return prefix + b.content;
      })
      .join("\n");

    if (!text.trim()) {
      toast("Нет текста для анализа");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/notes/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        toast.error("Ошибка AI-анализа");
        return;
      }

      const data = await res.json();
      if (!data.tasks?.length) {
        toast("Не найдено задач в тексте");
        return;
      }

      setExtractedTasks(data.tasks);
      setExtractDialogOpen(true);
    } catch {
      toast.error("Ошибка AI-анализа");
    } finally {
      setExtracting(false);
    }
  }, [blocks]);

  return (
    <div ref={editorRef} className="flex flex-col h-full">
      {/* Mode toggle */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/10 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCanvasMode(false)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors",
              !canvasMode
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30",
            )}
            title="Режим текста"
          >
            <AlignLeft className="h-3.5 w-3.5" />
            Текст
          </button>
          <button
            onClick={() => setCanvasMode(true)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors",
              canvasMode
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30",
            )}
            title="Режим канваса"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Канвас
          </button>
        </div>
      </div>

      {canvasMode && onCanvasStateChange && uid && noteId ? (
        <CanvasView
          blocks={blocks}
          canvasState={canvasState ?? null}
          onCanvasStateChange={onCanvasStateChange}
          uid={uid}
          noteId={noteId}
        />
      ) : canvasMode ? null : (
        <>
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1 scrollbar-none min-h-0">
        <input
          value={noteTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Без названия"
          className="w-full text-3xl font-bold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/20 mb-4"
        />

        {focusedBlockIndex !== null && blocks[focusedBlockIndex] && (
          <div className="mb-3">
            <FormatToolbar
              blockType={blocks[focusedBlockIndex]?.type || "paragraph"}
              onBlockTypeChange={handleBlockTypeChange}
            />
          </div>
        )}

        {blocks.length === 0 && focusedBlockIndex === null && (
          <div className="text-muted-foreground/30 text-center py-20 select-none">
            <Type className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нажмите / чтобы начать</p>
          </div>
        )}

        {blocks.map((block, i) => (
          <div key={block.id} className="relative">
            <BlockRenderer
              block={block}
              onContentChange={(content) => updateBlock(i, { content })}
              onFocus={() => setFocusedBlockIndex(i)}
              onKeyDown={(e) => handleBlockKeyDown(i, e)}
              onSlashCommand={() => handleSlashTrigger(i)}
              isFocused={focusedBlockIndex === i}
            />
          </div>
        ))}
      </div>

      {slashMenuOpen && (
        <SlashMenu
          open={slashMenuOpen}
          search={slashSearch}
          onSelect={handleSlashCommand}
          onClose={() => setSlashMenuOpen(false)}
        />
      )}

      <div className="border-t border-border/20 px-8 py-3 shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          {/* AI Extract */}
          <button
            onClick={handleExtractTasks}
            disabled={extracting}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-foreground hover:bg-muted/30 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
            title="Извлечь задачи из текста"
          >
            {extracting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Извлечь задачи
          </button>
          <span className="w-px h-5 bg-border/30 mx-1" />
          {/* Schedule */}
          {onScheduleChange && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <input
                type="date"
                value={toDateInputValue(scheduledDate)}
                onChange={(e) =>
                  onScheduleChange(
                    e.target.value || null,
                    scheduledTime ?? null,
                    recurringInterval ?? null,
                  )
                }
                className="bg-transparent border border-border/30 rounded-md px-2 py-1 text-xs text-foreground outline-none w-[140px]"
              />
              <Clock className="h-3.5 w-3.5" />
              <input
                type="time"
                value={scheduledTime ?? "09:00"}
                onChange={(e) =>
                  onScheduleChange(
                    scheduledDate ?? null,
                    e.target.value || null,
                    recurringInterval ?? null,
                  )
                }
                className="bg-transparent border border-border/30 rounded-md px-2 py-1 text-xs text-foreground outline-none w-[100px]"
              />
              <button
                onClick={() => {
                  if (scheduledDate || scheduledTime) {
                    onScheduleChange(null, null, null);
                  }
                }}
                className="text-muted-foreground/50 hover:text-destructive transition-colors text-xs"
                title="Сбросить расписание"
              >
                {scheduledDate || scheduledTime ? "×" : null}
              </button>
              <Repeat className="h-3.5 w-3.5 ml-1" />
              <select
                value={recurringInterval ?? ""}
                onChange={(e) =>
                  onScheduleChange(
                    scheduledDate ?? null,
                    scheduledTime ?? null,
                    e.target.value || null,
                  )
                }
                className="bg-transparent border border-border/30 rounded-md px-2 py-1 text-xs text-foreground outline-none"
              >
                <option value="">Нет</option>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>
          )}
          <span className="w-px h-5 bg-border/30 mx-1" />
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {noteTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5"
              >
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              placeholder={noteTags.length === 0 ? "Добавить тег..." : ""}
              className="bg-transparent border-none outline-none text-xs text-muted-foreground placeholder:text-muted-foreground/30 min-w-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Backlinks */}
      {linkedNoteIds && linkedNoteIds.length > 0 && noteTitles && (
        <div className="px-8 py-2 border-t border-border/10 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span className="font-medium">Связанные заметки:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {linkedNoteIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/5 text-primary text-xs px-2 py-0.5"
                >
                  {noteTitles[id] || "—"}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Extract tasks dialog */}
      {extractDialogOpen && extractedTasks.length > 0 && (
        <ExtractTasksDialog
          tasks={extractedTasks}
          uid={uid ?? ""}
          onClose={() => setExtractDialogOpen(false)}
          onTaskCreated={() => {
            setExtractDialogOpen(false);
            toast.success("Задачи созданы");
          }}
        />
      )}
    </div>
  );
}

function ExtractTasksDialog({
  tasks,
  uid,
  onClose,
  onTaskCreated,
}: {
  tasks: Array<{ title: string; priority?: string; date?: string; comment?: string }>;
  uid: string;
  onClose: () => void;
  onTaskCreated: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(tasks.map((_, i) => i)),
  );
  const [creating, setCreating] = useState(false);

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const createAll = async () => {
    if (!uid) return;
    setCreating(true);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const defaultDate = `${y}-${m}-${d}`;

    let created = 0;
    for (const i of selected) {
      const t = tasks[i];
      if (!t?.title?.trim()) continue;

      try {
        const res = await fetch("/api/personal-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: t.title.trim(),
            date: t.date || defaultDate,
            startTime: "09:00",
            endTime: "10:00",
            priority: t.priority || "medium",
            comment: t.comment?.trim() || undefined,
            ownerId: uid,
          }),
        });

        if (res.ok) created++;
      } catch {
        // silent
      }
    }

    setCreating(false);
    if (created > 0) {
      onTaskCreated();
    } else {
      toast.error("Не удалось создать задачи");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-in fade-in duration-200">
      <div className="bg-popover rounded-xl border border-border/60 shadow-2xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-5 py-4 border-b border-border/20">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Извлечённые задачи
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Выберите задачи для добавления в планировщик
          </p>
        </div>
        <div className="px-5 py-3 max-h-60 overflow-y-auto space-y-1.5">
          {tasks.map((t, i) => (
            <label
              key={i}
              className="flex items-start gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(i)}
                onChange={() => toggle(i)}
                className="h-4 w-4 rounded border-border accent-primary shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{t.title}</span>
                {t.comment && (
                  <p className="text-xs text-muted-foreground truncate">
                    {t.comment}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {t.priority && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        t.priority === "high"
                          ? "bg-rose-500/10 text-rose-500"
                          : t.priority === "medium"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-sky-500/10 text-sky-500",
                      )}
                    >
                      {t.priority === "high"
                        ? "Высокий"
                        : t.priority === "medium"
                          ? "Средний"
                          : "Низкий"}
                    </span>
                  )}
                  {t.date && (
                    <span className="text-[10px] text-muted-foreground">
                      {t.date}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border/20 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg hover:bg-muted/50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={createAll}
            disabled={creating || selected.size === 0}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              `Создать (${selected.size})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
