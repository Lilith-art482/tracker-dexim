"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Filter,
  ChevronDown,
  BarChart3,
  TrendingUp,
  ListTodo,
  Loader2,
  X,
  ArrowUpRight,
  Flame,
  Target,
  Zap,
} from "lucide-react";
import type { PersonalTask, Board, Priority } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  high: { label: "Высокий", color: "text-rose-500", bg: "bg-rose-500/10", icon: AlertTriangle },
  medium: { label: "Средний", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
  low: { label: "Низкий", color: "text-sky-500", bg: "bg-sky-500/10", icon: Circle },
};

const STATUS_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "В работе" },
  { value: "completed", label: "Выполнено" },
] as const;

const PERIOD_OPTIONS = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "all", label: "Всё время" },
] as const;

function getPeriodDates(period: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  const start = new Date(now);

  switch (period) {
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(start.getMonth() - 3);
      break;
    default:
      return { start: "2020-01-01", end };
  }

  return { start: start.toISOString().split("T")[0], end };
}

interface StatCardProps {
  icon: typeof CheckCircle2;
  label: string;
  value: number | string;
  subtitle?: string;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ icon: Icon, label, value, subtitle, color, trend }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
              trend.isPositive ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"
            )}>
              <TrendingUp className={cn("h-3 w-3", !trend.isPositive && "rotate-180")} />
              {trend.value}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtitle && <p className="text-xs text-muted-foreground/60">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

interface BoardColumnProps {
  boardName: string;
  tasks: PersonalTask[];
  boardColor?: string;
}

function BoardColumn({ boardName, tasks, boardColor }: BoardColumnProps) {
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;
  const highPriority = tasks.filter((t) => t.priority === "high" && !t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      <div className="px-4 py-3 border-b border-border/30 bg-gradient-to-r from-muted/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: boardColor || "#6366f1" }}
            />
            <h4 className="text-sm font-semibold tracking-tight">{boardName}</h4>
          </div>
          <span className="text-xs text-muted-foreground">{tasks.length} задач</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{completed} выполнено</span>
          <span>{pending} в работе</span>
          {highPriority > 0 && (
            <span className="text-rose-500">{highPriority} срочных</span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-1.5 max-h-[300px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Нет задач
          </div>
        ) : (
          tasks.slice(0, 8).map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            return (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-2 rounded-lg px-3 py-2 text-xs transition-colors",
                  task.completed
                    ? "bg-muted/20 opacity-60"
                    : "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="mt-0.5">
                  {task.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium truncate", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground/60">{task.date}</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", priorityConfig.bg, priorityConfig.color)}>
                      {priorityConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {tasks.length > 8 && (
          <div className="text-center text-[11px] text-muted-foreground/60 pt-1">
            +{tasks.length - 8} ещё
          </div>
        )}
      </div>
    </div>
  );
}

interface PersonalDashboardFullProps {
  boards: Board[];
}

export function PersonalDashboardFull({ boards }: PersonalDashboardFullProps) {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [boardsExpanded, setBoardsExpanded] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          if (!cancelled) setLoading(false);
          return;
        }

        const allTasks: PersonalTask[] = [];
        const personalBoards = boards.filter((b) => b.type === "personal");

        for (const board of personalBoards) {
          try {
            const res = await fetch(`/api/personal-tasks?uid=${uid}&boardId=${board.id}`);
            if (res.ok) {
              const boardTasks: PersonalTask[] = await res.json();
              allTasks.push(...boardTasks);
            }
          } catch {
            // skip failed board
          }
        }

        // Also load tasks without boardId
        try {
          const res = await fetch(`/api/personal-tasks?uid=${uid}`);
          if (res.ok) {
            const allUserTasks: PersonalTask[] = await res.json();
            const existingIds = new Set(allTasks.map((t) => t.id));
            for (const t of allUserTasks) {
              if (!existingIds.has(t.id)) {
                allTasks.push(t);
              }
            }
          }
        } catch {
          // skip
        }

        if (!cancelled) setTasks(allTasks);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [boards]);

  const filteredTasks = useMemo(() => {
    const { start, end } = getPeriodDates(periodFilter);

    return tasks.filter((t) => {
      if (statusFilter === "completed" && !t.completed) return false;
      if (statusFilter === "pending" && t.completed) return false;
      if (boardFilter !== "all" && t.boardId !== boardFilter) return false;
      if (t.date < start || t.date > end) return false;
      return true;
    });
  }, [tasks, statusFilter, periodFilter, boardFilter]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = filteredTasks.filter((t) => t.priority === "high" && !t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const today = new Date().toISOString().split("T")[0];
    const todayTasks = filteredTasks.filter((t) => t.date === today);
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    return { total, completed, pending, highPriority, completionRate, todayTasks: todayTasks.length, todayCompleted };
  }, [filteredTasks]);

  const boardGroups = useMemo(() => {
    const groups: Record<string, PersonalTask[]> = {};

    for (const task of filteredTasks) {
      const boardId = task.boardId || "unassigned";
      if (!groups[boardId]) groups[boardId] = [];
      groups[boardId].push(task);
    }

    return Object.entries(groups).map(([boardId, boardTasks]) => {
      const board = boards.find((b) => b.id === boardId);
      return {
        boardId,
        boardName: board?.name || "Без доски",
        boardColor: board?.color || "#6366f1",
        tasks: boardTasks.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }),
      };
    });
  }, [filteredTasks, boards]);

  const priorityDistribution = useMemo(() => {
    const dist = { high: 0, medium: 0, low: 0 };
    filteredTasks.forEach((t) => {
      if (!t.completed) dist[t.priority]++;
    });
    return dist;
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Загружаем дашборд...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-violet-500/10">
            <LayoutDashboard className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Дашборд</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Обзор всех личных задач</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriodFilter(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                periodFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {boards.length > 0 && (
          <div className="relative">
            <select
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="appearance-none rounded-xl border border-border/60 bg-background/80 px-3 py-1.5 pr-8 text-xs font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Все доски</option>
              {boards.filter((b) => b.type === "personal").map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        )}

        {(statusFilter !== "all" || periodFilter !== "month" || boardFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("all");
              setPeriodFilter("month");
              setBoardFilter("all");
            }}
            className="gap-1.5 text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          icon={ListTodo}
          label="Всего задач"
          value={stats.total}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Выполнено"
          value={stats.completed}
          subtitle={`${stats.completionRate}% выполнение`}
          color="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          icon={Clock}
          label="В работе"
          value={stats.pending}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          icon={Flame}
          label="Высокий приоритет"
          value={stats.highPriority}
          subtitle={stats.highPriority > 0 ? "Требуют внимания" : "Всё под контролем"}
          color="bg-rose-500/10 text-rose-600"
        />
      </div>

      {/* Today's Progress */}
      <div className="mb-6 sm:mb-8 rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Прогресс сегодня</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold">{stats.todayCompleted}</span>
              <span className="text-sm text-muted-foreground">/ {stats.todayTasks}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: stats.todayTasks > 0 ? `${(stats.todayCompleted / stats.todayTasks) * 100}%` : "0%" }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {stats.todayTasks > 0 ? Math.round((stats.todayCompleted / stats.todayTasks) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">выполнено</p>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="mb-6 sm:mb-8 rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Распределение по приоритетам</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(["high", "medium", "low"] as Priority[]).map((priority) => {
            const config = PRIORITY_CONFIG[priority];
            const count = priorityDistribution[priority];
            const percentage = filteredTasks.length > 0
              ? Math.round((count / filteredTasks.filter((t) => !t.completed).length) * 100)
              : 0;

            return (
              <div key={priority} className="text-center">
                <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-xl mb-2", config.bg)}>
                  <config.icon className={cn("h-6 w-6", config.color)} />
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
                <div className="mt-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", config.color.replace("text-", "bg-"))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Board Sections */}
      <div className="mb-6">
        <button
          onClick={() => setBoardsExpanded(!boardsExpanded)}
          className="flex items-center gap-2 mb-4 group"
        >
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">По доскам</h3>
          <span className="text-xs text-muted-foreground">({boardGroups.length})</span>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            boardsExpanded && "rotate-180"
          )} />
        </button>

        {boardsExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardGroups.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-border/60 p-12 text-center">
                <LayoutDashboard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Нет задач для отображения</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Попробуйте изменить фильтры</p>
              </div>
            ) : (
              boardGroups.map((group) => (
                <BoardColumn
                  key={group.boardId}
                  boardName={group.boardName}
                  tasks={group.tasks}
                  boardColor={group.boardColor}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold">Последние задачи</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredTasks.length} всего
          </span>
        </div>

        <div className="space-y-2">
          {filteredTasks
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .map((task) => {
              const priorityConfig = PRIORITY_CONFIG[task.priority];
              const board = boards.find((b) => b.id === task.boardId);

              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
                    task.completed ? "bg-muted/20 opacity-60" : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div>
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60">{task.date}</span>
                      {board && (
                        <span className="text-[10px] text-muted-foreground/60">• {board.name}</span>
                      )}
                    </div>
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", priorityConfig.bg, priorityConfig.color)}>
                    {priorityConfig.label}
                  </span>
                </div>
              );
            })}

          {filteredTasks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Нет задач для отображения
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
