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

  return (
    <div ref={editorRef} className="flex flex-col h-full">
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
  );
}
