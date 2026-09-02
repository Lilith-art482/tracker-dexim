"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Loader2,
  Calendar,
  TrendingUp,
  ListTodo,
} from "lucide-react";
import type { PersonalTask, PersonalKanbanTask, PersonalPlanEntry, Board, Priority } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBoardIcon } from "@/lib/board-icons";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  high: { label: "Высокий", color: "text-rose-500", bg: "bg-rose-500/10", icon: AlertTriangle },
  medium: { label: "Средний", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
  low: { label: "Низкий", color: "text-sky-500", bg: "bg-sky-500/10", icon: Circle },
  none: { label: "Без приоритета", color: "text-muted-foreground", bg: "bg-muted", icon: Circle },
};

interface ScheduleDashboardProps {
  boards: Board[];
}

export function ScheduleDashboard({ boards }: ScheduleDashboardProps) {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [kanbanTasks, setKanbanTasks] = useState<PersonalKanbanTask[]>([]);
  const [planEntries, setPlanEntries] = useState<PersonalPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const scheduleBoardIds = boards.map((b) => b.id);
        if (scheduleBoardIds.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const [tasksRes, kanbanRes, planRes] = await Promise.all([
          fetch(`/api/personal-tasks?uid=${uid}`),
          fetch(`/api/personal-kanban-tasks?uid=${uid}`),
          fetch(`/api/personal-plan-entries?uid=${uid}`),
        ]);

        if (!cancelled) {
          if (tasksRes.ok) {
            const allTasks: PersonalTask[] = await tasksRes.json();
            setTasks(allTasks.filter((t) => scheduleBoardIds.includes(t.boardId || "")));
          }
          if (kanbanRes.ok) {
            const allKanban: PersonalKanbanTask[] = await kanbanRes.json();
            setKanbanTasks(allKanban.filter((t) => scheduleBoardIds.includes(t.boardId || "")));
          }
          if (planRes.ok) {
            const allPlan: PersonalPlanEntry[] = await planRes.json();
            setPlanEntries(allPlan.filter((t) => scheduleBoardIds.includes(t.boardId || "")));
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [boards]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const allTasks = [
      ...tasks.map(t => ({ ...t, source: "list" as const })),
      ...kanbanTasks.map(t => ({ ...t, source: "kanban" as const })),
        ...planEntries.map(t => ({ ...t, source: "plan" as const })),
    ];

    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const pending = total - completed;
    const todayTasks = allTasks.filter(t => {
      const date = "date" in t ? t.date : undefined;
      return date === today;
    });
    const todayCompleted = todayTasks.filter(t => t.completed).length;
    const highPriority = allTasks.filter(t => "priority" in t && t.priority === "high" && !t.completed).length;

    return { total, completed, pending, todayTotal: todayTasks.length, todayCompleted, highPriority };
  }, [tasks, kanbanTasks, planEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ListTodo className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Всего</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Выполнено</span>
          </div>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">В работе</span>
          </div>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Высокий приоритет</span>
          </div>
          <p className="text-2xl font-bold">{stats.highPriority}</p>
        </div>
      </div>

      {/* Today's progress */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Прогресс за сегодня</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Выполнено</span>
            <span className="font-medium">{stats.todayCompleted} из {stats.todayTotal}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: stats.todayTotal > 0 ? `${(stats.todayCompleted / stats.todayTotal) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Board sections */}
      {boards.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Доски
          </h3>
          {boards.map((board) => {
            const icon = getBoardIcon(board.icon);
            const Icon = icon;
            return (
              <div key={board.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-medium">{board.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tasks.filter(t => t.boardId === board.id).length + 
                   kanbanTasks.filter(t => t.boardId === board.id).length + 
                   planEntries.filter(t => t.boardId === board.id).length} задач
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
