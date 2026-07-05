"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle2,
  Circle,
  Trash2,
  Tag,
  CalendarDays,
  Clock,
  MessageSquareText,
  GripHorizontal,
  ArrowUpDown,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { useNotifications } from "@/lib/notification-context";

interface PersonalTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDayOfWeek?: number;
  defaultStartTime?: string;
  task?: PersonalTask | null;
  onSaved: (task: PersonalTask) => void;
  onDelete?: (task: PersonalTask) => void;
  onToggleComplete?: (task: PersonalTask) => void;
}

const DAY_NAMES = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

function FieldLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
      <Icon className="h-3 w-3" />
      {children}
    </Label>
  );
}

export function PersonalTaskDialog({
  open,
  onOpenChange,
  defaultDayOfWeek = 0,
  defaultStartTime = "09:00",
  task,
  onSaved,
  onDelete,
  onToggleComplete,
}: PersonalTaskDialogProps) {
  const { addNotification } = useNotifications();
  const isEditing = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [dayOfWeek, setDayOfWeek] = useState(task?.dayOfWeek ?? defaultDayOfWeek);
  const [startTime, setStartTime] = useState(task?.startTime ?? defaultStartTime);
  const [endTime, setEndTime] = useState(task?.endTime ?? "10:00");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
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
      setStartTime(defaultStartTime);
      setEndTime("10:00");
      setPriority("medium");
      setCompleted(false);
      setComment("");
    }
    setErrors({});
  }, [task, open, defaultDayOfWeek, defaultStartTime]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = "Название обязательно";
    if (!startTime) newErrors.startTime = "Время начала обязательно";
    if (!endTime) newErrors.endTime = "Время конца обязательно";
    if (startTime && endTime && startTime >= endTime) newErrors.endTime = "Время конца должно быть позже начала";

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
          addNotification(err.error || "Ошибка сохранения задачи", "error");
          return;
        }

        const updated: PersonalTask = await res.json();
        onSaved(updated);
        addNotification("Задача обновлена", "success");
      } else {
        const ownerId = auth?.currentUser?.uid || null;
        const res = await fetch("/api/personal-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
          addNotification("База данных недоступна", "error");
          return;
        }

        if (!res.ok) {
          const err = await res.json();
          addNotification(err.error || "Ошибка создания задачи", "error");
          return;
        }

        const created: PersonalTask = await res.json();
        onSaved(created);
        addNotification("Задача создана", "success");
      }

      onOpenChange(false);
    } catch {
      addNotification("Ошибка сохранения задачи", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <GripHorizontal className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {isEditing ? "Редактировать задачу" : "Создать задачу"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  {isEditing ? "Измените поля задачи" : "Заполните поля для новой задачи"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <FieldLabel icon={Tag}>Название</FieldLabel>
            <Input
              id="pt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Название задачи"
              aria-invalid={!!errors.title}
              className="h-9"
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <FieldLabel icon={CalendarDays}>День</FieldLabel>
              <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                <SelectTrigger className="h-9">{DAY_NAMES[dayOfWeek]}</SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel icon={Clock}>Начало</FieldLabel>
              <Input
                id="pt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                aria-invalid={!!errors.startTime}
                className="h-9"
              />
              {errors.startTime && (
                <p className="text-xs text-destructive">{errors.startTime}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <FieldLabel icon={Clock}>Конец</FieldLabel>
              <Input
                id="pt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                aria-invalid={!!errors.endTime}
                className="h-9"
              />
              {errors.endTime && (
                <p className="text-xs text-destructive">{errors.endTime}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={ArrowUpDown}>Приоритет</FieldLabel>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <FieldLabel icon={MessageSquareText}>Комментарий</FieldLabel>
            <Textarea
              id="pt-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий к задаче"
              className="min-h-[60px] resize-none"
            />
          </div>

          {isEditing && (
            <>
              <Separator />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (onToggleComplete && task) {
                      onToggleComplete(task);
                    } else {
                      setCompleted(!completed);
                    }
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-accent/50 -ml-2"
                >
                  {completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span>{completed ? "Задача выполнена" : "Отметить как выполненную"}</span>
                </button>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 gap-2">
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
                        addNotification("Задача удалена", "success");
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
          <div className="flex items-center gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
