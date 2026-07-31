"use client";

import {
  CheckCircle2,
  Circle,
  MessageSquare,
  Clock,
  Trash2,
} from "lucide-react";
import type { PersonalTask } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
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

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface PersonalTaskListProps {
  tasks: PersonalTask[];
  selectedDate: string;
  onEdit: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
  onDelete: (task: PersonalTask) => void;
  highlightTaskId?: string | null;
}

export function PersonalTaskList({
  tasks,
  selectedDate,
  onEdit,
  onToggleComplete,
  onDelete,
  highlightTaskId,
}: PersonalTaskListProps) {
  const dayTasks = tasks.filter((t) => t.date === selectedDate);

  if (dayTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
        <Clock className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm">На этот день нет задач</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {dayTasks
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border-l-4 p-3 transition-colors hover:bg-accent/50",
              PRIORITY_STYLES[task.priority],
              task.completed && "opacity-60",
              highlightTaskId === task.id &&
                "animate-pulse bg-primary/10 ring-2 ring-primary/40",
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(task);
              }}
              className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
            >
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-emerald-500" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "font-medium text-sm",
                    task.completed && "line-through text-muted-foreground",
                  )}
                >
                  {task.title}
                </span>
                <Badge
                  variant={PRIORITY_BADGE[task.priority]}
                  className="text-[10px] px-1.5 py-0"
                >
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </div>

              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {task.startTime.slice(0, 5)}–{task.endTime.slice(0, 5)}
                </span>
              </div>

              {task.comment && (
                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground/70">
                  <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{task.comment}</span>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onEdit(task)}
                className="rounded p-1 text-muted-foreground/50 hover:text-foreground transition-colors"
                title="Редактировать"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  onDelete(task);
                }}
                className="rounded p-1 text-muted-foreground/50 hover:text-destructive transition-colors"
                title="Удалить"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
