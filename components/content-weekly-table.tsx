"use client";

import { useState, useRef } from "react";
import { Plus, CheckCircle2, Circle, Zap } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { ContentTask, Board } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { ContentTaskDialog } from "@/components/content-task-dialog";
import { cn } from "@/lib/utils";
import { taskColorCard } from "@/lib/task-colors";

const ROWS = 24;
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const STATUS_CARD: Record<string, string> = {
  Идея: "bg-muted/10 border-l-muted",
  Черновик: "bg-sky-500/10 border-l-sky-500",
  "В работе": "bg-amber-500/10 border-l-amber-500",
  "Готов к публикации": "bg-violet-500/10 border-l-violet-500",
  Опубликовано: "bg-primary/10 border-l-emerald-500",
  Архив: "bg-muted/40 border-l-muted",
};

const STATUS_BADGE: Record<
  string,
  "default" | "secondary" | "outline" | "ghost"
> = {
  Идея: "secondary",
  Черновик: "secondary",
  "В работе": "secondary",
  "Готов к публикации": "secondary",
  Опубликовано: "default",
  Архив: "ghost",
};

export function buildDaySlots(
  dayTasks: ContentTask[],
  positionMap: Record<string, number>,
): (ContentTask | null)[] {
  const slots: (ContentTask | null)[] = new Array(ROWS).fill(null);
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

function DraggableTaskCard({
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
      id: task.id,
      data: { type: "contentTask", task },
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
        task.color
          ? taskColorCard(task.color)
          : (STATUS_CARD[task.status] ?? "bg-muted/10 border-l-muted"),
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
          {task.funnel && (
            <Zap className="h-3 w-3 text-violet-500" aria-label="Перелив" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            className="hover:scale-110 transition-transform"
          >
            {task.completed ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <Circle className="h-3 w-3 text-muted-foreground hover:text-primary" />
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        <span>{task.time ?? "Бэклог"}</span>
        <Badge
          variant={STATUS_BADGE[task.status] ?? "secondary"}
          className="text-[9px] px-1 py-0"
        >
          {task.status}
        </Badge>
      </div>
    </div>
  );
}

export function TaskCardOverlay({ task }: { task: ContentTask }) {
  return (
    <div
      className={cn(
        "rounded-md border-l-2 px-3 py-2 text-sm rotate-3 opacity-90",
        task.color
          ? taskColorCard(task.color)
          : (STATUS_CARD[task.status] ?? "bg-muted/10 border-l-muted"),
        task.completed && "opacity-60",
      )}
    >
      <div className="font-medium">{task.title}</div>
      <div className="text-xs text-muted-foreground">
        {task.time ?? "Бэклог"}
      </div>
    </div>
  );
}

export function ContentWeeklyTable({
  weekDates,
  daySlots,
  onPositionChange,
  onSaved,
  onToggleComplete,
  onDelete,
  activeBoard,
}: {
  weekDates: Date[];
  daySlots: Record<string, (ContentTask | null)[]>;
  onPositionChange: (id: string, row: number) => void;
  onSaved: (task: ContentTask) => void;
  onToggleComplete: (task: ContentTask) => void;
  onDelete: (task: ContentTask) => void;
  activeBoard?: Board;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState("");
  const dialogRowRef = useRef(0);
  const [editingTask, setEditingTask] = useState<ContentTask | null>(null);

  const weekDateKeys = weekDates.map(getDateKey);

  const handleCellClick = (date: string, rowIndex: number) => {
    setDialogDate(date);
    dialogRowRef.current = rowIndex;
    setEditingTask(null);
    setDialogOpen(true);
  };

  const handleEditTask = (task: ContentTask) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleSaved = (task: ContentTask) => {
    if (!editingTask) {
      onPositionChange(task.id, dialogRowRef.current);
    }
    onSaved(task);
  };

  return (
    <>
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
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <ContentTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        defaultDate={dialogOpen ? dialogDate : undefined}
        task={editingTask}
        onSaved={handleSaved}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
        activeBoard={activeBoard}
      />
    </>
  );
}

function CellRow({
  date,
  rowIndex,
  task,
  onCellClick,
  onEdit,
  onToggleComplete,
}: {
  date: string;
  rowIndex: number;
  task: ContentTask | null;
  onCellClick: () => void;
  onEdit: (task: ContentTask) => void;
  onToggleComplete: (task: ContentTask) => void;
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
        isOver && "bg-primary/10",
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
