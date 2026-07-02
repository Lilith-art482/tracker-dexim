"use client";

import { CheckCircle2 } from "lucide-react";
import type { PersonalTask } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTH_NAMES_RU = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-rose-500 bg-rose-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-sky-500 bg-sky-500/5",
};

const PRIORITY_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Выс.",
  medium: "Сред.",
  low: "Низ.",
};

interface CompletedTasksBlockProps {
  tasks: PersonalTask[];
  onToggleComplete: (task: PersonalTask) => void;
  weekDates?: Date[];
}

function formatDateForDisplay(task: PersonalTask, weekDates?: Date[]): string {
  if (weekDates && task.dayOfWeek >= 0 && task.dayOfWeek < 7) {
    const d = weekDates[task.dayOfWeek];
    if (d) {
      const day = d.getDate();
      const month = MONTH_NAMES_RU[d.getMonth()];
      return `${day} ${month}`;
    }
  }
  return DAY_NAMES[task.dayOfWeek];
}

function formatCompletedAt(updatedAt: string): string {
  const d = new Date(updatedAt);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function CompletedTasksBlock({
  tasks,
  onToggleComplete,
  weekDates,
}: CompletedTasksBlockProps) {
  const completed = tasks.filter((t) => t.completed).slice(0, 20);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Выполненные
        </h3>
        <span className="text-xs text-muted-foreground">
          {completed.length}
        </span>
      </div>
      {completed.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          Нет выполненных задач
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto pr-1">
          {/* Table header */}
          <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
            <span className="flex-1">Задача</span>
            <span className="w-12 shrink-0">Дата</span>
            <span className="w-14 shrink-0">Время</span>
            <span className="w-10 shrink-0 text-right">Приор.</span>
          </div>
          {completed.map((task) => (
            <button
              key={task.id}
              onClick={() => onToggleComplete(task)}
              className={cn(
                "flex items-center gap-1 rounded-md border-l-2 px-2 py-1.5 text-left transition-colors hover:bg-accent/50",
                PRIORITY_COLORS[task.priority],
              )}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "font-medium block truncate text-[11px]",
                    task.completed && "line-through opacity-70",
                  )}
                >
                  {task.title}
                </span>
              </div>
              <span className="w-12 text-[10px] text-muted-foreground shrink-0 truncate">
                {formatDateForDisplay(task, weekDates)}
              </span>
              <span className="w-14 text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {task.updatedAt ? formatCompletedAt(task.updatedAt) : "—"}
              </span>
              <Badge
                variant={PRIORITY_BADGE[task.priority]}
                className="text-[9px] px-1 py-0 shrink-0"
              >
                {PRIORITY_LABELS[task.priority]}
              </Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
