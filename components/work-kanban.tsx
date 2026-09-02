"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Check,
  Loader2,
  PencilLine,
  Trash2,
  CheckCircle2,
  Circle,
  GripVertical,
  Settings2,
  Construction,
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
import type { Column, WorkKanbanTask, Priority } from "@/lib/models";
import { auth } from "@/lib/firebase";
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
import { cn } from "@/lib/utils";

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "border-l-rose-500 bg-rose-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-sky-500 bg-sky-500/5",
  none: "border-l-muted bg-muted/5",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  none: "bg-muted text-muted-foreground",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
  none: "Без приоритета",
};

const DEFAULT_COLUMNS: Column[] = [
  { id: "backlog", name: "Бэклог", boardId: "", order: 0, icon: "inbox", color: "muted", createdAt: "", updatedAt: "" },
  { id: "in-progress", name: "В работе", boardId: "", order: 1, icon: "clock", color: "blue", createdAt: "", updatedAt: "" },
  { id: "review", name: "На проверке", boardId: "", order: 2, icon: "eye", color: "amber", createdAt: "", updatedAt: "" },
  { id: "done", name: "Готово", boardId: "", order: 3, icon: "check", color: "emerald", createdAt: "", updatedAt: "" },
];

interface WorkKanbanProps {
  workType: "content" | "dev";
  boardId?: string;
}

function KanbanCard({
  task,
  onEdit,
  onToggleComplete,
  onDelete,
}: {
  task: WorkKanbanTask;
  onEdit: (task: WorkKanbanTask) => void;
  onToggleComplete: (task: WorkKanbanTask) => void;
  onDelete: (task: WorkKanbanTask) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `work-kanban-${task.id}`,
      data: { type: "workKanbanTask", task },
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
      className={cn(
        "group rounded-lg border bg-card p-3 space-y-2 transition-colors hover:border-primary/40 cursor-grab active:cursor-grabbing",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
        isDragging && "opacity-0",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn("text-sm font-medium leading-snug flex-1", task.completed && "line-through")}>
          {task.title}
        </p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
            className="text-muted-foreground/50 hover:text-primary transition-colors"
          >
            {task.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Circle className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <PencilLine className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            className="text-muted-foreground/50 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", PRIORITY_BADGE[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
        {task.comment && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
            {task.comment}
          </span>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  tasks,
  onEdit,
  onToggleComplete,
  onDelete,
  onAddTask,
}: {
  column: Column;
  tasks: WorkKanbanTask[];
  onEdit: (task: WorkKanbanTask) => void;
  onToggleComplete: (task: WorkKanbanTask) => void;
  onDelete: (task: WorkKanbanTask) => void;
  onAddTask: (columnId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `work-col-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-w-[280px] max-w-[320px] w-full rounded-xl border bg-muted/20 transition-colors",
        isOver && "ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{column.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className="text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[100px]">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/50">
            Перетащите задачу сюда
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkKanban({ workType, boardId = "default" }: WorkKanbanProps) {
  const [tasks, setTasks] = useState<WorkKanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [editingTask, setEditingTask] = useState<WorkKanbanTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogColumnId, setDialogColumnId] = useState("backlog");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("none");
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOverlay, setDragOverlay] = useState<WorkKanbanTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) { setTasks([]); return; }
      const res = await fetch(`/api/work-kanban-tasks?workType=${workType}`);
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [workType]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleSave = useCallback(async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (editingTask) {
        const res = await fetch("/api/work-kanban-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTask.id,
            title: newTitle.trim(),
            priority: newPriority,
            comment: newComment.trim() || undefined,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
        }
      } else {
        const res = await fetch("/api/work-kanban-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId,
            columnId: dialogColumnId,
            title: newTitle.trim(),
            priority: newPriority,
            comment: newComment.trim() || undefined,
            workType,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setTasks((prev) => [...prev, created]);
        }
      }
      setDialogOpen(false);
      setEditingTask(null);
      setNewTitle("");
      setNewPriority("none");
      setNewComment("");
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }, [editingTask, newTitle, newPriority, newComment, dialogColumnId, boardId, workType]);

  const handleDelete = useCallback(async (task: WorkKanbanTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await fetch("/api/work-kanban-tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
    } catch {
      // silent
    }
  }, []);

  const handleToggleComplete = useCallback(async (task: WorkKanbanTask) => {
    const updated = { ...task, completed: !task.completed, completedAt: task.completed ? null : new Date().toISOString() };
    setTasks((prev) => prev.map((t) => t.id === task.id ? updated : t));
    try {
      await fetch("/api/work-kanban-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, completed: updated.completed, completedAt: updated.completedAt }),
      });
    } catch {
      // silent
    }
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as { task?: WorkKanbanTask } | null;
    if (data?.task) setDragOverlay(data.task);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDragOverlay(null);
    const active = event.active.data.current as { task?: WorkKanbanTask } | null;
    const over = event.over?.data.current as { columnId?: string } | null;
    if (!active?.task || !over?.columnId) return;
    if (active.task.columnId === over.columnId) return;

    const updated = { ...active.task, columnId: over.columnId };
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    try {
      await fetch("/api/work-kanban-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: updated.id, columnId: over.columnId }),
      });
    } catch {
      // silent
    }
  }, []);

  const tasksByColumn = columns.map((col) => ({
    column: col,
    tasks: tasks.filter((t) => t.columnId === col.id),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-none">
          {tasksByColumn.map(({ column, tasks: colTasks }) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={colTasks}
              onEdit={(task) => {
                setEditingTask(task);
                setNewTitle(task.title);
                setNewPriority(task.priority);
                setNewComment(task.comment || "");
                setDialogColumnId(task.columnId);
                setDialogOpen(true);
              }}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onAddTask={(colId) => {
                setEditingTask(null);
                setNewTitle("");
                setNewPriority("none");
                setNewComment("");
                setDialogColumnId(colId);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragOverlay && (
            <div className="rounded-lg border bg-card p-3 shadow-xl rotate-3 opacity-90 max-w-[300px]">
              <p className="text-sm font-medium">{dragOverlay.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Clients block */}
      <div className="mt-6 rounded-xl border border-dashed bg-muted/10 p-6 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Construction className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1">Клиенты</h3>
        <p className="text-xs text-muted-foreground">
          Управление клиентами скоро будет доступно
        </p>
      </div>

      {/* Task dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Название задачи"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSave(); }}
              autoFocus
            />
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="none">Без приоритета</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Комментарий (необязательно)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving || !newTitle.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {editingTask ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
