"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  Tag,
  Clock,
  GripHorizontal,
  ArrowUpDown,
} from "lucide-react";
import type { PersonalTask, Priority, Board } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

interface PersonalTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultStartTime?: string;
  task?: PersonalTask | null;
  onSaved: (task: PersonalTask) => void;
  onDelete?: (task: PersonalTask) => void;
  onToggleComplete?: (task: PersonalTask) => void;
  activeBoard?: Board;
}

function toDateInputValue(dateStr?: string): string {
  if (dateStr) return dateStr;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

function SectionBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground/80">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground/70 font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function PersonalTaskDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultStartTime = "09:00",
  task,
  onSaved,
  onDelete,
  onToggleComplete,
  activeBoard,
}: PersonalTaskDialogProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [date, setDate] = useState(
    task?.date ?? toDateInputValue(defaultDate),
  );
  const [startTime, setStartTime] = useState(
    task?.startTime ?? defaultStartTime,
  );
  const [endTime, setEndTime] = useState(task?.endTime ?? "10:00");
  const [priority, setPriority] = useState<Priority>(
    task?.priority ?? "medium",
  );
  const [completed, setCompleted] = useState(task?.completed ?? false);
  const [comment, setComment] = useState(task?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.date);
      setStartTime(task.startTime);
      setEndTime(task.endTime);
      setPriority(task.priority);
      setCompleted(task.completed);
      setComment(task.comment ?? "");
    } else {
      setTitle("");
      setDate(toDateInputValue(defaultDate));
      setStartTime(defaultStartTime);
      setEndTime("10:00");
      setPriority("medium");
      setCompleted(false);
      setComment("");
    }
    setErrors({});
  }, [task, open, defaultDate, defaultStartTime]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Название обязательно";
    if (!startTime) newErrors.startTime = "Время начала обязательно";
    if (!endTime) newErrors.endTime = "Время конца обязательно";
    if (startTime && endTime && startTime >= endTime)
      newErrors.endTime = "Время конца должно быть позже начала";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      if (isEditing && task) {
        const res = await fetch("/api/personal-tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            title: title.trim(),
            date,
            startTime,
            endTime,
            priority,
            completed,
            comment: comment.trim() || undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка сохранения задачи");
          return;
        }

        const updated: PersonalTask = await res.json();
        onSaved(updated);
        toast.success("Задача обновлена");
      } else {
        const ownerId = auth?.currentUser?.uid || null;
        const res = await fetch("/api/personal-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            date,
            startTime,
            endTime,
            priority,
            comment: comment.trim() || undefined,
            ownerId: ownerId || undefined,
            boardId: activeBoard?.id || undefined,
          }),
        });

        if (res.status === 503) {
          toast.error("База данных недоступна");
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка создания задачи");
          return;
        }

        const created: PersonalTask = await res.json();
        onSaved(created);
        toast.success("Задача создана");
      }

      onOpenChange(false);
    } catch {
      toast.error("Ошибка сохранения задачи");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b bg-muted/20">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <GripHorizontal className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  {isEditing ? "Редактировать задачу" : "Создать задачу"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 text-muted-foreground/60">
                  {isEditing
                    ? "Измените поля задачи"
                    : "Заполните поля для новой задачи"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <SectionBlock icon={Tag} title="Основное">
            <FieldRow label="Название">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название задачи"
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </FieldRow>
          </SectionBlock>

          <SectionBlock icon={Clock} title="Время">
            <div className="grid grid-cols-3 gap-3">
              <FieldRow label="Дата">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FieldRow>
              <FieldRow label="Начало">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  aria-invalid={!!errors.startTime}
                />
                {errors.startTime && (
                  <p className="text-xs text-destructive">{errors.startTime}</p>
                )}
              </FieldRow>
              <FieldRow label="Конец">
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  aria-invalid={!!errors.endTime}
                />
                {errors.endTime && (
                  <p className="text-xs text-destructive">{errors.endTime}</p>
                )}
              </FieldRow>
            </div>
          </SectionBlock>

          <SectionBlock icon={ArrowUpDown} title="Детали">
            <FieldRow label="Приоритет">
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="комментарий к задаче"
              className="min-h-[56px] resize-none"
            />
          </SectionBlock>

          {isEditing && (
            <SectionBlock icon={CheckCircle2} title="Статус">
              <button
                onClick={() => {
                  if (onToggleComplete && task) {
                    onToggleComplete(task);
                  }
                  setCompleted(!completed);
                }}
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-md hover:bg-accent/50 -ml-1 w-fit"
              >
                {completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span>
                  {completed ? "Задача выполнена" : "Отметить как выполненную"}
                </span>
              </button>
            </SectionBlock>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 m-0 rounded-b-xl gap-3">
          <div className="flex items-center gap-2 flex-1">
            {isEditing && onDelete && task && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast("Удалить задачу?", {
                    action: {
                      label: "Удалить",
                      onClick: () => {
                        onDelete(task);
                        onOpenChange(false);
                        toast.success("Задача удалена");
                      },
                    },
                    cancel: {
                      label: "Отмена",
                      onClick: () => {},
                    },
                  });
                }}
                disabled={saving}
                className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="min-w-[100px]"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
