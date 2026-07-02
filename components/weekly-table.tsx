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

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, "0")}:00`,
);

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

function tasksMatchSlot(task: PersonalTask, timeSlot: string): boolean {
  const slotHour = timeSlot.split(":")[0];
  const taskHour = task.startTime.split(":")[0];
  return taskHour === slotHour;
}

function CellDroppable({
  dayOfWeek,
  timeSlot,
  children,
  onCellClick,
}: {
  dayOfWeek: number;
  timeSlot: string;
  children: React.ReactNode;
  onCellClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${dayOfWeek}-${timeSlot}`,
    data: { type: "cell", dayOfWeek },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onCellClick}
      className={cn(
        "relative flex min-h-[40px] cursor-pointer flex-col gap-1 rounded-sm border border-transparent p-1 transition-colors",
        isOver && "border-emerald-500 bg-emerald-500/10",
      )}
    >
      {children}
      {React.Children.count(children) === 0 && (
        <div className="flex h-full items-center justify-center">
          <Plus className="h-3 w-3 text-muted-foreground/20 transition-colors group-hover:text-muted-foreground/50" />
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
        "group cursor-grab active:cursor-grabbing rounded border-l-2 px-1.5 py-1 text-[11px] transition-colors",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
        isDragging && "opacity-0 z-50",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="flex-1 font-medium leading-tight truncate">
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
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
          ) : (
            <Circle className="h-2.5 w-2.5 text-muted-foreground hover:text-emerald-500" />
          )}
        </button>
      </div>
      <div className="text-[9px] text-muted-foreground">
        {task.startTime.slice(0, 5)}–{task.endTime.slice(0, 5)}
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: PersonalTask }) {
  return (
    <div
      className={cn(
        "rounded border-l-2 px-3 py-2 text-xs rotate-3 opacity-90",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
      )}
    >
      <div className="font-medium">{task.title}</div>
      <div className="text-[10px] text-muted-foreground">
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
  const [dialogStartTime, setDialogStartTime] = useState("09:00");
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getTasksForCell = useCallback(
    (dayOfWeek: number, timeSlot: string) => {
      return tasks
        .filter((t) => t.dayOfWeek === dayOfWeek && tasksMatchSlot(t, timeSlot))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
    [tasks],
  );

  const handleCellClick = (dayOfWeek: number, timeSlot: string) => {
    setDialogDayOfWeek(dayOfWeek);
    setDialogStartTime(timeSlot);
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
          className="grid min-w-[1200px]"
          style={{
            gridTemplateColumns: `repeat(7, 1fr)`,
          }}
        >
          {/* hour rows */}
          {HOURS.flatMap((hour) =>
            DAYS.map((_day, dayIdx) => (
              <div
                key={`r-${hour}-day-${dayIdx}`}
                className="border-b border-border/20"
              >
                <CellDroppable
                  dayOfWeek={dayIdx}
                  timeSlot={hour}
                  onCellClick={() => handleCellClick(dayIdx, hour)}
                >
                  {getTasksForCell(dayIdx, hour).map((task) => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onToggleComplete={onToggleComplete}
                    />
                  ))}
                </CellDroppable>
              </div>
            ))
          )}
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
        defaultStartTime={dialogStartTime}
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
