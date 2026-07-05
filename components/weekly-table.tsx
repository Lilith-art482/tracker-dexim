"use client";

import React, { useState, useMemo, useRef } from "react";
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
        "group cursor-grab active:cursor-grabbing rounded-md border-l-2 px-2 py-1 text-xs transition-colors h-full overflow-hidden",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
        isDragging && "opacity-0 z-50",
      )}
    >
      <div className="flex items-start justify-between gap-1 w-full">
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

function buildDaySlots(
  dayTasks: PersonalTask[],
  positionMap: Record<string, number>,
): (PersonalTask | null)[] {
  const slots: (PersonalTask | null)[] = new Array(ROWS).fill(null);
  const placed = new Set<string>();

  for (const t of dayTasks) {
    const row = positionMap[t.id];
    if (typeof row === "number" && row >= 0 && row < ROWS && !slots[row]) {
      slots[row] = t;
      placed.add(t.id);
    }
  }

  let insertIdx = 0;
  for (const t of dayTasks) {
    if (placed.has(t.id)) continue;
    while (insertIdx < ROWS && slots[insertIdx] !== null) insertIdx++;
    if (insertIdx < ROWS) {
      slots[insertIdx] = t;
      insertIdx++;
    }
  }

  return slots;
}

export function WeeklyTable({
  tasks,
  onSaved,
  onToggleComplete,
  onDelete,
}: {
  tasks: PersonalTask[];
  onSaved: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
  onDelete: (task: PersonalTask) => void;
}) {
  const [activeTask, setActiveTask] = useState<PersonalTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDay, setDialogDay] = useState(0);
  const dialogRowRef = useRef(0);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [positionMap, setPositionMap] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByDay = useMemo(() => {
    const map: Record<number, PersonalTask[]> = {};
    for (const t of tasks) {
      if (!map[t.dayOfWeek]) map[t.dayOfWeek] = [];
      map[t.dayOfWeek].push(t);
    }
    return map;
  }, [tasks]);

  const daySlots = useMemo(() => {
    const result: Record<number, (PersonalTask | null)[]> = {};
    for (let d = 0; d < 7; d++) {
      result[d] = buildDaySlots(tasksByDay[d] || [], positionMap);
    }
    return result;
  }, [tasksByDay, positionMap]);

  const handleCellClick = (dayOfWeek: number, rowIndex: number) => {
    setDialogDay(dayOfWeek);
    dialogRowRef.current = rowIndex;
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: PersonalTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSaved = (task: PersonalTask) => {
    if (!editingTask) {
      const row = dialogRowRef.current;
      setPositionMap((prev) => ({ ...prev, [task.id]: row }));
    }
    onSaved(task);
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

    const overId = over.id.toString();
    if (!overId.startsWith("slot-")) return;

    const parts = overId.split("-");
    const newDay = parseInt(parts[1], 10);
    const newRow = parseInt(parts[2], 10);
    if (isNaN(newDay) || isNaN(newRow)) return;

    const targetSlots = daySlots[newDay];
    if (targetSlots[newRow]) return;

    if (newDay === task.dayOfWeek) {
      const slots = daySlots[newDay];
      let oldRow = -1;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i]?.id === task.id) {
          oldRow = i;
          break;
        }
      }
      if (oldRow === newRow) return;
      setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
    } else {
      setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));

      const updated = { ...task, dayOfWeek: newDay };
      onSaved(updated);

      try {
        const res = await fetch("/api/personal-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, dayOfWeek: newDay }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка перемещения задачи");
          return;
        }
      } catch {
        toast.error("Ошибка перемещения задачи");
      }
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
          className="grid"
          style={{ gridTemplateColumns: `repeat(7, 1fr)` }}
        >
          {DAYS.map((_day, dayIdx) => {
            const slots = daySlots[dayIdx];
            return (
              <div key={dayIdx} className="flex flex-col">
                {Array.from({ length: ROWS }, (_, rowIdx) => {
                  const task = slots?.[rowIdx] ?? null;
                  return (
                    <CellRow
                      key={`slot-${dayIdx}-${rowIdx}`}
                      dayOfWeek={dayIdx}
                      rowIndex={rowIdx}
                      task={task}
                      onCellClick={() => handleCellClick(dayIdx, rowIdx)}
                      onEdit={handleEditTask}
                      onToggleComplete={onToggleComplete}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <PersonalTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        defaultDayOfWeek={dialogDay}
        task={editingTask}
        onSaved={handleSaved}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
      />

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function CellRow({
  dayOfWeek,
  rowIndex,
  task,
  onCellClick,
  onEdit,
  onToggleComplete,
}: {
  dayOfWeek: number;
  rowIndex: number;
  task: PersonalTask | null;
  onCellClick: () => void;
  onEdit: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${dayOfWeek}-${rowIndex}`,
    data: { type: "slot", dayOfWeek, rowIndex },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={!task ? onCellClick : undefined}
      className={cn(
        "h-[56px] px-1.5 py-1 overflow-hidden transition-colors",
        !task && "cursor-pointer hover:bg-muted/20",
        isOver && "bg-emerald-500/10",
        task && "bg-card",
      )}
    >
      {task ? (
        <DraggableTaskCard
          task={task}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Plus className="h-3.5 w-3.5 text-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}
