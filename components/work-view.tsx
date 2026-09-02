"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Inbox,
  CalendarClock,
  Zap,
  CheckCircle2,
  Circle,
  MessageCircle,
  GripVertical,
  Table2,
  Columns3,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  type CollisionDetection,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import type { ContentTask, Board } from "@/lib/models";
import { mockContentTasks } from "@/lib/mock-data";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ContentTaskDialog } from "@/components/content-task-dialog";
import { ContentPlannerChat } from "@/components/content-planner-chat";
import { WorkKanban } from "@/components/work-kanban";
import {
  ContentWeeklyTable,
  buildDaySlots,
  TaskCardOverlay,
} from "@/components/content-weekly-table";
import { STATUS_STYLES } from "@/lib/content";
import { taskColorBg } from "@/lib/task-colors";

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function rectsOverlap(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
): boolean {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length) return pointer;
  return rectIntersection(args);
};

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekDates(weekOffset: number): Date[] {
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function BacklogCard({
  task,
  onEdit,
  onToggleComplete,
}: {
  task: ContentTask;
  onEdit: (task: ContentTask) => void;
  onToggleComplete: (task: ContentTask) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `backlog-${task.id}`,
      data: { type: "backlogTask", task },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(task)}
      className={cn(
        "group cursor-grab active:cursor-grabbing rounded-md border bg-card p-2.5 space-y-1.5 transition-colors hover:border-primary/40 hover:bg-accent/40",
        task.color && taskColorBg(task.color),
        isDragging && "opacity-0",
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <GripVertical className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          <div className="flex items-center gap-1">
            {task.time ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <CalendarClock className="h-3 w-3" />
                {task.time}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/50">
                Бэклог
              </span>
            )}
            {task.funnel && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400"
                title="Контент для перелива аудитории"
              >
                <Zap className="h-3 w-3" />
                Перелив
              </span>
            )}
          </div>
        </div>
      </div>

      <p
        className={cn(
          "text-[13px] font-medium leading-snug",
          task.completed && "line-through",
        )}
      >
        {task.title}
      </p>

      <p className="truncate text-[11px] text-muted-foreground">
        {task.platform}
        {task.topic ? ` · ${task.topic}` : ""}
      </p>

      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-medium whitespace-nowrap",
            STATUS_STYLES[task.status] ?? "bg-muted/60 text-muted-foreground",
          )}
        >
          {task.status}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className="shrink-0 text-muted-foreground/50 hover:text-primary transition-colors"
          title={task.completed ? "Вернуть" : "Отметить опубликованным"}
        >
          {task.completed ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function BacklogCardOverlay({ task }: { task: ContentTask }) {
  return (
    <div
      className={cn(
        "w-72 rounded-md border bg-card p-2.5 space-y-1.5 rotate-3 shadow-xl border-primary/30",
        task.color && taskColorBg(task.color),
      )}
    >
      <p className="text-[13px] font-medium leading-snug truncate">
        {task.title}
      </p>
      <p className="truncate text-[11px] text-muted-foreground">
        {task.platform}
        {task.topic ? ` · ${task.topic}` : ""}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{task.time ?? "Бэклог"}</span>
        <span className="rounded-full bg-muted/60 px-1.5 py-0.5">
          {task.status}
        </span>
      </div>
    </div>
  );
}

function DayChip({
  dateKey,
  dayName,
  dayNumber,
  monthLabel,
  isTodayD,
  isWeekend,
}: {
  dateKey: string;
  dayName: string;
  dayNumber: string;
  monthLabel: string;
  isTodayD: boolean;
  isWeekend: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateKey}`,
    data: { type: "day", date: dateKey },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs min-w-[64px] shrink-0 snap-start lg:flex-1 lg:shrink lg:min-w-0 transition-colors",
        isWeekend && "text-muted-foreground/70",
        isTodayD && "ring-1 ring-primary/30",
        isOver && "bg-primary/10 ring-1 ring-primary/40",
      )}
    >
      <span className="text-[10px] uppercase tracking-wider font-medium">
        {dayName}
      </span>
      <span
        className={cn("text-sm font-semibold", isTodayD && "text-primary")}
      >
        {dayNumber}
      </span>
      <span className="text-[10px] text-muted-foreground/60">{monthLabel}</span>
    </div>
  );
}

export function WorkView({ activeBoard, mode = "content" }: { activeBoard?: Board; mode?: "content" | "dev" }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [dragOverlay, setDragOverlay] = useState<{
    type: string;
    task: ContentTask;
  } | null>(null);
  const [positionMap, setPositionMap] = useState<Record<string, number>>({});
  const [backlogHover, setBacklogHover] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const asideRef = useRef<HTMLElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const weekDates = getWeekDates(weekOffset);
  const weekDateStrings = weekDates.map(getDateKey);

  const tasksByDate = useMemo(() => {
    const map: Record<string, ContentTask[]> = {};
    for (const t of tasks) {
      const key = t.date ?? "";
      if (key) {
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    }
    return map;
  }, [tasks]);

  const daySlots = useMemo(() => {
    const result: Record<string, (ContentTask | null)[]> = {};
    for (const dk of weekDateStrings) {
      result[dk] = buildDaySlots(tasksByDate[dk] || [], positionMap);
    }
    return result;
  }, [tasksByDate, positionMap, weekDateStrings]);

  const currentMonthLabel = (() => {
    const months = new Set(weekDates.map((d) => d.getMonth()));
    const years = new Set(weekDates.map((d) => d.getFullYear()));
    const yearStr = years.size === 1 ? ` ${[...years][0]}` : "";
    if (months.size === 1) {
      return `${MONTH_NAMES[[...months][0]]}${yearStr}`;
    }
    const [a, b] = [...months].sort();
    return `${MONTH_NAMES[a]} / ${MONTH_NAMES[b]}${yearStr}`;
  })();

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const params = new URLSearchParams();
      if (uid) params.set("uid", uid);
      if (activeBoard?.id) params.set("boardId", activeBoard.id);
      const url = `/api/content-tasks?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: ContentTask[] = await res.json();
        setTasks(data);
      } else {
        setTasks(mockContentTasks);
      }
    } catch {
      setTasks(mockContentTasks);
    } finally {
      setLoading(false);
    }
  }, [activeBoard?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskSaved = useCallback((task: ContentTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = task;
        return updated;
      }
      return [...prev, task];
    });
  }, []);

  const handleToggleComplete = useCallback(async (task: ContentTask) => {
    const newCompleted = !task.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;
    const toggled = { ...task, completed: newCompleted, completedAt };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? toggled : t)));

    try {
      const res = await fetch("/api/content-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          completed: newCompleted,
          completedAt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка обновления");
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        return;
      }

      const updated: ContentTask = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      toast.success(updated.completed ? "Опубликовано" : "Возвращено в работу");
    } catch {
      toast.error("Ошибка обновления");
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  }, []);

  const handleDeleteTask = useCallback(async (task: ContentTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      const res = await fetch("/api/content-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка удаления");
        return;
      }
      toast.success("Контент удалён");
    } catch {
      toast.error("Ошибка удаления");
    }
  }, []);

  const handleAddTask = useCallback((date: string | null) => {
    setEditingTask(null);
    setDialogDate(date);
    setDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((task: ContentTask) => {
    setEditingTask(task);
    setDialogDate(task.date);
    setDialogOpen(true);
  }, []);

  const handleOpenPlanner = useCallback(() => setPlannerOpen(true), []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as {
      type?: string;
      task?: ContentTask;
    } | null;
    if (data?.task) {
      setDragOverlay({ type: data.type ?? "", task: data.task });
    }
  }, []);

  const patchContent = useCallback(
    async (payload: {
      id: string;
      date?: string | null;
      time?: string | null;
    }) => {
      try {
        const res = await fetch("/api/content-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка обновления");
          return false;
        }
        return true;
      } catch {
        toast.error("Ошибка обновления");
        return false;
      }
    },
    [],
  );

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!asideRef.current) return;
    const rect = asideRef.current.getBoundingClientRect();
    const translated = event.active.rect.current.translated;
    if (!translated) return;
    setBacklogHover(
      rectsOverlap(translated, {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      }),
    );
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setDragOverlay(null);
      setBacklogHover(false);

      const active = event.active.data.current as {
        type?: string;
        task?: ContentTask;
      } | null;
      const over = event.over?.data.current as {
        type?: string;
        date?: string;
        rowIndex?: number;
      } | null;

      if (!active?.task) return;
      const task = active.task;

      // Manual hit-test against the backlog sidebar, independent of droppable
      // collision detection, so dropping a card into the backlog always works.
      const asideRect = asideRef.current?.getBoundingClientRect();
      const translated = event.active.rect.current.translated;
      const asideHit =
        !!asideRect &&
        !!translated &&
        rectsOverlap(translated, {
          left: asideRect.left,
          top: asideRect.top,
          right: asideRect.right,
          bottom: asideRect.bottom,
        });

      const overType =
        over?.type === "backlog" || asideHit ? "backlog" : over?.type;
      if (!overType) return;

      const findRow = (dateKey: string, taskId: string): number => {
        const slots = daySlots[dateKey];
        if (!slots) return -1;
        for (let i = 0; i < slots.length; i++) {
          if (slots[i]?.id === taskId) return i;
        }
        return -1;
      };

      // --- Table cell (slot) drop — precise placement ---
      if (
        overType === "slot" &&
        over &&
        over.date &&
        typeof over.rowIndex === "number"
      ) {
        const newDate = over.date;
        const newRow = over.rowIndex;
        const targetTask = daySlots[newDate]?.[newRow] ?? null;

        if (active.type === "backlogTask") {
          // Backlog → schedule: place exactly into the dropped cell.
          if (targetTask && targetTask.id === task.id) return;

          if (targetTask) {
            // Occupant returns to backlog (date & time cleared).
            const occupant = { ...targetTask, date: null, time: null };
            handleTaskSaved(occupant);
            setPositionMap((prev) => {
              const next = { ...prev };
              delete next[targetTask.id];
              next[task.id] = newRow;
              return next;
            });
            void patchContent({
              id: targetTask.id,
              date: null,
              time: null,
            });
          } else {
            setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
          }

          handleTaskSaved({ ...task, date: newDate });
          const ok = await patchContent({ id: task.id, date: newDate });
          if (ok) toast.success("Контент перенесён в расписание");
          return;
        }

        // contentTask → slot
        const oldRow = findRow(task.date ?? "", task.id);

        if (newDate === task.date) {
          if (oldRow === newRow) return;
          if (targetTask) {
            setPositionMap((prev) => ({
              ...prev,
              [task.id]: newRow,
              [targetTask.id]: oldRow,
            }));
          } else {
            setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
          }
          return;
        }

        if (targetTask && oldRow !== -1) {
          setPositionMap((prev) => ({
            ...prev,
            [task.id]: newRow,
            [targetTask.id]: oldRow,
          }));
        } else {
          setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
        }

        handleTaskSaved({ ...task, date: newDate });
        await patchContent({ id: task.id, date: newDate });
        return;
      }

      // --- Day chip drop ---
      if (overType === "day" && over && over.date) {
        const newDate = over.date;
        if (newDate === task.date) return;

        if (active.type === "contentTask") {
          setPositionMap((prev) => {
            const next = { ...prev };
            delete next[task.id];
            return next;
          });
          handleTaskSaved({ ...task, date: newDate });
          await patchContent({ id: task.id, date: newDate });
        } else {
          handleTaskSaved({ ...task, date: newDate });
          const ok = await patchContent({ id: task.id, date: newDate });
          if (ok) toast.success("Контент перенесён в расписание");
        }
        return;
      }

      // --- Backlog drop — clear date & time ---
      if (overType === "backlog") {
        if (active.type !== "contentTask") return;
        if (!task.date && !task.time) return;

        setPositionMap((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        handleTaskSaved({ ...task, date: null, time: null });
        const ok = await patchContent({ id: task.id, date: null, time: null });
        if (ok) toast.success("Возвращено в бэклог");
        return;
      }
    },
    [daySlots, handleTaskSaved, patchContent],
  );

  const backlogTasks = tasks
    .filter((t) => !t.date)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const boardTitle =
    activeBoard?.name?.toLowerCase() === "личные задачи"
      ? "Твой личный контент-планнер"
      : activeBoard?.name || "Работа";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="flex w-full flex-col lg:flex-row">
        {/* Backlog sidebar — aligned to title, left */}
        <aside
          ref={(node) => {
            asideRef.current = node;
          }}
          className={cn(
            "w-full shrink-0 rounded-xl border bg-card lg:sticky lg:top-[calc(3.5rem+1.5rem)] lg:h-[calc(100dvh-5rem-6dvh)] lg:w-80 lg:self-start lg:mt-6 lg:mx-5 transition-colors",
            backlogHover && "border-primary/60 ring-1 ring-primary/30",
          )}
        >
          <div className="flex h-auto flex-col lg:h-full">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Inbox className="h-4 w-4 text-muted-foreground" />
                Бэклог
              </div>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {backlogTasks.length}
              </span>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-3 space-y-2 lg:max-h-none lg:flex-1">
              {backlogTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground px-4">
                    Бэклог пуст. Идеи без даты появятся здесь
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTask(null)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Добавить идею
                  </Button>
                </div>
              ) : (
                backlogTasks.map((task) => (
                  <BacklogCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onToggleComplete={handleToggleComplete}
                  />
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1 px-3 sm:px-5 py-4 sm:py-6">
          {/* Actions */}
          <div className="mb-5 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">Таблица</span>
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Columns3 className="h-4 w-4" />
                <span className="hidden sm:inline">Канбан</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={handleOpenPlanner}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                AI
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-1.5"
                onClick={() => handleAddTask(getDateKey(new Date()))}
              >
                <Plus className="h-4 w-4" />
                {mode === "dev" ? "Задача" : "Контент"}
              </Button>
            </div>
          </div>

          {/* Day header - only for table mode */}
          {viewMode === "table" && (
            <>
              {/* Week schedule */}
              <div className="mb-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold tracking-tight">
                  {currentMonthLabel}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeekOffset((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4 flex gap-1 overflow-x-auto lg:overflow-visible -mx-3 px-3 sm:mx-0 sm:px-0 snap-x snap-mandatory scrollbar-none">
                {weekDates.map((date, idx) => (
                  <DayChip
                    key={weekDateStrings[idx]}
                    dateKey={weekDateStrings[idx]}
                    dayName={DAY_NAMES[idx]}
                    dayNumber={String(date.getDate())}
                    monthLabel={MONTH_NAMES[date.getMonth()]
                      .toLowerCase()
                      .slice(0, 4)}
                    isTodayD={isToday(date)}
                    isWeekend={idx >= 5}
                  />
                ))}
              </div>

              <ContentWeeklyTable
                weekDates={weekDates}
                daySlots={daySlots}
                onPositionChange={(id, row) =>
                  setPositionMap((prev) => ({ ...prev, [id]: row }))
                }
                onSaved={handleTaskSaved}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                activeBoard={activeBoard}
              />
            </>
          )}

          {/* Kanban mode */}
          {viewMode === "kanban" && (
            <WorkKanban workType={mode} boardId={activeBoard?.id} />
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragOverlay?.type === "backlogTask" ? (
          <BacklogCardOverlay task={dragOverlay.task} />
        ) : dragOverlay?.type === "contentTask" ? (
          <TaskCardOverlay task={dragOverlay.task} />
        ) : null}
      </DragOverlay>

      <ContentTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        defaultDate={dialogOpen ? dialogDate : undefined}
        task={editingTask}
        onSaved={handleTaskSaved}
        onDelete={handleDeleteTask}
        onToggleComplete={handleToggleComplete}
        activeBoard={activeBoard}
      />

      <ContentPlannerChat
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        mode={mode}
      />
    </DndContext>
  );
}
