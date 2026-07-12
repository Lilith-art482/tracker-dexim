"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Target,
  Clock,
  Tag,
  CheckSquare,
  Bell,
  FileText,
} from "lucide-react";
import type {
  Habit,
  HabitCategory,
  HabitFrequencyType,
  HabitDifficulty,
} from "@/lib/habit-types";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  WEEKDAYS,
} from "@/lib/habit-types";
import { createHabitSchema } from "@/lib/habit-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS: { value: HabitCategory; label: string }[] = [
  { value: "health", label: "Здоровье" },
  { value: "work", label: "Работа" },
  { value: "education", label: "Образование" },
  { value: "finance", label: "Финансы" },
  { value: "relationships", label: "Отношения" },
  { value: "self-development", label: "Саморазвитие" },
  { value: "other", label: "Другое" },
];

const FREQUENCY_OPTIONS: { value: HabitFrequencyType; label: string }[] = [
  { value: "daily", label: "Ежедневно" },
  { value: "weekly", label: "По дням недели" },
  { value: "interval", label: "Каждые N дней" },
  { value: "time", label: "По времени" },
];

const DIFFICULTY_OPTIONS: { value: HabitDifficulty; label: string }[] = [
  { value: "easy", label: "Лёгкая" },
  { value: "medium", label: "Средняя" },
  { value: "hard", label: "Сложная" },
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

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  onSaved: (habit: Habit) => void;
}

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  onSaved,
}: HabitDialogProps) {
  const isEditing = !!habit;

  const [name, setName] = useState(habit?.name ?? "");
  const [category, setCategory] = useState<HabitCategory>(
    habit?.category ?? "health",
  );
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(
    habit?.frequencyType ?? "daily",
  );
  const [frequencyDays, setFrequencyDays] = useState<number[]>(
    habit?.frequencyDays ?? [],
  );
  const [frequencyInterval, setFrequencyInterval] = useState<number>(
    habit?.frequencyInterval ?? 1,
  );
  const [frequencyTime, setFrequencyTime] = useState(
    habit?.frequencyTime ?? "",
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    habit?.reminderEnabled ?? false,
  );
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? "");
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(
    habit?.difficulty ?? "medium",
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    habit?.durationMinutes ?? 0,
  );
  const [goal, setGoal] = useState(habit?.goal ?? "");
  const [goalType, setGoalType] = useState<"streak" | "count">(
    habit?.goalType ?? "streak",
  );
  const [goalValue, setGoalValue] = useState<number>(habit?.goalValue ?? 0);
  const [goalPeriod, setGoalPeriod] = useState<"month" | "all">(
    habit?.goalPeriod ?? "all",
  );
  const [note, setNote] = useState(habit?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category);
      setFrequencyType(habit.frequencyType);
      setFrequencyDays(habit.frequencyDays ?? []);
      setFrequencyInterval(habit.frequencyInterval ?? 1);
      setFrequencyTime(habit.frequencyTime ?? "");
      setReminderEnabled(habit.reminderEnabled);
      setReminderTime(habit.reminderTime ?? "");
      setDifficulty(habit.difficulty);
      setDurationMinutes(habit.durationMinutes ?? 0);
      setGoal(habit.goal ?? "");
      setGoalType(habit.goalType ?? "streak");
      setGoalValue(habit.goalValue ?? 0);
      setGoalPeriod(habit.goalPeriod ?? "all");
      setNote(habit.note ?? "");
    } else {
      setName("");
      setCategory("health");
      setFrequencyType("daily");
      setFrequencyDays([]);
      setFrequencyInterval(1);
      setFrequencyTime("");
      setReminderEnabled(false);
      setReminderTime("");
      setDifficulty("medium");
      setDurationMinutes(0);
      setGoal("");
      setGoalType("streak");
      setGoalValue(0);
      setGoalPeriod("all");
      setNote("");
    }
    setErrors({});
  }, [habit, open]);

  const toggleDay = (day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async () => {
    const data = {
      name: name.trim(),
      category,
      frequencyType,
      frequencyDays: frequencyType === "weekly" ? frequencyDays : undefined,
      frequencyInterval:
        frequencyType === "interval" ? frequencyInterval : undefined,
      frequencyTime:
        frequencyType === "time" ? frequencyTime || undefined : undefined,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime || undefined : undefined,
      difficulty,
      durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
      goal: goal.trim() || undefined,
      goalType: goal.trim() ? goalType : undefined,
      goalValue: goal.trim() ? goalValue : undefined,
      goalPeriod: goal.trim() ? goalPeriod : undefined,
      note: note.trim() || undefined,
    };

    const parsed = createHabitSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(
        parsed.error.flatten().fieldErrors,
      )) {
        fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
      }
      setErrors(fieldErrors);

      const firstMessage = Object.values(fieldErrors)[0];
      if (firstMessage) toast.error(firstMessage);
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      if (isEditing && habit) {
        const res = await fetch(`/api/habits?id=${habit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка сохранения");
          return;
        }
        const updated: Habit = await res.json();
        onSaved(updated);
        toast.success("Привычка обновлена");
      } else {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...parsed.data, status: "active" }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Ошибка создания");
          return;
        }
        const created: Habit = await res.json();
        onSaved(created);
        toast.success("Привычка создана");
      }
      onOpenChange(false);
    } catch {
      toast.error("Ошибка сохранения привычки");
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
                <CheckSquare className="h-4.5 w-4.5" />
              </div>
              <div>
                <DialogTitle className="text-base">
                  {isEditing ? "Редактировать привычку" : "Новая привычка"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 text-muted-foreground/60">
                  {isEditing
                    ? "Измените параметры привычки"
                    : "Заполните поля для новой привычки"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <SectionBlock icon={Tag} title="Основное">
            <FieldRow label="Название">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название привычки"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </FieldRow>
            <FieldRow label="Категория">
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as HabitCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Сложность">
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as HabitDifficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            {durationMinutes > 0 && (
              <FieldRow label="Длительность (мин)">
                <Input
                  type="number"
                  min={0}
                  max={1440}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                />
              </FieldRow>
            )}
            {!durationMinutes && (
              <FieldRow label="Длительность (мин)">
                <Input
                  type="number"
                  min={0}
                  max={1440}
                  value={durationMinutes || ""}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Не указана"
                />
              </FieldRow>
            )}
          </SectionBlock>

          <SectionBlock icon={Clock} title="Частота">
            <FieldRow label="Тип">
              <Select
                value={frequencyType}
                onValueChange={(v) => setFrequencyType(v as HabitFrequencyType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            {frequencyType === "weekly" && (
              <FieldRow label="Дни недели">
                <div className="flex gap-1">
                  {WEEKDAYS.slice(1).map((dayLabel, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i + 1 === 7 ? 0 : i + 1)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                        frequencyDays.includes(i + 1 === 7 ? 0 : i + 1)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                    >
                      {dayLabel}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => toggleDay(0)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      frequencyDays.includes(0)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80",
                    )}
                  >
                    {WEEKDAYS[0]}
                  </button>
                </div>
              </FieldRow>
            )}

            {frequencyType === "interval" && (
              <FieldRow label="Каждые N дней">
                <Input
                  type="number"
                  min={1}
                  value={frequencyInterval}
                  onChange={(e) => setFrequencyInterval(Number(e.target.value))}
                />
              </FieldRow>
            )}

            {frequencyType === "time" && (
              <FieldRow label="Время выполнения">
                <Input
                  type="time"
                  value={frequencyTime}
                  onChange={(e) => setFrequencyTime(e.target.value)}
                />
              </FieldRow>
            )}
          </SectionBlock>

          <SectionBlock icon={Bell} title="Напоминание">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground/70 font-medium">
                Включить напоминание
              </Label>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={(checked) => setReminderEnabled(checked)}
              />
            </div>
            {reminderEnabled && (
              <FieldRow label="Время напоминания">
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </FieldRow>
            )}
          </SectionBlock>

          <SectionBlock icon={Target} title="Цель">
            <FieldRow label="Описание цели">
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Например: пробежать 100 км"
              />
            </FieldRow>
            {goal.trim() && (
              <div className="grid grid-cols-3 gap-3">
                <FieldRow label="Тип">
                  <Select
                    value={goalType}
                    onValueChange={(v) => setGoalType(v as "streak" | "count")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="streak">Стрик</SelectItem>
                      <SelectItem value="count">Количество</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Значение">
                  <Input
                    type="number"
                    min={1}
                    value={goalValue || ""}
                    onChange={(e) => setGoalValue(Number(e.target.value))}
                  />
                </FieldRow>
                <FieldRow label="Период">
                  <Select
                    value={goalPeriod}
                    onValueChange={(v) => setGoalPeriod(v as "month" | "all")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Месяц</SelectItem>
                      <SelectItem value="all">Всё время</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>
            )}
          </SectionBlock>

          <SectionBlock icon={FileText} title="Заметка">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Дополнительная информация о привычке"
              className="min-h-[56px] resize-none"
            />
          </SectionBlock>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 m-0 rounded-b-xl gap-3">
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
            disabled={saving || !name.trim()}
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
