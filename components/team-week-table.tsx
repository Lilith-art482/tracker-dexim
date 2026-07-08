"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  User,
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
  closestCorners,
} from "@dnd-kit/core";
import type { Task, Column } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const ROWS = 12;

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/10 border-l-rose-500 text-rose-600 dark:text-rose-400",
  medium:
    "bg-amber-500/10 border-l-amber-500 text-amber-600 dark:text-amber-400",
  low: "bg-sky-500/10 border-l-sky-500 text-sky-600 dark:text-sky-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

function taskOverlapsDay(task: Task, dayStr: string): boolean {
  if (task.archived) return false;
  if (!task.startDate && !task.endDate) return false;
  if (
    task.startDate &&
    task.startDate <= dayStr &&
    (!task.endDate || task.endDate >= dayStr)
  )
    return true;
  if (!task.startDate && task.endDate && task.endDate >= dayStr) return true;
  return false;
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function getWeekDateStr(weekDates: Date[], dayIdx: number): string {
  return weekDates[dayIdx].toISOString().split("T")[0];
}

function DraggableTaskCard({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { type: "teamTask", task },
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
        {task.completed && (
          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
        )}
      </div>
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5 truncate">
          {task.assignees.length > 0 && (
            <>
              <User className="h-2.5 w-2.5 shrink-0" />
              {task.assignees[0]}
              {task.assignees.length > 1 && ` +${task.assignees.length - 1}`}
            </>
          )}
        </span>
        <Badge
          variant={
            task.priority === "high"
              ? "default"
              : task.priority === "medium"
                ? "secondary"
                : "outline"
          }
          className="text-[9px] px-1 py-0"
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className={cn(
        "rounded-md border-l-2 px-3 py-2 text-sm rotate-3 opacity-90",
        PRIORITY_COLORS[task.priority],
        task.completed && "opacity-60",
      )}
    >
      <div className="font-medium">{task.title}</div>
    </div>
  );
}

function buildDaySlots(
  dayTasks: Task[],
  positionMap: Record<string, number>,
): (Task | null)[] {
  const slots: (Task | null)[] = new Array(ROWS).fill(null);
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

export function TeamWeekTable({
  tasks,
  columns,
  weekDates,
  onSaved,
  onEdit,
  onCellClick,
}: {
  tasks: Task[];
  columns: Column[];
  weekDates: Date[];
  onSaved: (task: Task) => void;
  onEdit: (task: Task) => void;
  onCellClick: (dayIdx: number, columnId: string) => void;
}) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [positionMap, setPositionMap] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (let d = 0; d < 7; d++) {
      const dayStr = getWeekDateStr(weekDates, d);
      map[d] = tasks.filter((t) => taskOverlapsDay(t, dayStr));
    }
    return map;
  }, [tasks, weekDates]);

  const daySlots = useMemo(() => {
    const result: Record<number, (Task | null)[]> = {};
    for (let d = 0; d < 7; d++) {
      result[d] = buildDaySlots(tasksByDay[d] || [], positionMap);
    }
    return result;
  }, [tasksByDay, positionMap]);

  const handleCellClick = (dayOfWeek: number) => {
    onCellClick(dayOfWeek, columns[0]?.id || "");
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task = active.data.current?.task as Task | undefined;
    if (!task) return;
    const overId = over.id.toString();
    if (!overId.startsWith("slot-")) return;
    const parts = overId.split("-");
    const newDay = parseInt(parts[1], 10);
    const newRow = parseInt(parts[2], 10);
    if (isNaN(newDay) || isNaN(newRow)) return;
    const targetSlots = daySlots[newDay];
    if (targetSlots[newRow]) return;

    let oldDay = -1;
    for (let d = 0; d < 7; d++) {
      if (daySlots[d].some((s) => s?.id === task.id)) {
        oldDay = d;
        break;
      }
    }
    if (oldDay === newDay) {
      setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
    } else {
      setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
      const dayStr = getWeekDateStr(weekDates, newDay);
      onSaved({
        ...task,
        startDate: dayStr,
        endDate: dayStr,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div
          className="grid min-w-[700px]"
          style={{ gridTemplateColumns: `repeat(7, minmax(80px, 1fr))` }}
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
                      onCellClick={() => handleCellClick(dayIdx)}
                      onEdit={onEdit}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

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
}: {
  dayOfWeek: number;
  rowIndex: number;
  task: Task | null;
  onCellClick: () => void;
  onEdit: (task: Task) => void;
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
        "min-h-[40px] lg:min-h-[56px] px-1 py-0.5 lg:px-1.5 lg:py-1 overflow-hidden transition-colors",
        !task && "cursor-pointer hover:bg-muted/20",
        isOver && "bg-emerald-500/10",
        task && "bg-card",
      )}
    >
      {task ? (
        <DraggableTaskCard task={task} onEdit={onEdit} />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Plus className="h-3.5 w-3.5 text-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}
