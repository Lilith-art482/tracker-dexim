"use client";

import { useState, useEffect, useCallback } from "react";
import {
  List,
  Loader2,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Task, Column } from "@/lib/models";
import { auth } from "@/lib/firebase";

interface TeamListViewProps {
  boardId: string;
  columns: Column[];
}

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

export function TeamListView({ boardId, columns }: TeamListViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const columnNames = Object.fromEntries(columns.map((c) => [c.id, c.name]));

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid || "";
      const res = await fetch(
        `/api/tasks?boardId=${boardId}&all=true&uid=${uid}`,
      );
      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks(data.filter((t) => !t.archived));
      }
    } catch {
      console.error("Ошибка загрузки задач");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sorted = [...tasks].sort((a, b) => {
    if (a.priority === "high" && b.priority !== "high") return -1;
    if (a.priority !== "high" && b.priority === "high") return 1;
    if (a.priority === "medium" && b.priority === "low") return -1;
    if (a.priority === "low" && b.priority === "medium") return 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <List className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Нет задач</h2>
        <p className="text-sm text-muted-foreground">
          Создайте задачи в карточках, чтобы они появились здесь
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
        , сортировка по приоритету
      </p>
      {sorted.map((task) => (
        <div
          key={task.id}
          className={`rounded-lg border-l-4 p-4 transition-colors hover:bg-muted/50 ${priorityColors[task.priority] || "border-l-border"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                {task.completed && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                <h3
                  className={`font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}
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
                    {new Date(task.startDate + "T00:00:00Z").toLocaleDateString(
                      "ru-RU",
                    )}
                  </span>
                )}
                {task.endDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(task.endDate + "T00:00:00Z").toLocaleDateString(
                      "ru-RU",
                    )}
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground">
                  {columnNames[task.columnId] || ""}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  task.priority === "high"
                    ? "bg-rose-100 text-rose-700"
                    : task.priority === "medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-sky-100 text-sky-700"
                }`}
              >
                <AlertTriangle className="h-2.5 w-2.5" />
                {priorityLabels[task.priority]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
