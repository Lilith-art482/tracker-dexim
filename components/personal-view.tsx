"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Table2,
  Loader2,
  Plus,
} from "lucide-react";
import type { PersonalTask, Board } from "@/lib/models";
import { mockPersonalTasks } from "@/lib/mock-data";
import { WeeklyTable } from "@/components/weekly-table";
import { PersonalTaskList } from "@/components/personal-task-list";
import { PersonalDashboard } from "@/components/personal-dashboard";
import { PersonalTaskDialog } from "@/components/personal-task-dialog";
import { CompactModeToggle } from "@/components/compact-mode-toggle";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/notification-context";

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
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].toLowerCase().slice(0, 4)}`;
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
  const { addNotification } = useNotifications();
  const [viewMode, setViewMode] = useState<"table" | "list">("table");
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const weekDates = getWeekDates(weekOffset);

  const currentMonthLabel = (() => {
    const months = new Set(weekDates.map((d) => d.getMonth()));
    if (months.size === 1) {
      return MONTH_NAMES[[...months][0]];
    }
    const [a, b] = [...months].sort();
    return `${MONTH_NAMES[a]} / ${MONTH_NAMES[b]}`;
  })();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        const url = uid
          ? `/api/personal-tasks?uid=${uid}`
          : "/api/personal-tasks";
        const res = await fetch(url);
        if (res.ok) {
          const data: PersonalTask[] = await res.json();
          if (!cancelled) setTasks(data);
        } else {
          if (!cancelled) setTasks(mockPersonalTasks);
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
  }, []);

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
      const toggled = { ...task, completed: !task.completed };
      setTasks((prev) => prev.map((t) => (t.id === task.id ? toggled : t)));

      try {
        const res = await fetch("/api/personal-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, completed: !task.completed }),
        });

        if (!res.ok) {
          const err = await res.json();
          addNotification(err.error || "Ошибка обновления задачи", "error");
          setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
          return;
        }

        const updated: PersonalTask = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        addNotification(
          updated.completed ? "Задача выполнена" : "Задача возобновлена",
          "success",
        );
      } catch {
        addNotification("Ошибка обновления задачи", "error");
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      }
    },
    [addNotification],
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
          addNotification(err.error || "Ошибка удаления задачи", "error");
          return;
        }

        addNotification("Задача удалена", "success");
      } catch {
        addNotification("Ошибка удаления задачи", "error");
      }
    },
    [addNotification],
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
            <p className="text-xs sm:text-sm text-muted-foreground">{currentMonthLabel}</p>
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
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={handleAddTask}
          >
            <Plus className="h-4 w-4" />
            Добавить задачу
          </Button>
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
          </div>
        </div>
      </div>

      {/* Month navigation */}
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

      {/* Day selector */}
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

      {/* Content */}
      {viewMode === "table" ? (
        <WeeklyTable
          tasks={tasks}
          onSaved={handleTaskSaved}
          onToggleComplete={handleToggleComplete}
          onDelete={handleDeleteTask}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <PersonalTaskList
              tasks={tasks}
              selectedDay={selectedDay}
              onEdit={handleEditTask}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDeleteTask}
            />
          </div>
          <div className="w-full lg:w-72 shrink-0">
            <PersonalDashboard tasks={tasks} />
          </div>
        </div>
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
      />
    </div>
  );
}
