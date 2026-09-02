"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Table2,
  Loader2,
  Plus,
  Columns3,
} from "lucide-react";
import type { Task, Column, Board } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TeamWeekTable } from "@/components/team-week-table";
import { TeamListView } from "@/components/team-list-view";
import { TeamKanban } from "@/components/team-kanban";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { ArchiveView } from "@/components/archive-view";

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

interface TeamViewProps {
  activeBoard: Board;
  columns: Column[];
  isArchiveView: boolean;
}

export function TeamView({
  activeBoard,
  columns,
  isArchiveView,
}: TeamViewProps) {
  const [viewMode, setViewMode] = useState<"table" | "list" | "kanban">(
    "kanban",
  );
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogColumnId, setDialogColumnId] = useState("");

  const weekDates = getWeekDates(weekOffset);

  const currentMonthLabel = (() => {
    const months = new Set(weekDates.map((d) => d.getMonth()));
    if (months.size === 1) {
      return MONTH_NAMES[[...months][0]];
    }
    const [a, b] = [...months].sort();
    return `${MONTH_NAMES[a]} / ${MONTH_NAMES[b]}`;
  })();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid || "";
      const res = await fetch(
        `/api/tasks?boardId=${activeBoard.id}&all=true&uid=${uid}`,
      );
      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks(data);
      }
    } catch {
      console.error("Ошибка загрузки задач");
    } finally {
      setLoading(false);
    }
  }, [activeBoard.id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskSaved = useCallback((task: Task) => {
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

  const handleAddTask = useCallback(() => {
    const firstCol = columns[0];
    if (!firstCol) {
      toast.info("Создайте хотя бы одну колонку");
      return;
    }
    setDialogColumnId(firstCol.id);
    setEditingTask(null);
    setDialogOpen(true);
  }, [columns]);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDialogColumnId(task.columnId);
    setDialogOpen(true);
  }, []);

  if (isArchiveView) {
    return <ArchiveView boardId={activeBoard.id} />;
  }

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
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start justify-between sm:block">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {activeBoard?.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentMonthLabel}
            </p>
          </div>
          <div className="flex sm:hidden items-center gap-1.5 mt-1">
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Columns3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-primary/10 text-primary shadow-sm"
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
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
              </button>
            </div>
            {viewMode !== "kanban" && (
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
          {viewMode !== "kanban" && (
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
              onClick={() => setViewMode("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Columns3 className="h-4 w-4" />
              Канбан
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                viewMode === "table"
                  ? "bg-primary/10 text-primary shadow-sm"
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
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="h-4 w-4" />
              Список
            </button>
          </div>
        </div>
      </div>

      {viewMode !== "kanban" && (
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

      {viewMode !== "kanban" && (
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
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-accent",
                  isToday && !isSelected && "ring-1 ring-primary/30",
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

      {viewMode === "kanban" ? (
        <TeamKanban boardId={activeBoard.id} columns={columns} />
      ) : viewMode === "table" ? (
        <TeamWeekTable
          tasks={tasks}
          columns={columns}
          weekDates={weekDates}
          onSaved={handleTaskSaved}
          onEdit={handleEditTask}
          onCellClick={(dayIdx, colId) => {
            const dayStr = weekDates[dayIdx].toISOString().split("T")[0];
            setEditingTask({
              id: "",
              boardId: activeBoard.id,
              columnId: colId || columns[0]?.id || "",
              title: "",
              description: "",
              startDate: dayStr,
              endDate: null,
              assignee: null,
              assignees: [],
              priority: "medium",
              completed: false,
              archived: false,
              archivedAt: null,
              createdAt: "",
              updatedAt: "",
            } as Task);
            setDialogOpen(true);
          }}
        />
      ) : (
        <TeamListView
          tasks={tasks}
          selectedDay={selectedDay}
          weekDates={weekDates}
          columns={columns}
          onEdit={handleEditTask}
        />
      )}

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        columnId={dialogColumnId}
        boardId={activeBoard.id}
        task={editingTask}
        onSaved={handleTaskSaved}
      />
    </div>
  );
}
