"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  Plus,
  Trash2,
  Tag,
  Clock,
  Loader2,
} from "lucide-react";
import type { Note } from "@/lib/models";
import { cn } from "@/lib/utils";

function humanTime(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function getPreview(blocks: Note["blocks"]): string {
  for (const b of blocks) {
    if (b.type === "paragraph" || b.type === "bulletList" || b.type === "numberedList") {
      if (b.content.trim()) return b.content;
    }
  }
  return "";
}

interface NoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  deletingId: string | null;
}

export function NoteList({
  notes,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onSearch,
  searchQuery,
  deletingId,
}: NoteListProps) {
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let result = notes;
    if (filterTag) {
      result = result.filter((n) => n.tags?.includes(filterTag));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.blocks.some((b) => b.content.toLowerCase().includes(q)) ||
          n.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [notes, filterTag, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Заметки</h2>
          <button
            onClick={onNew}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-muted/30 border border-border/30 text-xs outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="px-3 py-2 border-b border-border/10 flex flex-wrap gap-1">
          <button
            onClick={() => setFilterTag(null)}
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full transition-all",
              !filterTag
                ? "bg-primary/15 text-primary font-medium"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30",
            )}
          >
            Все
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full transition-all inline-flex items-center gap-1",
                filterTag === tag
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/30",
              )}
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <FileText className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/40">
              {searchQuery || filterTag
                ? "Ничего не найдено"
                : "Нет заметок. Создайте первую!"}
            </p>
          </div>
        ) : (
          <div className="py-1 space-y-0.5">
            {filtered.map((note) => {
              const isSelected = note.id === selectedId;
              const isDeleting = note.id === deletingId;
              return (
                <div
                  key={note.id}
                  onClick={() => !isDeleting && onSelect(note.id)}
                  className={cn(
                    "group relative mx-2 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200",
                    isSelected
                      ? "bg-primary/10 shadow-sm"
                      : "hover:bg-muted/40 hover:shadow-sm hover:-translate-y-0.5",
                    isDeleting && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          "text-sm font-medium truncate",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {note.title || "Без названия"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground/50 mt-0.5 line-clamp-1">
                        {getPreview(note.blocks) || "Нет содержимого"}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {humanTime(note.updatedAt)}
                    </span>
                    {note.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground/50"
                      >
                        {tag}
                      </span>
                    ))}
                    {(note.tags?.length || 0) > 2 && (
                      <span className="text-[9px] text-muted-foreground/30">
                        +{note.tags!.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
