"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  User,
  Tag,
  AlertTriangle,
} from "lucide-react";
import type { Task, Column } from "@/lib/models";
import { auth } from "@/lib/firebase";

interface TeamWeekViewProps {
  boardId: string;
  columns: Column[];
}

const DAY_NAMES_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const priorityColors: Record<string, string> = {
  high: "border-l-rose-500 bg-rose-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-sky-500 bg-sky-500/5",
};

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function TeamWeekView({ boardId, columns }: TeamWeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const d = new Date(now);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(currentWeekStart);

  const monthLabel = `${weekDates[0].toLocaleDateString("ru-RU", { month: "long", day: "numeric" })} – ${weekDates[6].toLocaleDateString("ru-RU", { month: "long", day: "numeric" })}`;

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
        setTasks(data);
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

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const tasksForDay = (day: Date): Task[] => {
    const dateStr = day.toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (t.archived) return false;
      if (!t.startDate && !t.endDate) return false;
      if (
        t.startDate &&
        t.startDate <= dateStr &&
        (!t.endDate || t.endDate >= dateStr)
      )
        return true;
      if (!t.startDate && t.endDate && t.endDate >= dateStr) return true;
      return false;
    });
  };

  const today = new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={prevWeek}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Предыдущая
        </button>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{monthLabel}</span>
        </div>
        <button
          onClick={nextWeek}
          className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors"
        >
          Следующая
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Нет задач на эту неделю
          </h2>
          <p className="text-sm text-muted-foreground">
            Задачи с датами появятся здесь
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((day, i) => {
            const dayTasks = tasksForDay(day);
            const isToday = isSameDay(day, today);

            return (
              <div key={i} className="space-y-1">
                <div
                  className={`text-center text-xs font-medium py-1.5 rounded-md ${
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <div>{DAY_NAMES_RU[i]}</div>
                  <div className="text-lg font-bold">{day.getDate()}</div>
                </div>
                <div className="space-y-1 min-h-[120px]">
                  {dayTasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center pt-2">
                      Нет задач
                    </p>
                  )}
                  {dayTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className={`rounded-md border-l-2 p-1.5 text-xs ${priorityColors[task.priority] || "border-l-border"}`}
                    >
                      <p className="font-medium truncate">{task.title}</p>
                      {task.assignees.length > 0 && (
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-0.5">
                          <User className="h-2.5 w-2.5" />
                          {task.assignees[0]}
                          {task.assignees.length > 1 &&
                            ` +${task.assignees.length - 1}`}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground truncate">
                        {columnNames[task.columnId] || ""}
                      </p>
                    </div>
                  ))}
                  {dayTasks.length > 4 && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      +{dayTasks.length - 4} ещё
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
