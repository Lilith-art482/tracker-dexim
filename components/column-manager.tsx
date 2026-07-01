"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Loader2,
  Check,
  PencilLine,
  GripVertical,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  Archive,
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
} from "@dnd-kit/core";
import type { Column, Task } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ColumnManagerProps {
  boardId: string;
  initialColumns: Column[];
}

function DraggableTaskCard({
  task,
  onEdit,
  onToggleComplete,
  onArchive,
  isDragging,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  onArchive: (task: Task) => void;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingSource,
  } = useDraggable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      onClick={() => onEdit(task)}
      className={cn(
        "w-full text-left",
        isDragging && "opacity-0",
        isDraggingSource && "z-50"
      )}
      style={style}
      {...listeners}
      {...attributes}
    >
      <TaskCardContent
        task={task}
        onToggleComplete={onToggleComplete}
        onArchive={onArchive}
      />
    </button>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="w-72 rotate-3 opacity-90">
      <TaskCardContent task={task} />
    </div>
  );
}

function TaskCardContent({
  task,
  onToggleComplete,
  onArchive,
}: {
  task: Task;
  onToggleComplete?: (task: Task) => void;
  onArchive?: (task: Task) => void;
}) {
  return (
    <Card
      className={cn(
        "card-hover border-l-4",
        task.completed
          ? "border-l-emerald-500/40 opacity-75"
          : "border-l-emerald-500"
      )}
      size="sm"
    >
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle
            className={cn(
              "text-sm leading-tight",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </CardTitle>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete?.(task);
            }}
            className="shrink-0 hover:scale-110 transition-transform"
            title={
              task.completed ? "Отменить выполнение" : "Отметить выполненной"
            }
          >
            {task.completed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground hover:text-emerald-500" />
            )}
          </button>
          {task.completed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive?.(task);
              }}
              className="shrink-0 hover:scale-110 transition-transform text-muted-foreground hover:text-amber-500"
              title="Отправить в архив"
            >
              <Archive className="h-4 w-4" />
            </button>
          )}
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
                "ru-RU"
              )}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DroppableColumn({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
    data: { type: "column", columnId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 min-h-[120px] rounded-lg transition-colors",
        isOver && "bg-emerald-500/5 ring-2 ring-emerald-500/30"
      )}
    >
      {children}
    </div>
  );
}

export function ColumnManager({ boardId, initialColumns }: ColumnManagerProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [adding, setAdding] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [formColumnId, setFormColumnId] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    // Полный сброс при смене доски
    setColumns(initialColumns);
    setTasks({});
    setLoadingTasks({});
    setFormColumnId("");
    setEditingTask(null);
    setFormOpen(false);
    setActiveTask(null);
    setAdding(false);
    setNewColumnName("");
    setEditingId(null);
    setEditName("");
    setDeleteId(null);
  }, [boardId, initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchTasks = useCallback(async (columnId: string) => {
    setLoadingTasks((prev) => ({ ...prev, [columnId]: true }));
    try {
      const uid = auth.currentUser?.uid || "";
      const res = await fetch(`/api/tasks?columnId=${columnId}&boardId=${boardId}&uid=${uid}`);
      if (res.ok) {
        const data: Task[] = await res.json();
        setTasks((prev) => ({ ...prev, [columnId]: data }));
      }
    } catch {
      console.error("Ошибка загрузки задач");
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [columnId]: false }));
    }
  }, [boardId]);

  useEffect(() => {
    for (const col of columns) {
      fetchTasks(col.id);
    }
  }, [columns, fetchTasks]);

  useEffect(() => {
    if (adding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [adding]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleAdd = async () => {
    const name = newColumnName.trim();
    if (!name) return;

    setCreating(true);
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

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка создания колонки");
        return;
      }

      const newColumn: Column = await res.json();
      setColumns((prev) => [...prev, newColumn]);
      setNewColumnName("");
      setAdding(false);
      toast.success("Колонка создана");
    } catch {
      toast.error("Ошибка создания колонки");
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (column: Column) => {
    setEditingId(column.id);
    setEditName(column.name);
  };

  const handleRename = async (columnId: string) => {
    const name = editName.trim();
    if (!name || name === columns.find((c) => c.id === columnId)?.name) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch("/api/columns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: columnId, boardId, name }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка переименования колонки");
        return;
      }

      const updated: Column = await res.json();
      setColumns((prev) => prev.map((c) => (c.id === columnId ? updated : c)));
      setEditingId(null);
      toast.success("Колонка переименована");
    } catch {
      toast.error("Ошибка переименования колонки");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/columns", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId, boardId }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка удаления колонки");
        return;
      }

      setColumns((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
      toast.success("Колонка удалена");
    } catch {
      toast.error("Ошибка удаления колонки");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddTask = (columnId: string) => {
    setFormColumnId(columnId);
    setEditingTask(null);
    setFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setFormColumnId(task.columnId);
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          boardId,
          columnId: task.columnId,
          completed: !task.completed,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка обновления задачи");
        return;
      }

      const updated: Task = await res.json();
      setTasks((prev) => {
        const columnTasks = prev[task.columnId] || [];
        return {
          ...prev,
          [task.columnId]: columnTasks.map((t) =>
            t.id === task.id ? updated : t
          ),
        };
      });
      toast.success(
        updated.completed ? "Задача выполнена" : "Задача возобновлена"
      );
    } catch {
      toast.error("Ошибка обновления задачи");
    }
  };

  const handleArchive = async (task: Task) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: task.id, 
          boardId,
          columnId: task.columnId,
          archived: true 
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка архивирования");
        return;
      }

      setTasks((prev) => {
        const columnTasks = prev[task.columnId] || [];
        return {
          ...prev,
          [task.columnId]: columnTasks.filter((t) => t.id !== task.id),
        };
      });
      toast.success("Задача отправлена в архив");
    } catch {
      toast.error("Ошибка архивирования");
    }
  };

  const handleTaskSaved = (task: Task) => {
    setTasks((prev) => {
      const columnTasks = prev[task.columnId] || [];
      const existing = columnTasks.findIndex((t) => t.id === task.id);
      if (existing >= 0) {
        const updated = [...columnTasks];
        updated[existing] = task;
        return { ...prev, [task.columnId]: updated };
      }
      return { ...prev, [task.columnId]: [...columnTasks, task] };
    });
  };

  const handleTaskArchived = (taskId: string) => {
    setTasks((prev) => {
      const updated: Record<string, Task[]> = {};
      for (const [colId, colTasks] of Object.entries(prev)) {
        updated[colId] = colTasks.filter((t) => t.id !== taskId);
      }
      return updated;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    const targetColumnId =
      over.data.current?.type === "column"
        ? over.data.current.columnId
        : over.id;

    if (typeof targetColumnId !== "string" || targetColumnId === task.columnId)
      return;

    const prevTask = task;
    setTasks((prev) => {
      const sourceTasks = (prev[prevTask.columnId] || []).filter(
        (t) => t.id !== prevTask.id
      );
      const targetTasks = [
        ...(prev[targetColumnId] || []),
        { ...prevTask, columnId: targetColumnId },
      ];
      return {
        ...prev,
        [prevTask.columnId]: sourceTasks,
        [targetColumnId]: targetTasks,
      };
    });

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: task.id, 
          boardId,
          columnId: targetColumnId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка перемещения задачи");
        setTasks((prev) => {
          const sourceTasks = [
            ...(prev[targetColumnId] || []).filter((t) => t.id !== prevTask.id),
            prevTask,
          ];
          const targetTasks = (prev[targetColumnId] || []).filter(
            (t) => t.id !== prevTask.id
          );
          return {
            ...prev,
            [prevTask.columnId]: sourceTasks,
            [targetColumnId]: targetTasks,
          };
        });
        return;
      }

      toast.success("Задача перемещена");
    } catch {
      toast.error("Ошибка перемещения задачи");
      setTasks((prev) => {
        const sourceTasks = [
          ...(prev[targetColumnId] || []).filter((t) => t.id !== prevTask.id),
          prevTask,
        ];
        const targetTasks = (prev[targetColumnId] || []).filter(
          (t) => t.id !== prevTask.id
        );
        return {
          ...prev,
          [prevTask.columnId]: sourceTasks,
          [targetColumnId]: targetTasks,
        };
      });
    }
  };

  const columnToDelete = columns.find((c) => c.id === deleteId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {columns
          .sort((a, b) => a.order - b.order)
          .map((column) => {
            const columnTasks = tasks[column.id] || [];
            const isLoading = loadingTasks[column.id];
            return (
              <div
                key={column.id}
                className="flex w-72 shrink-0 flex-col gap-3"
              >
                <div className="group flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                  {editingId === column.id ? (
                    <div className="flex flex-1 items-center gap-1">
                      <Input
                        ref={editInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(column.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => handleRename(column.id)}
                        className="h-7 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(column)}
                        className="flex items-center gap-1.5 text-sm font-semibold tracking-tight hover:text-emerald-500 transition-colors"
                      >
                        <span>{column.name}</span>
                        <PencilLine className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-xs tabular-nums"
                      >
                        {columnTasks.length}
                      </Badge>
                      <button
                        onClick={() => setDeleteId(column.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <DroppableColumn columnId={column.id}>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEditTask}
                        onToggleComplete={handleToggleComplete}
                        onArchive={handleArchive}
                      />
                    ))
                  )}
                </DroppableColumn>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-dashed"
                  onClick={() => handleAddTask(column.id)}
                >
                  <Plus className="h-4 w-4" />
                  Добавить задачу
                </Button>
              </div>
            );
          })}

        <div className="flex w-72 shrink-0 flex-col justify-start pt-9">
          {adding ? (
            <div className="flex items-center gap-1">
              <Input
                ref={addInputRef}
                placeholder="Название колонки"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setNewColumnName("");
                  }
                }}
                className="h-8 text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleAdd}
                disabled={creating || !newColumnName.trim()}
                className="h-8 w-8 shrink-0"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setNewColumnName("");
                }}
                className="h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-dashed"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Добавить колонку
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить колонку</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить колонку «{columnToDelete?.name}»?
              Задачи в этой колонке также будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        columnId={formColumnId}
        boardId={boardId}
        task={editingTask}
        onSaved={handleTaskSaved}
        onArchived={handleTaskArchived}
      />
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
