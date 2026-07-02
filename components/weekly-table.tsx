"use client";

import React, { useState, useCallback } from "react";
import { Plus, CheckCircle2, Circle } from "lucide-react";
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
  closestCorners,
} from "@dnd-kit/core";
import type { PersonalTask, Priority } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { PersonalTaskDialog } from "@/components/personal-task-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const ROWS = 24;

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "bg-rose-500/10 border-l-rose-500 text-rose-600 dark:text-rose-400",
  medium:
    "bg-amber-500/10 border-l-amber-500 text-amber-600 dark:text-amber-400",
  low: "bg-sky-500/10 border-l-sky-500 text-sky-600 dark:text-sky-400",
};

const PRIORITY_BADGE: Record<Priority, "default" | "secondary" | "outline"> = {
  high: "default",
  medium: "secondary",
  low: "outline",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

function CellDroppable({
  dayOfWeek,
  rowIndex,
  children,
  onCellClick,
}: {
  dayOfWeek: number;
  rowIndex: number;
  children: React.ReactNode;
  onCellClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dayOfWeek}-${rowIndex}`,
    data: { type: "cell", dayOfWeek },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onCellClick}
      className={cn(
        "relative flex min-h-[56px] cursor-pointer flex-col gap-1 rounded-md border border-transparent p-1.5 transition-colors",
        isOver && "border-emerald-500 bg-emerald-500/10",
      )}
    >
      {children}
      {React.Children.count(children) === 0 && (
        <div className="flex h-full items-center justify-center">
          <Plus className="h-3.5 w-3.5 text-muted-foreground/20 transition-colors group-hover:text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}

function DraggableTaskCard({
  task,
  onEdit,
  onToggleComplete,
}: {
  task: PersonalTask;
  onEdit: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: { type: "personalTask", task },
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
      onClick={(e) => {
        e.stopPropagation();
        onEdit(task);
      }}
      className={cn(
        "group cursor-grab active:cursor-grabbing rounded-md border-l-2 px-2 py-1.5 text-xs transition-colors",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
        isDragging && "opacity-0 z-50",
      )}
    >
      <div className="flex items-start justify-between gap-1 w-full">
        <span className="flex-1 font-medium leading-snug break-words min-w-0">
          <span className={cn(task.completed && "line-through")}>
            {task.title}
          </span>
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className="shrink-0 hover:scale-110 transition-transform"
        >
          {task.completed ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : (
            <Circle className="h-3 w-3 text-muted-foreground hover:text-emerald-500" />
          )}
        </button>
      </div>
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        <span>
          {task.startTime.slice(0, 5)}–{task.endTime.slice(0, 5)}
        </span>
        <Badge
          variant={PRIORITY_BADGE[task.priority]}
          className="text-[9px] px-1 py-0"
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: PersonalTask }) {
  return (
    <div
      className={cn(
        "rounded-md border-l-2 px-3 py-2 text-sm rotate-3 opacity-90",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
      )}
    >
      <div className="font-medium">{task.title}</div>
      <div className="text-xs text-muted-foreground">
        {task.startTime}–{task.endTime}
      </div>
    </div>
  );
}

export function WeeklyTable({
  tasks,
  onSaved,
  onToggleComplete,
  onDelete,
  boardId,
}: {
  tasks: PersonalTask[];
  onSaved: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
  onDelete: (task: PersonalTask) => void;
  boardId?: string;
}) {
  const [activeTask, setActiveTask] = useState<PersonalTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDayOfWeek, setDialogDayOfWeek] = useState(0);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getTasksForDay = useCallback(
    (dayOfWeek: number) => {
      return tasks
        .filter((t) => t.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, ROWS);
    },
    [tasks],
  );

  const handleCellClick = (dayOfWeek: number) => {
    setDialogDayOfWeek(dayOfWeek);
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: PersonalTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as PersonalTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as PersonalTask | undefined;
    if (!task) return;

    const targetData = over.data.current as
      | { type: string; dayOfWeek: number }
      | undefined;
    if (!targetData || targetData.type !== "cell") return;

    const newDayOfWeek = targetData.dayOfWeek;
    if (newDayOfWeek === task.dayOfWeek) return;

    const updated = { ...task, dayOfWeek: newDayOfWeek };
    onSaved(updated);

    try {
      const res = await fetch("/api/personal-tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          dayOfWeek: newDayOfWeek,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка перемещения задачи");
        return;
      }
    } catch {
      toast.error("Ошибка перемещения задачи");
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-[1000px]"
          style={{
            gridTemplateColumns: `repeat(7, 1fr)`,
          }}
        >
          {DAYS.map((_day, dayIdx) => (
            <div key={dayIdx} className="flex flex-col gap-1">
              {Array.from({ length: ROWS }, (_, rowIdx) => (
                <div
                  key={rowIdx}
                  className="border-b border-border/30 last:border-0"
                >
                  <CellDroppable
                    dayOfWeek={dayIdx}
                    rowIndex={rowIdx}
                    onCellClick={() => handleCellClick(dayIdx)}
                  >
                    {getTasksForDay(dayIdx)[rowIdx] ? (
                      <DraggableTaskCard
                        key={getTasksForDay(dayIdx)[rowIdx].id}
                        task={getTasksForDay(dayIdx)[rowIdx]}
                        onEdit={handleEditTask}
                        onToggleComplete={onToggleComplete}
                      />
                    ) : null}
                  </CellDroppable>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <PersonalTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        boardId={boardId ?? ""}
        defaultDayOfWeek={dialogDayOfWeek}
        task={editingTask}
        onSaved={onSaved}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
      />

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
