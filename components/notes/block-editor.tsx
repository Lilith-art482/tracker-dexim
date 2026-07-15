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
} from "lucide-react";

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
  type: BlockType;
  label: string;
  icon: React.ReactNode;
}> = [
  { type: "heading1", label: "Заголовок 1", icon: <Heading1 className="h-4 w-4" /> },
  { type: "heading2", label: "Заголовок 2", icon: <Heading2 className="h-4 w-4" /> },
  { type: "heading3", label: "Заголовок 3", icon: <Heading3 className="h-4 w-4" /> },
  { type: "paragraph", label: "Текст", icon: <Type className="h-4 w-4" /> },
  { type: "bulletList", label: "Маркированный список", icon: <List className="h-4 w-4" /> },
  { type: "numberedList", label: "Нумерованный список", icon: <ListOrdered className="h-4 w-4" /> },
  { type: "todo", label: "Чек-лист", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "quote", label: "Цитата", icon: <Quote className="h-4 w-4" /> },
  { type: "code", label: "Код", icon: <Code2 className="h-4 w-4" /> },
  { type: "divider", label: "Разделитель", icon: <Minus className="h-4 w-4" /> },
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

function BlockRenderer({
  block,
  onChange,
  onFocus,
  onKeyDown,
  onSlashCommand,
  isFocused,
}: {
  block: Block;
  onChange: (content: string) => void;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSlashCommand: () => void;
  isFocused: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const showPlaceholder = !block.content;

  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.focus();
    }
  }, [isFocused]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const text = ref.current.innerText;
      onChange(text);
      if (text.endsWith("/")) {
        onSlashCommand();
      }
    }
  }, [onChange, onSlashCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "/" && !ref.current?.innerText) {
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
    bulletList: "text-base ml-5 before:content-['•'] before:mr-2 before:text-muted-foreground",
    numberedList: "text-base ml-5 list-decimal",
    todo: "text-base flex items-center gap-2",
    quote: "text-base italic border-l-4 border-primary/40 pl-4 py-1 text-muted-foreground bg-muted/10 rounded-r-lg",
    code: "text-sm font-mono bg-muted/20 rounded-lg p-3 border border-border/40",
  };

  return (
    <div className="relative group">
      {block.type === "todo" && (
        <span className="inline-flex items-center mr-2">
          <input
            type="checkbox"
            checked={block.checked || false}
            onChange={() => onChange(block.content)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
        </span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        className={cn(baseClass, typeClasses[block.type] || "text-base")}
        data-placeholder={showPlaceholder ? getBlockPlaceholder(block.type) : undefined}
        style={
          block.type === "numberedList"
            ? ({ counterIncrement: "list-item" } as React.CSSProperties)
            : undefined
        }
      >
        {block.content}
      </div>
      {showPlaceholder && (
        <div
          className="pointer-events-none absolute left-0 top-0 text-muted-foreground/30 select-none truncate"
          style={
            block.type === "todo"
              ? { left: "1.75rem" }
              : block.type === "bulletList" || block.type === "numberedList"
                ? { left: "1.25rem" }
                : {}
          }
        >
          {getBlockPlaceholder(block.type)}
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

interface SlashMenuProps {
  open: boolean;
  onSelect: (type: BlockType) => void;
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

  useEffect(() => {
    setSelectedIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        onSelect(filtered[selectedIndex].type);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [open, filtered, selectedIndex, onSelect, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-border/60 bg-popover shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="p-1.5">
        <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
          Блоки
        </p>
        {filtered.map((item, i) => (
          <button
            key={item.type}
            onClick={() => onSelect(item.type)}
            onMouseEnter={() => setSelectedIndex(i)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              i === selectedIndex
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                i === selectedIndex ? "bg-primary/15" : "bg-muted/50",
              )}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-3 text-sm text-muted-foreground/50">
            Ничего не найдено
          </p>
        )}
      </div>
    </div>
  );
}

export function BlockEditor({
  blocks,
  onChange,
  noteTitle,
  noteTags,
  onTitleChange,
  onTagsChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  noteTitle: string;
  noteTags: string[];
  onTitleChange: (title: string) => void;
  onTagsChange: (tags: string[]) => void;
}) {
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
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        addBlock(index);
      } else if (e.key === "Backspace" && !blocks[index].content) {
        e.preventDefault();
        removeBlock(index);
      }
    },
    [addBlock, removeBlock, blocks],
  );

  const handleSlashCommand = useCallback(
    (type: BlockType) => {
      if (focusedBlockIndex === null) return;
      const block = blocks[focusedBlockIndex];
      const text = block.content;

      if (type === "divider") {
        const updated = blocks.map((b, i) =>
          i === focusedBlockIndex ? { ...b, type: "divider" as const, content: "" } : b,
        );
        onChange(updated);
        setSlashMenuOpen(false);
        return;
      }

      const newContent = text.endsWith("/") ? text.slice(0, -1) : text;
      updateBlock(focusedBlockIndex, { type, content: newContent });
      setSlashMenuOpen(false);
    },
    [focusedBlockIndex, blocks, onChange, updateBlock],
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

  return (
    <div ref={editorRef} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1 scrollbar-none">
        <input
          value={noteTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Без названия"
          className="w-full text-3xl font-bold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/20 mb-4"
        />

        {blocks.length === 0 && focusedBlockIndex === null && (
          <div
            className="text-muted-foreground/30 text-center py-20 select-none"
          >
            <Type className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нажмите / чтобы начать</p>
          </div>
        )}

        {blocks.map((block, i) => (
          <div key={block.id} className="relative">
            <BlockRenderer
              block={block}
              onChange={(content) => updateBlock(i, { content })}
              onFocus={() => setFocusedBlockIndex(i)}
              onKeyDown={(e) => handleBlockKeyDown(i, e)}
              onSlashCommand={() => {
                setFocusedBlockIndex(i);
                setSlashSearch("");
                setSlashMenuOpen(true);
              }}
              isFocused={focusedBlockIndex === i}
            />
            {focusedBlockIndex === i && (
              <SlashMenu
                open={slashMenuOpen}
                search={slashSearch}
                onSelect={handleSlashCommand}
                onClose={() => setSlashMenuOpen(false)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border/20 px-8 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {noteTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-0.5"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-destructive transition-colors"
              >
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
  );
}
