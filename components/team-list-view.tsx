"use client";

import { useMemo } from "react";
import {
  List,
  User,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { Task, Column } from "@/lib/models";
import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  high: "border-l-rose-500",
  medium: "border-l-amber-500",
  low: "border-l-sky-500",
};

const priorityLabels: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function taskHasDateOnDay(task: Task, dayStr: string): boolean {
  if (task.archived) return false;
  if (task.startDate && task.startDate <= dayStr && (!task.endDate || task.endDate >= dayStr))
    return true;
  if (!task.startDate && task.endDate && task.endDate >= dayStr) return true;
  return false;
}

export function TeamListView({
  tasks,
  selectedDay,
  weekDates,
  columns,
  onEdit,
}: {
  tasks: Task[];
  selectedDay: number;
  weekDates: Date[];
  columns: Column[];
  onEdit: (task: Task) => void;
}) {
  const columnNames = Object.fromEntries(
    columns.map((c) => [c.id, c.name]),
  );

  const dayStr = weekDates[selectedDay]?.toISOString().split("T")[0] || "";

  const dayTasks = useMemo(() => {
    return tasks.filter((t) => taskHasDateOnDay(t, dayStr));
  }, [tasks, dayStr]);

  const sorted = useMemo(() => {
    return [...dayTasks].sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      const ap = p[a.priority] ?? 1;
      const bp = p[b.priority] ?? 1;
      if (ap !== bp) return ap - bp;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
  }, [dayTasks]);

  if (sorted.length === 0) {
    const weekDay = weekDates[selectedDay];
    const dayLabel = weekDay
      ? weekDay.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        })
      : "";

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <List className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Нет задач</h2>
        <p className="text-sm text-muted-foreground">
          На {dayLabel} нет задач
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground mb-4">
        {sorted.length}{" "}
        {sorted.length === 1
          ? "задача"
          : sorted.length < 5
            ? "задачи"
            : "задач"}
      </p>
      {sorted.map((task) => (
        <button
          key={task.id}
          onClick={() => onEdit(task)}
          className={cn(
            "w-full text-left rounded-lg border-l-4 p-4 transition-colors hover:bg-muted/50",
            priorityColors[task.priority] || "border-l-border",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {task.completed && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                <h3
                  className={cn(
                    "font-medium truncate",
                    task.completed && "line-through text-muted-foreground",
                  )}
                >
                  {task.title}
                </h3>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                {task.assignees.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assignees.join(", ")}
                  </span>
                )}
                {task.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(task.startDate)}
                  </span>
                )}
                {task.endDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(task.endDate)}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {columnNames[task.columnId] || ""}
                </span>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                task.priority === "high"
                  ? "bg-rose-100 text-rose-700"
                  : task.priority === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-sky-100 text-sky-700",
              )}
            >
              <AlertTriangle className="h-2.5 w-2.5" />
              {priorityLabels[task.priority]}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
