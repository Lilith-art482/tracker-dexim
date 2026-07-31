"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Clock,
  AlertTriangle,
  Loader2,
  CalendarDays,
} from "lucide-react";
import type { PersonalPlanEntry, Board, Priority } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; icon: typeof AlertTriangle }
> = {
  high: {
    label: "Высокий",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    icon: AlertTriangle,
  },
  medium: {
    label: "Средний",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    icon: Clock,
  },
  low: {
    label: "Низкий",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    icon: Circle,
  },
};

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const day = d.getUTCDate();
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const weekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return `${weekdays[d.getUTCDay()]}, ${day} ${months[d.getUTCMonth()]}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

interface PlanEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: PersonalPlanEntry | null;
  date: string;
  activeBoard?: Board;
  onSaved: (entry: PersonalPlanEntry) => void;
  onDelete?: (entry: PersonalPlanEntry) => void;
}

function PlanEntryDialog({
  open,
  onOpenChange,
  entry,
  date,
  activeBoard,
  onSaved,
  onDelete,
}: PlanEntryDialogProps) {
  const isEditing = !!entry;
  const [title, setTitle] = useState(entry?.title ?? "");
  const [startTime, setStartTime] = useState(entry?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(entry?.endTime ?? "09:30");
  const [priority, setPriority] = useState<Priority>(
    entry?.priority ?? "medium",
  );
  const [comment, setComment] = useState(entry?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setStartTime(entry.startTime);
      setEndTime(entry.endTime);
      setPriority(entry.priority);
      setComment(entry.comment ?? "");
    } else {
      setTitle("");
      setStartTime("09:00");
      setEndTime("09:30");
      setPriority("medium");
      setComment("");
    }
    setErrors({});
  }, [entry, open]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Название обязательно";
    if (startTime >= endTime) newErrors.endTime = "Конец должен быть позже начала";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      if (isEditing && entry) {
        const res = await fetch("/api/personal-plan-entries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: entry.id,
            title: title.trim(),
            startTime,
            endTime,
            priority,
            comment: comment.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка сохранения");
          return;
        }

        const updated: PersonalPlanEntry = await res.json();
        onSaved(updated);
        toast.success("Запись обновлена");
      } else {
        const ownerId = auth?.currentUser?.uid || null;
        const res = await fetch("/api/personal-plan-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            date,
            startTime,
            endTime,
            priority,
            comment: comment.trim() || undefined,
            ownerId: ownerId || undefined,
            boardId: activeBoard?.id || undefined,
          }),
        });

        if (res.status === 503) {
          toast.error("База данных недоступна");
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка создания");
          return;
        }

        const created: PersonalPlanEntry = await res.json();
        onSaved(created);
        toast.success("Запись создана");
      }

      onOpenChange(false);
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b bg-muted/20">
          <DialogHeader className="p-0">
            <DialogTitle className="text-base">
              {isEditing ? "Редактировать запись" : "Новая запись"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70 font-medium">
              Название
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground/70 font-medium">
                Начало
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground/70 font-medium">
                Конец
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={!!errors.endTime}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70 font-medium">
              Приоритет
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground/70 font-medium">
              Комментарий
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Описание задачи"
              className="min-h-[56px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 m-0 rounded-b-xl gap-3">
          <div className="flex items-center gap-2 flex-1">
            {isEditing && onDelete && entry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast("Удалить запись?", {
                    action: {
                      label: "Удалить",
                      onClick: () => {
                        onDelete(entry);
                        onOpenChange(false);
                        toast.success("Запись удалена");
                      },
                    },
                    cancel: {
                      label: "Отмена",
                      onClick: () => {},
                    },
                  });
                }}
                disabled={saving}
                className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="min-w-[100px]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PersonalPlanViewProps {
  activeBoard?: Board;
}

export function PersonalPlanView({ activeBoard }: PersonalPlanViewProps) {
  const [entries, setEntries] = useState<PersonalPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PersonalPlanEntry | null>(
    null,
  );

  const today = getTodayStr();
  const todayDate = new Date(today + "T00:00:00Z");
  const selectedDateObj = new Date(selectedDate + "T00:00:00Z");
  const diffDays = Math.round(
    (selectedDateObj.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const canGoBack = diffDays > -7;
  const canGoForward = diffDays < 7;
  const isToday = selectedDate === today;

  const dayEntries = entries
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedCount = dayEntries.filter((e) => e.completed).length;
  const totalCount = dayEntries.length;

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ uid, date: selectedDate });
      if (activeBoard?.id) params.set("boardId", activeBoard.id);
      const res = await fetch(
        `/api/personal-plan-entries?${params.toString()}`,
      );
      if (res.ok) {
        const data: PersonalPlanEntry[] = await res.json();
        setEntries((prev) => {
          const other = prev.filter((e) => e.date !== selectedDate);
          return [...other, ...data];
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [selectedDate, activeBoard?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleToggleComplete = useCallback(
    async (entry: PersonalPlanEntry) => {
      const newCompleted = !entry.completed;
      try {
        const res = await fetch("/api/personal-plan-entries", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: entry.id,
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : null,
          }),
        });
        if (res.ok) {
          const updated: PersonalPlanEntry = await res.json();
          setEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? updated : e)),
          );
          toast.success(
            newCompleted ? "Выполнено" : "Возвращено в план",
          );
        } else {
          toast.error("Не удалось обновить");
        }
      } catch {
        toast.error("Ошибка сети");
      }
    },
    [],
  );

  const handleDelete = useCallback(async (entry: PersonalPlanEntry) => {
    try {
      const res = await fetch("/api/personal-plan-entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
      } else {
        toast.error("Не удалось удалить");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  }, []);

  const handleSaved = useCallback((saved: PersonalPlanEntry) => {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setEditingEntry(null);
  }, []);

  const goBack = () => {
    if (!canGoBack) return;
    const d = new Date(selectedDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - 1);
    setSelectedDate(toDateStr(d));
  };

  const goForward = () => {
    if (!canGoForward) return;
    const d = new Date(selectedDate + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    setSelectedDate(toDateStr(d));
  };

  return (
    <div className="space-y-4">
      {/* Day header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-[160px]">
            <p className="text-sm font-semibold">
              {formatDisplayDate(selectedDate)}
            </p>
            {isToday && (
              <p className="text-[10px] text-primary font-medium">Сегодня</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goForward}
            disabled={!canGoForward}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>
                {completedCount}/{totalCount}
              </span>
            </div>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditingEntry(null);
              setDialogOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{
              width: `${Math.round((completedCount / totalCount) * 100)}%`,
            }}
          />
        </div>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : dayEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            План на этот день пуст
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Добавьте задачу, чтобы начать
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayEntries.map((entry) => {
            const pc = PRIORITY_CONFIG[entry.priority];
            return (
              <div
                key={entry.id}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border border-border/40 px-4 py-3 transition-all",
                  entry.completed
                    ? "bg-muted/20 opacity-60"
                    : "bg-gradient-to-r from-background to-muted/10 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20",
                )}
              >
                <button
                  onClick={() => handleToggleComplete(entry)}
                  className="mt-0.5 shrink-0"
                  title={
                    entry.completed
                      ? "Отменить выполнение"
                      : "Отметить выполненной"
                  }
                >
                  {entry.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 hover:text-emerald-600 transition-colors" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30 hover:text-emerald-500 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        entry.completed &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {entry.title}
                    </p>
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        pc.bg,
                        pc.color,
                      )}
                    >
                      {pc.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.startTime} — {entry.endTime}
                    </span>
                  </div>
                  {entry.comment && (
                    <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">
                      {entry.comment}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditingEntry(entry);
                      setDialogOpen(true);
                    }}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors"
                    title="Редактировать"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() =>
                      toast("Удалить запись?", {
                        action: {
                          label: "Удалить",
                          onClick: () => handleDelete(entry),
                        },
                        cancel: {
                          label: "Отмена",
                          onClick: () => {},
                        },
                      })
                    }
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PlanEntryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        date={selectedDate}
        activeBoard={activeBoard}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />
    </div>
  );
}
