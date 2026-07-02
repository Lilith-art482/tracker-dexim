"use client";

import { CheckCircle2 } from "lucide-react";
import type { PersonalTask } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

interface CompletedTasksBlockProps {
  tasks: PersonalTask[];
  onToggleComplete: (task: PersonalTask) => void;
}

export function CompletedTasksBlock({
  tasks,
  onToggleComplete,
}: CompletedTasksBlockProps) {
  const completed = tasks.filter((t) => t.completed);

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
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
          {completed.map((task) => (
            <button
              key={task.id}
              onClick={() => onToggleComplete(task)}
              className={cn(
                "flex items-center gap-2 rounded-md border-l-2 px-2.5 py-2 text-xs text-left w-full transition-colors hover:bg-accent/50",
                PRIORITY_COLORS[task.priority],
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="line-through font-medium block truncate">
                  {task.title}
                </span>
                <span className="text-muted-foreground text-[10px]">
                  {DAY_NAMES[task.dayOfWeek]} {task.startTime.slice(0, 5)}–
                  {task.endTime.slice(0, 5)}
                </span>
              </div>
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
