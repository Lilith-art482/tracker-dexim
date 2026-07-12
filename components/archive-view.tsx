"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Archive,
  RotateCcw,
  Calendar,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { Task } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface ArchiveViewProps {
  boardId: string;
}

export function ArchiveView({ boardId }: ArchiveViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchArchived = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid || "";
      const res = await fetch(
        `/api/tasks?archived=true&boardId=${boardId}&uid=${uid}`,
      );
      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks(data);
      }
    } catch {
      console.error("Ошибка загрузки архива");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleRestore = async (task: Task) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          boardId,
          columnId: task.columnId,
          archived: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка восстановления задачи");
        return;
      }

      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Задача восстановлена на доску");
    } catch {
      toast.error("Ошибка восстановления задачи");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Archive className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Архив пуст</h2>
        <p className="text-sm text-muted-foreground">
          Архивированные задачи появятся здесь
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {tasks.length} {tasks.length === 1 ? "задача" : "задач"} в архиве
      </p>
      {tasks.map((task) => (
        <Card key={task.id} className="border-l-4 border-l-amber-500/50">
          <CardHeader className="pb-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Archive className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm leading-tight line-through text-muted-foreground">
                  {task.title}
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 h-7 text-xs"
                onClick={() => handleRestore(task)}
              >
                <RotateCcw className="h-3 w-3" />
                Восстановить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pb-2">
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {task.assignee && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {task.assignee}
                </span>
              )}
              {task.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.endDate + "T00:00:00Z").toLocaleDateString(
                    "ru-RU",
                  )}
                </span>
              )}
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="h-3 w-3" />
                Выполнена
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
