"use client";

import React, { useState, useMemo, useRef } from "react";
import { Plus, CheckCircle2, Circle, FileText } from "lucide-react";
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
import type { PersonalTask, Priority, Board } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { PersonalTaskDialog } from "@/components/personal-task-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
  onNoteClick,
  noteSnippet,
}: {
  task: PersonalTask;
  onEdit: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
  onNoteClick?: (noteId: string) => void;
  noteSnippet?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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
        <div className="flex items-center gap-0.5 shrink-0">
          {task.sourceNoteId && (
            <div className="relative group/note">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNoteClick?.(task.sourceNoteId!);
                }}
                className="hover:scale-110 transition-transform"
                title="Открыть заметку"
              >
                <FileText className="h-3 w-3 text-muted-foreground/70 hover:text-primary" />
              </button>
              {noteSnippet && (
                <div className="absolute bottom-full right-0 mb-1 w-48 p-2 rounded-lg border border-border/60 bg-popover shadow-lg text-[10px] text-muted-foreground opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none z-50 whitespace-normal">
                  {noteSnippet}
                </div>
              )}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            className="hover:scale-110 transition-transform"
          >
            {task.completed ? (
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground hover:text-emerald-500" />
            )}
          </button>
        </div>
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
  weekDates,
  onSaved,
  onToggleComplete,
  onDelete,
  onNoteClick,
  noteSnippets,
  activeBoard,
}: {
  tasks: PersonalTask[];
  weekDates: Date[];
  onSaved: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
  onDelete: (task: PersonalTask) => void;
  onNoteClick?: (noteId: string) => void;
  noteSnippets?: Record<string, string>;
  activeBoard?: Board;
}) {
  const [activeTask, setActiveTask] = useState<PersonalTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState("");
  const dialogRowRef = useRef(0);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [positionMap, setPositionMap] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const weekDateKeys = weekDates.map(getDateKey);

  const tasksByDate = useMemo(() => {
    const map: Record<string, PersonalTask[]> = {};
    for (const t of tasks) {
      const key = t.date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [tasks]);

  const daySlots = useMemo(() => {
    const result: Record<string, (PersonalTask | null)[]> = {};
    for (const dk of weekDateKeys) {
      result[dk] = buildDaySlots(tasksByDate[dk] || [], positionMap);
    }
    return result;
  }, [tasksByDate, positionMap, weekDateKeys]);

  const handleCellClick = (date: string, rowIndex: number) => {
    setDialogDate(date);
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

    const overData = over.data.current;
    if (!overData || overData.type !== "slot") return;

    const newDate = overData.date as string;
    const newRow = overData.rowIndex as number;
    if (!newDate || isNaN(newRow)) return;

    const targetSlots = daySlots[newDate];
    if (!targetSlots) return;

    const targetTask = targetSlots[newRow];
    if (targetTask && targetTask.id === task.id) return;

    const findRow = (dateKey: string, taskId: string): number => {
      const slots = daySlots[dateKey];
      if (!slots) return -1;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i]?.id === taskId) return i;
      }
      return -1;
    };

    const oldRow = findRow(task.date, task.id);

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
    } else {
      if (targetTask && oldRow !== -1) {
        setPositionMap((prev) => ({
          ...prev,
          [task.id]: newRow,
          [targetTask.id]: oldRow,
        }));
      } else {
        setPositionMap((prev) => ({ ...prev, [task.id]: newRow }));
      }

      const updated = { ...task, date: newDate };
      onSaved(updated);

      try {
        const res = await fetch("/api/personal-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, date: newDate }),
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
      <div className="overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
        <div
          className="grid min-w-[700px]"
          style={{ gridTemplateColumns: `repeat(7, minmax(80px, 1fr))` }}
        >
          {DAYS.map((_day, dayIdx) => {
            const dateKey = weekDateKeys[dayIdx];
            const slots = daySlots[dateKey];
            return (
              <div key={dateKey} className="flex flex-col">
                {Array.from({ length: ROWS }, (_, rowIdx) => {
                  const task = slots?.[rowIdx] ?? null;
                  return (
                    <CellRow
                      key={`slot-${dateKey}-${rowIdx}`}
                      date={dateKey}
                      rowIndex={rowIdx}
                      task={task}
                      onCellClick={() => handleCellClick(dateKey, rowIdx)}
                      onEdit={handleEditTask}
                      onToggleComplete={onToggleComplete}
                      onNoteClick={onNoteClick}
                      noteSnippets={noteSnippets}
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
        defaultDate={dialogDate}
        task={editingTask}
        onSaved={handleSaved}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
        activeBoard={activeBoard}
      />

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function CellRow({
  date,
  rowIndex,
  task,
  onCellClick,
  onEdit,
  onToggleComplete,
  onNoteClick,
  noteSnippets,
}: {
  date: string;
  rowIndex: number;
  task: PersonalTask | null;
  onCellClick: () => void;
  onEdit: (task: PersonalTask) => void;
  onToggleComplete: (task: PersonalTask) => void;
  onNoteClick?: (noteId: string) => void;
  noteSnippets?: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${date}-${rowIndex}`,
    data: { type: "slot", date, rowIndex },
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
        <DraggableTaskCard
          task={task}
          onEdit={onEdit}
          onToggleComplete={onToggleComplete}
          onNoteClick={onNoteClick}
          noteSnippet={noteSnippets?.[task.sourceNoteId ?? ""]}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Plus className="h-3.5 w-3.5 text-muted-foreground/20" />
        </div>
      )}
    </div>
  );
}
