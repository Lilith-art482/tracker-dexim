"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Circle, Trash2 } from "lucide-react";
import type { PersonalTask, Priority } from "@/lib/models";
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
  boardId: string;
  defaultDayOfWeek?: number;
  defaultStartTime?: string;
  task?: PersonalTask | null;
  onSaved: (task: PersonalTask) => void;
  onDelete?: (task: PersonalTask) => void;
  onToggleComplete?: (task: PersonalTask) => void;
}

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export function PersonalTaskDialog({
  open,
  onOpenChange,
  boardId,
  defaultDayOfWeek = 0,
  defaultStartTime,
  task,
  onSaved,
  onDelete,
  onToggleComplete,
}: PersonalTaskDialogProps) {
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(
    task?.dayOfWeek ?? defaultDayOfWeek,
  );
  const [startTime, setStartTime] = useState(
    task?.startTime ?? "09:00",
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
      setDayOfWeek(task.dayOfWeek);
      setStartTime(task.startTime);
      setEndTime(task.endTime);
      setPriority(task.priority);
      setCompleted(task.completed);
      setComment(task.comment ?? "");
    } else {
      setTitle("");
      setDayOfWeek(defaultDayOfWeek);
      setStartTime("09:00");
      setEndTime("10:00");
      setPriority("medium");
      setCompleted(false);
      setComment("");
    }
    setErrors({});
  }, [task, open, defaultDayOfWeek]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Название обязательно";
    if (!startTime) newErrors.startTime = "Время начала обязательно";
    if (!endTime) newErrors.endTime = "Время конца обязательно";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onOpenChange(false);
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
            dayOfWeek,
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
      } else {
        const ownerId = auth.currentUser?.uid || null;
        const res = await fetch("/api/personal-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId,
            title: title.trim(),
            dayOfWeek,
            startTime,
            endTime,
            priority,
            comment: comment.trim() || undefined,
            ownerId: ownerId || undefined,
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
      }
    } catch {
      toast.error("Ошибка сохранения задачи");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Редактировать задачу" : "Создать задачу"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Измените поля задачи"
              : "Заполните поля для новой задачи"}
          </DialogDescription>
        </DialogHeader>

        {isEditing && (
          <button
            onClick={(e) => {
              e.preventDefault();
              if (onToggleComplete && task) {
                onToggleComplete(task);
              } else {
                setCompleted(!completed);
              }
            }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {completed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
            <span>
              {completed ? "Задача выполнена" : "Отметить как выполненную"}
            </span>
          </button>
        )}

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pt-title" className="text-sm font-medium">
              Название
            </Label>
            <Input
              id="pt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pt-day" className="text-sm font-medium">
              День недели
            </Label>
            <Select
              value={String(dayOfWeek)}
              onValueChange={(v) => setDayOfWeek(Number(v))}
            >
              <SelectTrigger id="pt-day">{DAY_NAMES[dayOfWeek]}</SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pt-start" className="text-sm font-medium">
                Время начала
              </Label>
              <Input
                id="pt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-invalid={!!errors.startTime}
              />
              {errors.startTime && (
                <p className="text-xs text-destructive">{errors.startTime}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pt-end" className="text-sm font-medium">
                Время конца
              </Label>
              <Input
                id="pt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={!!errors.endTime}
              />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pt-priority" className="text-sm font-medium">
              Приоритет
            </Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger id="pt-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pt-comment" className="text-sm font-medium">
              Комментарий
            </Label>
            <Textarea
              id="pt-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий к задаче"
              className="min-h-[60px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {isEditing && onDelete && task && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(task);
                  onOpenChange(false);
                }}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
