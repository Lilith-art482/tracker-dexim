"use client";

import { CheckCircle2 } from "lucide-react";
import type { PersonalTask } from "@/lib/models";
import { cn } from "@/lib/utils";

function formatDayFromDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[d.getUTCDay()];
}

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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          Выполненные
        </h3>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {completed.length}
        </span>
      </div>
      {completed.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Нет выполненных задач
        </p>
      ) : (
        <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto">
          {completed.map((task) => (
            <button
              key={task.id}
              onClick={() => onToggleComplete(task)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-left w-full transition-colors hover:bg-accent/40",
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[11px] leading-tight block truncate">
                  {task.title}
                </span>
                <span className="text-muted-foreground/60 text-[10px]">
                  {formatDayFromDate(task.date)} {task.startTime.slice(0, 5)}–
                  {task.endTime.slice(0, 5)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
