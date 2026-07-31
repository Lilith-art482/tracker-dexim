"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  LayoutList,
  LayoutDashboard,
  Settings2,
  Table2,
  Loader2,
  Plus,
} from "lucide-react";
import type { PersonalTask, Board, Note } from "@/lib/models";
import { mockPersonalTasks } from "@/lib/mock-data";
import { WeeklyTable } from "@/components/weekly-table";
import { PersonalTaskList } from "@/components/personal-task-list";
import { PersonalDashboard } from "@/components/personal-dashboard";
import { PersonalTaskDialog } from "@/components/personal-task-dialog";
import { PersonalKanban } from "@/components/personal-kanban";
import {
  PersonalSettingsDialog,
  getPersonalSettings,
} from "@/components/personal-settings-dialog";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase().slice(0, 4)} ${date.getFullYear()}`;
}

function getWeekDates(weekOffset: number): Date[] {
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function PersonalView({ activeBoard }: { activeBoard?: Board }) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"table" | "list" | "kanban" | "dashboard">("table");
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [noteSnippets, setNoteSnippets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const weekDates = getWeekDates(weekOffset);
  const weekDateStrings = weekDates.map((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const selectedDate = weekDateStrings[selectedDay] ?? weekDateStrings[0];

  const tasksForWeek = tasks.filter((t) => weekDateStrings.includes(t.date));

  const currentMonthLabel = (() => {
    const months = new Set(weekDates.map((d) => d.getMonth()));
    const years = new Set(weekDates.map((d) => d.getFullYear()));
    const yearStr = years.size === 1 ? ` ${[...years][0]}` : "";
    if (months.size === 1) {
      return `${MONTH_NAMES[[...months][0]]}${yearStr}`;
    }
    const [a, b] = [...months].sort();
    return `${MONTH_NAMES[a]} / ${MONTH_NAMES[b]}${yearStr}`;
  })();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        const params = new URLSearchParams();
        if (uid) params.set("uid", uid);
        if (activeBoard?.id) params.set("boardId", activeBoard.id);
        const url = `/api/personal-tasks?${params.toString()}`;
        const res = await fetch(url);
        if (res.ok) {
          const data: PersonalTask[] = await res.json();
          if (!cancelled) setTasks(data);
        } else {
          if (!cancelled) setTasks(mockPersonalTasks);
        }

        // Convert scheduled notes to tasks
        if (uid) {
          try {
            const timezoneOffset = new Date().getTimezoneOffset();
            const convertRes = await fetch("/api/notes/convert-scheduled", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid, timezoneOffset }),
            });
            if (convertRes.ok) {
              const { tasks: newTasks } = await convertRes.json();
              if (newTasks?.length) {
                setTasks((prev) => {
                  const existingIds = new Set(prev.map((t) => t.id));
                  const unique = newTasks.filter(
                    (t: PersonalTask) => !existingIds.has(t.id),
                  );
                  return [...unique, ...prev];
                });
                if (newTasks.length === 1) {
                  toast.success("Заметка превращена в задачу");
                } else if (newTasks.length > 1) {
                  toast.success(
                    `${newTasks.length} заметок превращены в задачи`,
                  );
                }
              }
            }
          } catch {
            // silent
          }

          // Load note snippets for tooltips
          try {
            const notesRes = await fetch(`/api/notes?uid=${uid}`);
            if (notesRes.ok) {
              const notesData: Note[] = await notesRes.json();
              const snippets: Record<string, string> = {};
              for (const note of notesData) {
                const firstBlock = note.blocks?.find(
                  (b) => b.type === "paragraph" && b.content.trim(),
                );
                snippets[note.id] = firstBlock
                  ? firstBlock.content.slice(0, 120)
                  : "";
              }
              setNoteSnippets(snippets);
            }
          } catch {
            // silent
          }
        }
      } catch {
        if (!cancelled) setTasks(mockPersonalTasks);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [activeBoard?.id]);

  // Auto-delete completed tasks based on user settings
  useEffect(() => {
    if (loading || !tasks.length) return;
    const settings = getPersonalSettings();
    const days = settings.autoDeleteTableDays ?? 30;
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const toDelete = tasks.filter(
      (t) =>
        t.completed &&
        t.completedAt &&
        new Date(t.completedAt).getTime() < cutoff,
    );
    if (toDelete.length > 0) {
      setTasks((prev) => prev.filter((t) => !toDelete.find((d) => d.id === t.id)));
      for (const t of toDelete) {
        fetch("/api/personal-tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.id }),
        }).catch(() => {});
      }
      toast.success(`Удалено ${toDelete.length} задач`);
    }
  }, [loading, tasks]);

  const handleTaskSaved = useCallback((task: PersonalTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = task;
        return updated;
      }
      return [...prev, task];
    });
  }, []);

  const handleToggleComplete = useCallback(
    async (task: PersonalTask) => {
      const newCompleted = !task.completed;
      const completedAt = newCompleted ? new Date().toISOString() : null;
      const toggled = { ...task, completed: newCompleted, completedAt };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? toggled : t)));

      try {
        const res = await fetch("/api/personal-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            completed: newCompleted,
            completedAt,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка обновления задачи");
          setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
          return;
        }

        const updated: PersonalTask = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        toast.success(
          updated.completed ? "Задача выполнена" : "Задача возобновлена",
        );
      } catch {
        toast.error("Ошибка обновления задачи");
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      }
    },
    [],
  );

  const handleDeleteTask = useCallback(
    async (task: PersonalTask) => {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));

      try {
        const res = await fetch("/api/personal-tasks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка удаления задачи");
          return;
        }

        toast.success("Задача удалена");
      } catch {
        toast.error("Ошибка удаления задачи");
      }
    },
    [toast],
  );

  const handleNoteClick = useCallback(
    (noteId: string) => {
      router.push(`/notes?noteId=${noteId}`);
    },
    [router],
  );

  const handleEditTask = useCallback((task: PersonalTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  }, []);

  const handleAddTask = useCallback(() => {
    setEditingTask(null);
    setDialogOpen(true);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header: title + view toggle */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start justify-between sm:block">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {activeBoard?.name || "Расписание"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentMonthLabel}
            </p>
          </div>
          <div className="flex sm:hidden items-center gap-1.5 mt-1">
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Table2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("dashboard")}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "dashboard"
                    ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Настройки"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            {viewMode !== "kanban" && viewMode !== "dashboard" && (
              <Button
                variant="default"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleAddTask}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          {viewMode !== "kanban" && viewMode !== "dashboard" && (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4" />
              Добавить задачу
            </Button>
          )}
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "table"
                  ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table2 className="h-4 w-4" />
              Таблица
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "list"
                  ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="h-4 w-4" />
              Список
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Columns3 className="h-4 w-4" />
              Канбан
            </button>
            <button
              onClick={() => setViewMode("dashboard")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "dashboard"
                  ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Дашборд
            </button>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            title="Настройки"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Month navigation */}
      {viewMode !== "kanban" && viewMode !== "dashboard" && (
        <div className="mb-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tracking-tight">
            {currentMonthLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Day selector */}
      {viewMode !== "kanban" && viewMode !== "dashboard" && (
        <div className="mb-4 flex gap-1 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 snap-x snap-mandatory scrollbar-none">
          {weekDates.map((date, idx) => {
            const isToday = (() => {
              const now = new Date();
              return (
                date.getDate() === now.getDate() &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear()
              );
            })();
            const isSelected = idx === selectedDay;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors min-w-[64px] shrink-0 snap-start lg:flex-1 lg:shrink lg:min-w-0",
                  isSelected
                    ? "bg-emerald-500/10 text-emerald-600 font-semibold"
                    : "text-muted-foreground hover:bg-accent",
                  isToday && !isSelected && "ring-1 ring-emerald-500/30",
                )}
              >
                <span className="text-[11px] uppercase tracking-wider">
                  {DAY_NAMES[idx]}
                </span>
                <span className="text-sm font-medium">{date.getDate()}</span>
                <span className="text-[10px] text-muted-foreground/60">
                  {formatDate(date)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {viewMode === "kanban" ? (
        <PersonalKanban boardId={activeBoard?.id || ""} activeBoard={activeBoard} />
      ) : viewMode === "dashboard" ? (
        <div className="max-w-2xl mx-auto">
          <PersonalDashboard tasks={tasksForWeek} />
        </div>
      ) : viewMode === "table" ? (
        <WeeklyTable
          tasks={tasksForWeek}
          weekDates={weekDates}
          onSaved={handleTaskSaved}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
          onNoteClick={handleNoteClick}
          noteSnippets={noteSnippets}
          activeBoard={activeBoard}
        />
      ) : (
        <PersonalTaskList
          tasks={tasksForWeek}
          selectedDate={selectedDate}
          onEdit={handleEditTask}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
        />
      )}

      <PersonalTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSaved={handleTaskSaved}
        onDelete={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        activeBoard={activeBoard}
      />

      <PersonalSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
