"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
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
  ExternalLink,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  PersonalTask,
  PersonalKanbanTask,
  PersonalPlanEntry,
  Board,
  Priority,
} from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBoardIcon } from "@/lib/board-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PersonalTaskDialog } from "@/components/personal-task-dialog";
import { WeatherSidebarWidget } from "@/components/weather-sidebar-widget";
import { toast } from "sonner";
import { useMode } from "@/lib/mode-context";

const BOARD_COLORS_HEX: Record<string, string> = {
  blue: "#3b82f6",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  orange: "#f97316",
};

const BOARD_COLORS_TAILWIND: Record<
  string,
  { bg: string; text: string; ring: string }
> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    ring: "ring-blue-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    ring: "ring-emerald-500/30",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    ring: "ring-violet-500/30",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    ring: "ring-amber-500/30",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    ring: "ring-rose-500/30",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-600",
    ring: "ring-cyan-500/30",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-600",
    ring: "ring-pink-500/30",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600",
    ring: "ring-indigo-500/30",
  },
  teal: {
    bg: "bg-teal-500/10",
    text: "text-teal-600",
    ring: "ring-teal-500/30",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    ring: "ring-orange-500/30",
  },
};

function getBoardHexColor(color?: string): string {
  if (color && BOARD_COLORS_HEX[color]) return BOARD_COLORS_HEX[color];
  return "#6366f1";
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; icon: typeof AlertTriangle }
> = {
  high: {
    label: "Высокий",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    icon: AlertTriangle,
  },
  medium: {
    label: "Средний",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    icon: Clock,
  },
  low: {
    label: "Низкий",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    icon: Circle,
  },
};

const STATUS_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "В работе" },
  { value: "completed", label: "Выполнено" },
] as const;

const PRIORITY_FILTER_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "high", label: "Высокий" },
  { value: "medium", label: "Средний" },
  { value: "low", label: "Низкий" },
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
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-5 transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              color,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/60">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface BoardColumnProps {
  board: Board;
  tasks: PersonalTask[];
  taskSourceMap: Map<string, "list" | "kanban" | "plan">;
  onToggleComplete: (task: PersonalTask) => void;
  onEditTask: (task: PersonalTask) => void;
  onChangeBoard: (task: PersonalTask, newBoardId: string) => void;
  onDeleteTask: (task: PersonalTask) => void;
  onNavigateTask: (task: PersonalTask) => void;
  allPersonalBoards: Board[];
}

function BoardColumn({
  board,
  tasks,
  taskSourceMap,
  onToggleComplete,
  onEditTask,
  onChangeBoard,
  onDeleteTask,
  onNavigateTask,
  allPersonalBoards,
}: BoardColumnProps) {
  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;
  const highPriority = tasks.filter(
    (t) => t.priority === "high" && !t.completed,
  ).length;
  const progress =
    tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
  const boardColor = getBoardHexColor(board.color);
  const BoardIcon = getBoardIcon(board.icon);
  const colorStyle =
    BOARD_COLORS_TAILWIND[board.color || "indigo"] ||
    BOARD_COLORS_TAILWIND.indigo;

  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-background to-muted/10 overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      <div className="px-4 py-3 border-b border-border/30 bg-gradient-to-r from-muted/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                colorStyle.bg,
              )}
            >
              {BoardIcon ? (
                <BoardIcon className={cn("h-3.5 w-3.5", colorStyle.text)} />
              ) : (
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: boardColor }}
                />
              )}
            </div>
            <h4 className="text-sm font-semibold tracking-tight">
              {board.name}
            </h4>
          </div>
          <span className="text-xs text-muted-foreground">
            {tasks.length} задач
          </span>
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

      <div className="p-3 space-y-1.5 max-h-[400px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Нет задач
          </div>
        ) : (
          tasks.slice(0, 10).map((task) => {
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            return (
              <DashboardTaskRow
                key={task.id}
                task={task}
                source={taskSourceMap.get(task.id) || "list"}
                priorityConfig={priorityConfig}
                onToggleComplete={onToggleComplete}
                onEdit={onEditTask}
                onChangeBoard={onChangeBoard}
                onDelete={onDeleteTask}
                onNavigate={onNavigateTask}
                allPersonalBoards={allPersonalBoards}
              />
            );
          })
        )}
        {tasks.length > 10 && (
          <div className="text-center text-[11px] text-muted-foreground/60 pt-1">
            +{tasks.length - 10} ещё
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardTaskRowProps {
  task: PersonalTask;
  source: "list" | "kanban" | "plan";
  priorityConfig: {
    label: string;
    color: string;
    bg: string;
    icon: typeof AlertTriangle;
  };
  onToggleComplete: (task: PersonalTask) => void;
  onEdit: (task: PersonalTask) => void;
  onChangeBoard: (task: PersonalTask, newBoardId: string) => void;
  onDelete: (task: PersonalTask) => void;
  onNavigate: (task: PersonalTask) => void;
  allPersonalBoards: Board[];
}

function DashboardTaskRow({
  task,
  source,
  priorityConfig,
  onToggleComplete,
  onEdit,
  onChangeBoard,
  onDelete,
  onNavigate,
  allPersonalBoards,
}: DashboardTaskRowProps) {
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors group/task",
        task.completed
          ? "bg-muted/20 opacity-60"
          : "bg-muted/30 hover:bg-muted/50",
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task);
        }}
        className="mt-0.5 shrink-0"
        title={task.completed ? "Отменить выполнение" : "Отметить выполненной"}
      >
        {task.completed ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 hover:text-emerald-600 transition-colors" />
        ) : (
          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-emerald-500 transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onEdit(task)}
          className={cn(
            "font-medium truncate block text-left w-full hover:text-primary transition-colors",
            task.completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </button>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground/60">
            {task.date}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
              priorityConfig.bg,
              priorityConfig.color,
            )}
          >
            {priorityConfig.label}
          </span>
          {source === "kanban" && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600">
              Канбан
            </span>
          )}
          {source === "plan" && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
              План
            </span>
          )}
          {source === "list" && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
              Таблица/Список
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(task);
          }}
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors"
          title="Перейти к задаче"
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-rose-500/10 transition-colors"
          title="Удалить задачу"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500 transition-colors" />
        </button>
        <Popover open={boardMenuOpen} onOpenChange={setBoardMenuOpen}>
          <PopoverTrigger
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors"
            title="Сменить доску"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={4}
            className="w-56 p-1"
          >
            <div className="text-[10px] text-muted-foreground/60 px-2 py-1.5 font-medium uppercase tracking-wider">
              Доска
            </div>
            {allPersonalBoards.map((b) => {
              const hex = getBoardHexColor(b.color);
              const BoardIconItem = getBoardIcon(b.icon);
              const bColor =
                BOARD_COLORS_TAILWIND[b.color || "indigo"] ||
                BOARD_COLORS_TAILWIND.indigo;
              return (
                <button
                  key={b.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeBoard(task, b.id);
                    setBoardMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                    task.boardId === b.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50 text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded",
                      bColor.bg,
                    )}
                  >
                    {BoardIconItem ? (
                      <BoardIconItem className={cn("h-3 w-3", bColor.text)} />
                    ) : (
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                    )}
                  </div>
                  <span className="truncate">{b.name}</span>
                  {task.boardId === b.id && (
                    <CheckCircle2 className="h-3 w-3 ml-auto text-primary" />
                  )}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/60 transition-colors"
          title="Редактировать"
        >
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

interface PersonalDashboardFullProps {
  boards: Board[];
}

export function PersonalDashboardFull({ boards }: PersonalDashboardFullProps) {
  const { setDashboardOpen, setMode } = useMode();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [taskSourceMap, setTaskSourceMap] = useState<
    Map<string, "list" | "kanban" | "plan">
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [boardSelectorOpen, setBoardSelectorOpen] = useState(false);
  const [editTask, setEditTask] = useState<PersonalTask | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const personalBoards = useMemo(
    () => boards.filter((b) => b.type === "personal"),
    [boards],
  );

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
        const sourceMap = new Map<string, "list" | "kanban" | "plan">();

        for (const board of personalBoards) {
          try {
            const res = await fetch(
              `/api/personal-tasks?uid=${uid}&boardId=${board.id}`,
            );
            if (res.ok) {
              const boardTasks: PersonalTask[] = await res.json();
              for (const bt of boardTasks) {
                sourceMap.set(bt.id, "list");
              }
              allTasks.push(...boardTasks);
            }
          } catch {
            // skip failed board
          }

          try {
            const kanbanRes = await fetch(
              `/api/personal-kanban-tasks?boardId=${board.id}`,
            );
            if (kanbanRes.ok) {
              const kanbanTasks: PersonalKanbanTask[] = await kanbanRes.json();
              for (const kt of kanbanTasks) {
                sourceMap.set(kt.id, "kanban");
                allTasks.push({
                  id: kt.id,
                  date: kt.createdAt
                    ? kt.createdAt.split("T")[0]
                    : new Date().toISOString().split("T")[0],
                  startTime: kt.startTime,
                  endTime: kt.endTime,
                  title: kt.title,
                  priority: kt.priority,
                  completed: kt.completed,
                  completedAt: kt.completedAt,
                  comment: kt.comment,
                  createdAt: kt.createdAt,
                  updatedAt: kt.updatedAt,
                  ownerId: kt.ownerId,
                  boardId: kt.boardId,
                });
              }
            }
          } catch {
            // skip failed board kanban
          }
        }

        try {
          const planRes = await fetch(`/api/personal-plan-entries?uid=${uid}`);
          if (planRes.ok) {
            const planEntries: PersonalPlanEntry[] = await planRes.json();
            const existingIds = new Set(allTasks.map((t) => t.id));
            for (const pe of planEntries) {
              if (!existingIds.has(pe.id)) {
                sourceMap.set(pe.id, "plan");
                allTasks.push({
                  id: pe.id,
                  date: pe.date,
                  startTime: pe.startTime,
                  endTime: pe.endTime,
                  title: pe.title,
                  priority: pe.priority,
                  completed: pe.completed,
                  completedAt: pe.completedAt,
                  comment: pe.comment,
                  createdAt: pe.createdAt,
                  updatedAt: pe.updatedAt,
                  ownerId: pe.ownerId,
                  boardId: pe.boardId,
                });
              }
            }
          }
        } catch {
          // skip plan entries
        }

        try {
          const res = await fetch(`/api/personal-tasks?uid=${uid}`);
          if (res.ok) {
            const allUserTasks: PersonalTask[] = await res.json();
            const existingIds = new Set(allTasks.map((t) => t.id));
            for (const t of allUserTasks) {
              if (!existingIds.has(t.id)) {
                sourceMap.set(t.id, "list");
                allTasks.push(t);
              }
            }
          }
        } catch {
          // skip
        }

        if (!cancelled) {
          setTasks(allTasks);
          setTaskSourceMap(sourceMap);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [personalBoards]);

  const filteredTasks = useMemo(() => {
    const { start, end } = getPeriodDates(periodFilter);

    return tasks.filter((t) => {
      if (statusFilter === "completed" && !t.completed) return false;
      if (statusFilter === "pending" && t.completed) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter)
        return false;
      if (boardFilter !== "all" && t.boardId !== boardFilter) return false;
      if (sourceFilter !== "all" && taskSourceMap.get(t.id) !== sourceFilter)
        return false;
      if (t.date < start || t.date > end) return false;
      return true;
    });
  }, [
    tasks,
    statusFilter,
    priorityFilter,
    periodFilter,
    boardFilter,
    sourceFilter,
    taskSourceMap,
  ]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = filteredTasks.filter(
      (t) => t.priority === "high" && !t.completed,
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const today = new Date().toISOString().split("T")[0];
    const todayTasks = filteredTasks.filter((t) => t.date === today);
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    return {
      total,
      completed,
      pending,
      highPriority,
      completionRate,
      todayTasks: todayTasks.length,
      todayCompleted,
    };
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
        board: board || {
          id: boardId,
          name: "Без доски",
          color: "indigo",
          type: "personal" as const,
          createdAt: "",
          updatedAt: "",
        },
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

  const handleToggleComplete = useCallback(
    async (task: PersonalTask) => {
      const newCompleted = !task.completed;
      const source = taskSourceMap.get(task.id);
      const apiPath =
        source === "kanban"
          ? "/api/personal-kanban-tasks"
          : source === "plan"
            ? "/api/personal-plan-entries"
            : "/api/personal-tasks";
      try {
        const res = await fetch(apiPath, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            completed: newCompleted,
            completedAt: newCompleted ? new Date().toISOString() : null,
          }),
        });
        if (res.ok) {
          const updated: PersonalTask = await res.json();
          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
          toast.success(
            newCompleted ? "Задача выполнена" : "Задача возвращена в работу",
          );
        } else {
          toast.error("Не удалось обновить задачу");
        }
      } catch {
        toast.error("Ошибка сети");
      }
    },
    [taskSourceMap],
  );

  const handleChangeBoard = useCallback(
    async (task: PersonalTask, newBoardId: string) => {
      const source = taskSourceMap.get(task.id);
      const apiPath =
        source === "kanban"
          ? "/api/personal-kanban-tasks"
          : source === "plan"
            ? "/api/personal-plan-entries"
            : "/api/personal-tasks";
      try {
        const res = await fetch(apiPath, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, boardId: newBoardId }),
        });
        if (res.ok) {
          const updated: PersonalTask = await res.json();
          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
          toast.success("Доска задачи обновлена");
        } else {
          toast.error("Не удалось сменить доску");
        }
      } catch {
        toast.error("Ошибка сети");
      }
    },
    [taskSourceMap],
  );

  const handleEditTask = useCallback((task: PersonalTask) => {
    setEditTask(task);
    setEditDialogOpen(true);
  }, []);

  const handleTaskSaved = useCallback((saved: PersonalTask) => {
    setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    setEditTask(null);
  }, []);

  const handleDeleteTask = useCallback(
    async (task: PersonalTask) => {
      const source = taskSourceMap.get(task.id);
      const apiPath =
        source === "kanban"
          ? "/api/personal-kanban-tasks"
          : source === "plan"
            ? "/api/personal-plan-entries"
            : "/api/personal-tasks";
      try {
        const res = await fetch(apiPath, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id }),
        });
        if (res.ok) {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          toast.success("Задача удалена");
        } else {
          toast.error("Не удалось удалить задачу");
        }
      } catch {
        toast.error("Ошибка сети");
      }
    },
    [taskSourceMap],
  );

  const handleNavigateToTask = useCallback(
    (task: PersonalTask) => {
      if (task.boardId) {
        setDashboardOpen(false);
        setMode("personal");
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("boardId", task.boardId!);
          url.searchParams.set("highlightTaskId", task.id);
          window.location.href = url.toString();
        }, 50);
      }
    },
    [setDashboardOpen, setMode],
  );

  const selectedBoard =
    boardFilter === "all"
      ? null
      : personalBoards.find((b) => b.id === boardFilter);
  const SelectedBoardIcon = selectedBoard
    ? getBoardIcon(selectedBoard.icon)
    : null;
  const selectedBoardColor = selectedBoard
    ? getBoardHexColor(selectedBoard.color)
    : null;

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Загружаем дашборд...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-violet-500/10">
            <LayoutDashboard className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Дашборд
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Обзор всех личных задач
            </p>
          </div>
        </div>
      </div>

      {/* Main layout: content + sidebar */}
      <div className="lg:flex lg:gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              subtitle={
                stats.highPriority > 0
                  ? "Требуют внимания"
                  : "Всё под контролем"
              }
              color="bg-rose-500/10 text-rose-600"
            />
          </div>

          {/* Today + Priority side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today's Progress */}
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">Прогресс сегодня</h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold">
                      {stats.todayCompleted}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {stats.todayTasks}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                      style={{
                        width:
                          stats.todayTasks > 0
                            ? `${(stats.todayCompleted / stats.todayTasks) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {stats.todayTasks > 0
                      ? Math.round(
                          (stats.todayCompleted / stats.todayTasks) * 100,
                        )
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">выполнено</p>
                </div>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">По приоритетам</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(["high", "medium", "low"] as Priority[]).map((priority) => {
                  const config = PRIORITY_CONFIG[priority];
                  const count = priorityDistribution[priority];
                  const activeTotal = filteredTasks.filter(
                    (t) => !t.completed,
                  ).length;
                  const percentage =
                    activeTotal > 0
                      ? Math.round((count / activeTotal) * 100)
                      : 0;

                  return (
                    <div key={priority} className="text-center">
                      <div
                        className={cn(
                          "inline-flex h-10 w-10 items-center justify-center rounded-xl mb-2",
                          config.bg,
                        )}
                      >
                        <config.icon className={cn("h-5 w-5", config.color)} />
                      </div>
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.label}
                      </p>
                      <div className="mt-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            config.color.replace("text-", "bg-"),
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Board Sections */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold">По доскам</h3>
              <span className="text-xs text-muted-foreground">
                ({boardGroups.length})
              </span>
            </div>

            {boardGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
                <LayoutDashboard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Нет задач для отображения
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Попробуйте изменить фильтры
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {boardGroups.map((group) => (
                  <BoardColumn
                    key={group.boardId}
                    board={group.board}
                    tasks={group.tasks}
                    taskSourceMap={taskSourceMap}
                    onToggleComplete={handleToggleComplete}
                    onEditTask={handleEditTask}
                    onChangeBoard={handleChangeBoard}
                    onDeleteTask={handleDeleteTask}
                    onNavigateTask={handleNavigateToTask}
                    allPersonalBoards={personalBoards}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Filters + Recent Tasks */}
        <div className="lg:w-[340px] shrink-0 space-y-4 mt-6 lg:mt-0">
          {/* Filters Card */}
          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Фильтры</h3>
              </div>
              {(statusFilter !== "all" ||
                priorityFilter !== "all" ||
                periodFilter !== "month" ||
                boardFilter !== "all" ||
                sourceFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setPeriodFilter("month");
                    setBoardFilter("all");
                    setSourceFilter("all");
                  }}
                  className="gap-1.5 text-xs h-7 px-2"
                >
                  <X className="h-3 w-3" />
                  Сбросить
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {/* Period Selector */}
              <div>
                <label className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5 block">
                  Период
                </label>
                <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPeriodFilter(opt.value)}
                      className={cn(
                        "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                        periodFilter === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5 block">
                  Статус
                </label>
                <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setStatusFilter(opt.value)}
                      className={cn(
                        "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                        statusFilter === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5 block">
                  Приоритет
                </label>
                <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1">
                  {PRIORITY_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPriorityFilter(opt.value)}
                      className={cn(
                        "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                        priorityFilter === opt.value
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Selector */}
              {personalBoards.length > 0 && (
                <div>
                  <label className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5 block">
                    Доска
                  </label>
                  <Popover
                    open={boardSelectorOpen}
                    onOpenChange={setBoardSelectorOpen}
                  >
                    <PopoverTrigger
                      className={cn(
                        "flex items-center gap-2 w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-xs font-medium transition-all hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        boardFilter !== "all"
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {selectedBoard && SelectedBoardIcon ? (
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded"
                          style={{ backgroundColor: `${selectedBoardColor}15` }}
                        >
                          <SelectedBoardIcon
                            className="h-3 w-3"
                            style={{ color: selectedBoardColor || undefined }}
                          />
                        </div>
                      ) : selectedBoard ? (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: selectedBoardColor || "#6366f1",
                          }}
                        />
                      ) : (
                        <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                      <span className="flex-1 text-left truncate">
                        {selectedBoard ? selectedBoard.name : "Все доски"}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform",
                          boardSelectorOpen && "rotate-180",
                        )}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      sideOffset={4}
                      className="w-[240px] p-1"
                    >
                      <button
                        onClick={() => {
                          setBoardFilter("all");
                          setBoardSelectorOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                          boardFilter === "all"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted/50 text-foreground",
                        )}
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground/50" />
                        <span className="flex-1 text-left">Все доски</span>
                        {boardFilter === "all" && (
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        )}
                      </button>
                      <div className="h-px bg-border/40 my-1" />
                      {personalBoards.map((b) => {
                        const hex = getBoardHexColor(b.color);
                        const BIcon = getBoardIcon(b.icon);
                        const bColor =
                          BOARD_COLORS_TAILWIND[b.color || "indigo"] ||
                          BOARD_COLORS_TAILWIND.indigo;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setBoardFilter(b.id);
                              setBoardSelectorOpen(false);
                            }}
                            className={cn(
                              "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs transition-colors",
                              boardFilter === b.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-muted/50 text-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded",
                                bColor.bg,
                              )}
                            >
                              {BIcon ? (
                                <BIcon className={cn("h-3 w-3", bColor.text)} />
                              ) : (
                                <div
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: hex }}
                                />
                              )}
                            </div>
                            <span className="flex-1 text-left truncate">
                              {b.name}
                            </span>
                            {boardFilter === b.id && (
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Source/Format Filter */}
            <div>
              <label className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1.5 block">
                Формат
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/80 p-1">
                {[
                  { value: "all", label: "Все" },
                  { value: "list", label: "Список" },
                  { value: "kanban", label: "Канбан" },
                  { value: "plan", label: "План" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSourceFilter(opt.value)}
                    className={cn(
                      "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                      sourceFilter === opt.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Последние задачи</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {filteredTasks.length} всего
              </span>
            </div>

            <div className="space-y-1.5">
              {filteredTasks
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )
                .slice(0, 8)
                .map((task) => {
                  const priorityConfig = PRIORITY_CONFIG[task.priority];
                  const board = boards.find((b) => b.id === task.boardId);

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors group/task",
                        task.completed
                          ? "bg-muted/20 opacity-60"
                          : "bg-muted/30 hover:bg-muted/50",
                      )}
                    >
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="shrink-0"
                        title={
                          task.completed
                            ? "Отменить выполнение"
                            : "Отметить выполненной"
                        }
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => handleEditTask(task)}
                          className={cn(
                            "text-xs font-medium truncate block text-left w-full hover:text-primary transition-colors",
                            task.completed &&
                              "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground/60">
                            {task.date}
                          </span>
                          {board && (
                            <span className="text-[10px] text-muted-foreground/60">
                              • {board.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                          priorityConfig.bg,
                          priorityConfig.color,
                        )}
                      >
                        {priorityConfig.label}
                      </span>
                      <button
                        onClick={() => handleNavigateToTask(task)}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/60 transition-colors opacity-0 group-hover/task:opacity-100 shrink-0"
                        title="Перейти к задаче"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  );
                })}

              {filteredTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Нет задач для отображения
                </div>
              )}
            </div>
          </div>

          {/* Weather Widget */}
          <WeatherSidebarWidget />
        </div>
      </div>

      {/* Edit Task Dialog */}
      <PersonalTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={editTask}
        onSaved={handleTaskSaved}
      />
    </div>
  );
}
