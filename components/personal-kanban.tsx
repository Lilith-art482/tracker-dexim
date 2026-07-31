"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  X,
  Check,
  Loader2,
  PencilLine,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  GripVertical,
  Settings2,
  Palette,
  Smile,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { Column, PersonalKanbanTask, Priority, Board } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { getBoardIcon, BOARD_ICONS } from "@/lib/board-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPersonalSettings,
  PersonalSettingsDialog,
} from "@/components/personal-settings-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "border-l-rose-500 bg-rose-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-sky-500 bg-sky-500/5",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const COLUMN_COLORS = [
  { name: "slate", dot: "bg-slate-400", bg: "bg-slate-500/8", border: "border-slate-300 dark:border-slate-700" },
  { name: "blue", dot: "bg-blue-500", bg: "bg-blue-500/8", border: "border-blue-300 dark:border-blue-700" },
  { name: "emerald", dot: "bg-emerald-500", bg: "bg-emerald-500/8", border: "border-emerald-300 dark:border-emerald-700" },
  { name: "violet", dot: "bg-violet-500", bg: "bg-violet-500/8", border: "border-violet-300 dark:border-violet-700" },
  { name: "amber", dot: "bg-amber-500", bg: "bg-amber-500/8", border: "border-amber-300 dark:border-amber-700" },
  { name: "rose", dot: "bg-rose-500", bg: "bg-rose-500/8", border: "border-rose-300 dark:border-rose-700" },
  { name: "cyan", dot: "bg-cyan-500", bg: "bg-cyan-500/8", border: "border-cyan-300 dark:border-cyan-700" },
  { name: "pink", dot: "bg-pink-500", bg: "bg-pink-500/8", border: "border-pink-300 dark:border-pink-700" },
  { name: "indigo", dot: "bg-indigo-500", bg: "bg-indigo-500/8", border: "border-indigo-300 dark:border-indigo-700" },
  { name: "teal", dot: "bg-teal-500", bg: "bg-teal-500/8", border: "border-teal-300 dark:border-teal-700" },
];

const COLOR_MAP = new Map(COLUMN_COLORS.map((c) => [c.name, c]));

function getColumnColor(color?: string) {
  if (color && COLOR_MAP.has(color)) return COLOR_MAP.get(color)!;
  return COLUMN_COLORS[0];
}

function DraggableTaskCard({
  task,
  onEdit,
  onToggleComplete,
}: {
  task: PersonalKanbanTask;
  onEdit: (task: PersonalKanbanTask) => void;
  onToggleComplete: (task: PersonalKanbanTask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { type: "personalKanbanTask", task },
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
        "rounded-lg border-l-4 p-3 space-y-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-sm",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
        isDragging && "opacity-0",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-sm font-medium leading-tight",
            task.completed && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className="shrink-0 hover:scale-110 transition-transform"
        >
          {task.completed ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground hover:text-emerald-500" />
          )}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {task.startTime}–{task.endTime}
        </span>
        <Badge
          variant="secondary"
          className={cn("text-[10px] px-1.5 py-0", PRIORITY_BADGE[task.priority])}
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>
      {task.comment && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.comment}
        </p>
      )}
    </div>
  );
}

function TaskCardOverlay({ task }: { task: PersonalKanbanTask }) {
  return (
    <div className="w-72 rotate-3 opacity-90">
      <div
        className={cn(
          "rounded-lg border-l-4 p-3 space-y-2 shadow-lg",
          PRIORITY_COLORS[task.priority],
        )}
      >
        <span className="text-sm font-medium">{task.title}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {task.startTime}–{task.endTime}
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({
  columnId,
  className,
  children,
}: {
  columnId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `kanban-col-${columnId}`,
    data: { type: "kanbanColumn", columnId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 min-h-[120px] rounded-xl transition-colors p-2",
        isOver && "ring-2 ring-emerald-500/40 bg-emerald-500/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface PersonalKanbanProps {
  boardId: string;
  activeBoard?: Board;
}

export function PersonalKanban({ boardId, activeBoard }: PersonalKanbanProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<PersonalKanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<PersonalKanbanTask | null>(null);

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [creatingColumn, setCreatingColumn] = useState(false);
  const addColumnRef = useRef<HTMLInputElement>(null);

  const [editingColumn, setEditingColumn] = useState<Column | null>(null);
  const [editColumnName, setEditColumnName] = useState("");
  const [deleteColumn, setDeleteColumn] = useState<Column | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [columnSettings, setColumnSettings] = useState<Column | null>(null);
  const [colSettingsTab, setColSettingsTab] = useState<"icon" | "color">("icon");

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogColumnId, setTaskDialogColumnId] = useState("");
  const [editingTask, setEditingTask] = useState<PersonalKanbanTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "10:00",
    priority: "medium" as Priority,
    comment: "",
  });
  const [savingTask, setSavingTask] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [colsRes, tasksRes] = await Promise.all([
        fetch(`/api/columns?boardId=${boardId}`),
        fetch(`/api/personal-kanban-tasks?boardId=${boardId}`),
      ]);
      if (colsRes.ok) setColumns(await colsRes.json());
      if (tasksRes.ok) setTasks(await tasksRes.json());
    } catch {
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (addingColumn && addColumnRef.current) {
      addColumnRef.current.focus();
    }
  }, [addingColumn]);

  const tasksByColumn = useCallback(
    (columnId: string) =>
      tasks
        .filter((t) => t.columnId === columnId)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [tasks],
  );

  const handleCreateColumn = async () => {
    const name = newColumnName.trim();
    if (!name) return;
    setCreatingColumn(true);
    try {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          name,
          order: columns.length,
        }),
      });
      if (!res.ok) throw new Error();
      const col: Column = await res.json();
      setColumns((prev) => [...prev, col]);
      setNewColumnName("");
      setAddingColumn(false);
      toast.success("Колонка создана");
    } catch {
      toast.error("Ошибка создания колонки");
    } finally {
      setCreatingColumn(false);
    }
  };

  const handleRenameColumn = async () => {
    if (!editingColumn || !editColumnName.trim()) return;
    try {
      const res = await fetch("/api/columns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingColumn.id,
          boardId,
          name: editColumnName.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const updated: Column = await res.json();
      setColumns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingColumn(null);
    } catch {
      toast.error("Ошибка переименования");
    }
  };

  const handleDeleteColumn = async () => {
    if (!deleteColumn) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/columns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteColumn.id, boardId }),
      });
      if (!res.ok) throw new Error();
      setColumns((prev) => prev.filter((c) => c.id !== deleteColumn.id));
      setTasks((prev) => prev.filter((t) => t.columnId !== deleteColumn.id));
      setDeleteColumn(null);
      toast.success("Колонка удалена");
    } catch {
      toast.error("Ошибка удаления колонки");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateColumnField = async (
    col: Column,
    data: Partial<Pick<Column, "icon" | "color">>,
  ) => {
    try {
      const res = await fetch("/api/columns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: col.id, boardId, ...data }),
      });
      if (!res.ok) throw new Error();
      const updated: Column = await res.json();
      setColumns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (columnSettings?.id === updated.id) setColumnSettings(updated);
    } catch {
      toast.error("Ошибка обновления колонки");
    }
  };

  const openTaskDialog = (columnId: string, task?: PersonalKanbanTask) => {
    setTaskDialogColumnId(columnId);
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        startTime: task.startTime,
        endTime: task.endTime,
        priority: task.priority,
        comment: task.comment || "",
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: "",
        startTime: "09:00",
        endTime: "10:00",
        priority: "medium",
        comment: "",
      });
    }
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return;
    setSavingTask(true);
    try {
      const uid = auth.currentUser?.uid;
      if (editingTask) {
        const res = await fetch("/api/personal-kanban-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTask.id,
            title: taskForm.title.trim(),
            startTime: taskForm.startTime,
            endTime: taskForm.endTime,
            priority: taskForm.priority,
            comment: taskForm.comment.trim() || undefined,
          }),
        });
        if (!res.ok) throw new Error();
        const updated: PersonalKanbanTask = await res.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        );
        toast.success("Задача обновлена");
      } else {
        const res = await fetch("/api/personal-kanban-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId,
            columnId: taskDialogColumnId,
            title: taskForm.title.trim(),
            startTime: taskForm.startTime,
            endTime: taskForm.endTime,
            priority: taskForm.priority,
            comment: taskForm.comment.trim() || undefined,
            ownerId: uid,
          }),
        });
        if (!res.ok) throw new Error();
        const created: PersonalKanbanTask = await res.json();
        setTasks((prev) => [...prev, created]);
        toast.success("Задача создана");
      }
      setTaskDialogOpen(false);
    } catch {
      toast.error("Ошибка сохранения задачи");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (task: PersonalKanbanTask) => {
    try {
      await fetch("/api/personal-kanban-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success("Задача удалена");
    } catch {
      toast.error("Ошибка удаления задачи");
    }
  };

  const handleToggleComplete = async (task: PersonalKanbanTask) => {
    const newCompleted = !task.completed;
    const completedAt = newCompleted ? new Date().toISOString() : null;
    const toggled = { ...task, completed: newCompleted, completedAt };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? toggled : t)));
    try {
      await fetch("/api/personal-kanban-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          completed: newCompleted,
          completedAt,
        }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current
      ?.task as PersonalKanbanTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as
      | PersonalKanbanTask
      | undefined;
    if (!task) return;

    const overData = over.data.current;
    if (!overData || overData.type !== "kanbanColumn") return;

    const newColumnId = overData.columnId as string;
    if (newColumnId === task.columnId) return;

    const prevTasks = tasks;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, columnId: newColumnId } : t,
      ),
    );

    try {
      const res = await fetch("/api/personal-kanban-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, columnId: newColumnId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prevTasks);
      toast.error("Ошибка перемещения задачи");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <div />
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2 className="h-4 w-4" />
          Настройки
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((col) => {
            const colColor = getColumnColor(col.color);
            const ColIcon = col.icon ? getBoardIcon(col.icon) : null;
            return (
              <div
                key={col.id}
                className="flex-shrink-0 w-72 flex flex-col"
              >
                <div
                  className={cn(
                    "rounded-t-xl border border-b-0 px-3 py-2.5",
                    colColor.bg,
                    colColor.border,
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {ColIcon ? (
                        <ColIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      {editingColumn?.id === col.id ? (
                        <Input
                          value={editColumnName}
                          onChange={(e) => setEditColumnName(e.target.value)}
                          onBlur={handleRenameColumn}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameColumn();
                            if (e.key === "Escape") setEditingColumn(null);
                          }}
                          className="h-7 text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <h3
                          className="text-sm font-semibold truncate cursor-pointer hover:text-primary"
                          onDoubleClick={() => {
                            setEditingColumn(col);
                            setEditColumnName(col.name);
                          }}
                        >
                          {col.name}
                        </h3>
                      )}
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                        {tasksByColumn(col.id).length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => {
                          setColumnSettings(col);
                          setColSettingsTab("icon");
                        }}
                        className="p-1 rounded hover:bg-background/60 transition-colors"
                        title="Настройки колонки"
                      >
                        <Smile className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingColumn(col);
                          setEditColumnName(col.name);
                        }}
                        className="p-1 rounded hover:bg-background/60 transition-colors"
                      >
                        <PencilLine className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setDeleteColumn(col)}
                        className="p-1 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>

                <DroppableColumn
                  columnId={col.id}
                  className={cn(colColor.bg, "border border-t-0 rounded-t-none", colColor.border)}
                >
                  {tasksByColumn(col.id).map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onEdit={(t) => openTaskDialog(col.id, t)}
                      onToggleComplete={handleToggleComplete}
                    />
                  ))}
                </DroppableColumn>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-1.5 text-muted-foreground mt-1"
                  onClick={() => openTaskDialog(col.id)}
                >
                  <Plus className="h-4 w-4" />
                  Задача
                </Button>
              </div>
            );
          })}

        <div className="flex-shrink-0 w-72">
          {addingColumn ? (
            <div className="flex items-center gap-1.5">
              <Input
                ref={addColumnRef}
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateColumn();
                  if (e.key === "Escape") {
                    setAddingColumn(false);
                    setNewColumnName("");
                  }
                }}
                placeholder="Название колонки"
                className="h-8 text-sm flex-1 min-w-0"
              />
              <Button
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={handleCreateColumn}
                disabled={!newColumnName.trim() || creatingColumn}
              >
                {creatingColumn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 shrink-0 p-0"
                onClick={() => {
                  setAddingColumn(false);
                  setNewColumnName("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-1.5"
              onClick={() => setAddingColumn(true)}
            >
              <Plus className="h-4 w-4" />
              Добавить колонку
            </Button>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>

      {/* Task dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Редактировать задачу" : "Новая задача"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Название задачи"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Начало
                </label>
                <Input
                  type="time"
                  value={taskForm.startTime}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Дедлайн
                </label>
                <Input
                  type="time"
                  value={taskForm.endTime}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="h-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Приоритет
              </label>
              <Select
                value={taskForm.priority}
                onValueChange={(v) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    priority: v as Priority,
                  }))
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Комментарий
              </label>
              <Textarea
                value={taskForm.comment}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                }
                placeholder="Описание или заметка..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  handleDeleteTask(editingTask);
                  setTaskDialogOpen(false);
                }}
              >
                Удалить
              </Button>
            )}
            <Button
              onClick={handleSaveTask}
              disabled={!taskForm.title.trim() || savingTask}
            >
              {savingTask && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingTask ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete column confirm */}
      <Dialog
        open={!!deleteColumn}
        onOpenChange={(open) => {
          if (!open) setDeleteColumn(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить колонку?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Все задачи в колонке «{deleteColumn?.name}» будут удалены.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteColumn(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteColumn}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column settings dialog */}
      <Dialog
        open={!!columnSettings}
        onOpenChange={(o) => {
          if (!o) setColumnSettings(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Настройки колонки</DialogTitle>
          </DialogHeader>
          {columnSettings && (
            <div className="space-y-4">
              <div className="flex gap-1 p-0.5 bg-muted/60 rounded-lg">
                <button
                  onClick={() => setColSettingsTab("icon")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5",
                    colSettingsTab === "icon"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Smile className="h-3.5 w-3.5" />
                  Иконка
                </button>
                <button
                  onClick={() => setColSettingsTab("color")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1.5",
                    colSettingsTab === "color"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Palette className="h-3.5 w-3.5" />
                  Цвет
                </button>
              </div>

              {colSettingsTab === "icon" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Выберите иконку для колонки
                  </p>
                  <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto">
                    {BOARD_ICONS.map((ic) => {
                      const Icon = ic.icon;
                      return (
                        <button
                          key={ic.name}
                          onClick={() =>
                            handleUpdateColumnField(columnSettings, {
                              icon: ic.name,
                            })
                          }
                          className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-lg transition-all",
                            columnSettings.icon === ic.name
                              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                          title={ic.name}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                  {columnSettings.icon && (
                    <button
                      onClick={() =>
                        handleUpdateColumnField(columnSettings, { icon: "" })
                      }
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Сбросить иконку
                    </button>
                  )}
                </div>
              )}

              {colSettingsTab === "color" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Выберите цвет колонки
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {COLUMN_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() =>
                          handleUpdateColumnField(columnSettings, {
                            color: c.name,
                          })
                        }
                        className={cn(
                          "flex items-center justify-center h-10 rounded-xl transition-all",
                          c.bg,
                          columnSettings.color === c.name
                            ? "ring-2 ring-offset-2 ring-offset-background ring-foreground/20"
                            : "hover:scale-105",
                        )}
                      >
                        <div className={cn("h-5 w-5 rounded-full", c.dot)} />
                      </button>
                    ))}
                  </div>
                  {columnSettings.color && (
                    <button
                      onClick={() =>
                        handleUpdateColumnField(columnSettings, { color: "" })
                      }
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Сбросить цвет
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Auto-delete settings */}
      <PersonalSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </DndContext>
  );
}
