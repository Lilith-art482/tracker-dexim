"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lightbulb,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  Flag,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  getIdeasByUser,
  addIdea,
  updateIdea,
  deleteIdea,
} from "@/lib/ideas-client";
import type { Idea } from "@/lib/types";
import { toast } from "sonner";

const PRIORITY_OPTIONS = [
  { value: "none", label: "Без приоритета", icon: Minus, color: "text-muted-foreground" },
  { value: "low", label: "Низкий", icon: ArrowDownCircle, color: "text-blue-500" },
  { value: "medium", label: "Средний", icon: Flag, color: "text-amber-500" },
  { value: "high", label: "Высокий", icon: ArrowUpCircle, color: "text-red-500" },
] as const;

export function IdeasPageClient() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  const fetchIdeas = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getIdeasByUser(uid);
      setIdeas(data);
    } catch {
      toast.error("Ошибка загрузки идей");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleAdd = async () => {
    if (!uid || !newContent.trim()) return;
    setAdding(true);
    try {
      const idea = await addIdea({
        userId: uid,
        content: newContent.trim(),
        priority: "none",
        deadline: null,
        comment: "",
        importedToTask: false,
      });
      setIdeas((prev) => [idea, ...prev]);
      setNewContent("");
    } catch {
      toast.error("Ошибка добавления");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      toast.success("Удалено");
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleUpdate = async (id: string, data: Partial<Idea>) => {
    try {
      await updateIdea(id, data);
      setIdeas((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i)),
      );
    } catch {
      toast.error("Ошибка обновления");
    }
  };

  const getPriorityConfig = (priority: Idea["priority"]) => {
    return PRIORITY_OPTIONS.find((p) => p.value === priority) || PRIORITY_OPTIONS[0];
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 ring-1 ring-amber-500/10">
          <Lightbulb className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Идеи</h1>
          <p className="text-xs text-muted-foreground">
            Быстро записывай мысли и идеи
          </p>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-6 rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Напиши идею и нажми Enter..."
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
            disabled={adding}
          />
          <button
            onClick={handleAdd}
            disabled={!newContent.trim() || adding}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-all shrink-0",
              newContent.trim()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed",
            )}
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Ideas List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
            <Lightbulb className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Пока нет идей</p>
          <p className="text-xs text-muted-foreground/60">
            Напиши первую идею выше
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea) => {
            const isExpanded = expandedId === idea.id;
            const pConfig = getPriorityConfig(idea.priority);
            const PIcon = pConfig.icon;

            return (
              <div
                key={idea.id}
                className={cn(
                  "rounded-xl border border-border/40 bg-muted/10 transition-all",
                  isExpanded && "ring-1 ring-border/60",
                )}
              >
                {/* Main content */}
                <div className="flex items-start gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed break-words">
                      {idea.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {idea.priority !== "none" && (
                        <span className={cn("flex items-center gap-1 text-[10px]", pConfig.color)}>
                          <PIcon className="h-3 w-3" />
                          {pConfig.label}
                        </span>
                      )}
                      {idea.deadline && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Calendar className="h-3 w-3" />
                          {new Date(idea.deadline).toLocaleDateString("ru-RU")}
                        </span>
                      )}
                      {idea.comment && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <MessageSquare className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : idea.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(idea.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded options */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/30 space-y-3">
                    {/* Priority */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase mb-1.5 block">
                        Приоритет
                      </label>
                      <div className="flex gap-1">
                        {PRIORITY_OPTIONS.map((opt) => {
                          const OIcon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleUpdate(idea.id, { priority: opt.value })}
                              className={cn(
                                "flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all",
                                idea.priority === opt.value
                                  ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                                  : "text-muted-foreground hover:bg-muted/50",
                              )}
                            >
                              <OIcon className={cn("h-3 w-3", opt.color)} />
                              <span className="hidden sm:inline">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Deadline */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase mb-1.5 block">
                        Дедлайн
                      </label>
                      <input
                        type="date"
                        value={idea.deadline || ""}
                        onChange={(e) =>
                          handleUpdate(idea.id, { deadline: e.target.value || null })
                        }
                        className="rounded-lg border border-border/40 bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase mb-1.5 block">
                        Комментарий
                      </label>
                      <textarea
                        value={idea.comment}
                        onChange={(e) =>
                          handleUpdate(idea.id, { comment: e.target.value })
                        }
                        placeholder="Добавить заметку..."
                        rows={2}
                        className="w-full rounded-lg border border-border/40 bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
