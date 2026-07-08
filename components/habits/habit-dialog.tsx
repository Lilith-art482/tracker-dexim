"use client";

import { useState, useEffect } from "react";
import { Tag, Clock, GripHorizontal, ListChecks } from "lucide-react";
import type {
  Habit,
  HabitCategory,
  HabitFrequencyType,
  HabitComplexity,
} from "@/lib/habits-types";
import { HABIT_CATEGORIES } from "@/lib/habits-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const FREQUENCY_OPTIONS: { value: HabitFrequencyType; label: string }[] = [
  { value: "daily", label: "Ежедневно" },
  { value: "weekly", label: "По дням недели" },
  { value: "scheduled", label: "Каждые N дней" },
  { value: "time", label: "В определённое время" },
];

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const COMPLEXITY_LIST: { value: HabitComplexity; label: string }[] = [
  { value: "easy", label: "Лёгкая" },
  { value: "medium", label: "Средняя" },
  { value: "hard", label: "Сложная" },
];

function genId(): string {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit | null;
  onSave: (habit: Habit) => void;
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

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  onSave,
}: HabitDialogProps) {
  const isEditing = !!habit;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("health");
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [intervalDays, setIntervalDays] = useState(2);
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [complexity, setComplexity] = useState<HabitComplexity>("medium");
  const [timeMinutes, setTimeMinutes] = useState(15);
  const [goal, setGoal] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategory(habit.category);
      setFrequencyType(habit.frequency.type);
      setDaysOfWeek(habit.frequency.daysOfWeek ?? [1, 3, 5]);
      setIntervalDays(habit.frequency.intervalDays ?? 2);
      setScheduledTime(habit.frequency.scheduledTime ?? "08:00");
      setReminder(habit.reminder);
      setReminderTime(habit.reminderTime ?? "08:00");
      setComplexity(habit.complexity);
      setTimeMinutes(habit.timeMinutes ?? 15);
      setGoal(habit.goal ?? "");
      setNote(habit.note ?? "");
    } else {
      setName("");
      setCategory("health");
      setFrequencyType("daily");
      setDaysOfWeek([1, 3, 5]);
      setIntervalDays(2);
      setScheduledTime("08:00");
      setReminder(false);
      setReminderTime("08:00");
      setComplexity("medium");
      setTimeMinutes(15);
      setGoal("");
      setNote("");
    }
    setErrors({});
  }, [habit, open]);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Название обязательно";
    if (frequencyType === "weekly" && daysOfWeek.length === 0)
      newErrors.daysOfWeek = "Выберите хотя бы один день";
    if (frequencyType === "scheduled" && (!intervalDays || intervalDays < 1))
      newErrors.intervalDays = "Укажите интервал (минимум 1)";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const now = new Date().toISOString();

    const updated: Habit = {
      id: habit?.id ?? genId(),
      name: name.trim(),
      category,
      frequency: {
        type: frequencyType,
        ...(frequencyType === "weekly" ? { daysOfWeek } : {}),
        ...(frequencyType === "scheduled" ? { intervalDays } : {}),
        ...(frequencyType === "time" ? { scheduledTime } : {}),
      },
      reminder,
      ...(reminder ? { reminderTime } : {}),
      complexity,
      ...(timeMinutes > 0 ? { timeMinutes } : {}),
      ...(goal.trim() ? { goal: goal.trim() } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      status: "active",
      createdAt: habit?.createdAt ?? now,
      updatedAt: now,
    };

    onSave(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b bg-muted/20">
          <DialogHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <GripHorizontal className="h-4 w-4" />
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
                  {HABIT_CATEGORIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </SectionBlock>

          <SectionBlock icon={Clock} title="Расписание">
            <FieldRow label="Частота">
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
                <div className="flex gap-1 flex-wrap">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                        daysOfWeek.includes(i)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {errors.daysOfWeek && (
                  <p className="text-xs text-destructive">
                    {errors.daysOfWeek}
                  </p>
                )}
              </FieldRow>
            )}

            {frequencyType === "scheduled" && (
              <FieldRow label="Каждые N дней">
                <Input
                  type="number"
                  min={1}
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  aria-invalid={!!errors.intervalDays}
                />
                {errors.intervalDays && (
                  <p className="text-xs text-destructive">
                    {errors.intervalDays}
                  </p>
                )}
              </FieldRow>
            )}

            {frequencyType === "time" && (
              <FieldRow label="Время">
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </FieldRow>
            )}
          </SectionBlock>

          <SectionBlock icon={ListChecks} title="Детали">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Сложность">
                <Select
                  value={complexity}
                  onValueChange={(v) => setComplexity(v as HabitComplexity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLEXITY_LIST.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>
              <FieldRow label="Время (мин)">
                <Input
                  type="number"
                  min={0}
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(Number(e.target.value))}
                />
              </FieldRow>
            </div>
            <FieldRow label="Цель">
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Например: 30 дней подряд"
              />
            </FieldRow>
            <FieldRow label="Заметка">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Дополнительные заметки"
                className="min-h-[56px] resize-none"
              />
            </FieldRow>
          </SectionBlock>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Напоминание</Label>
              <p className="text-xs text-muted-foreground">
                Получать уведомление о привычке
              </p>
            </div>
            <Switch checked={reminder} onCheckedChange={setReminder} />
          </div>

          {reminder && (
            <FieldRow label="Время напоминания">
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </FieldRow>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/10 m-0 rounded-b-xl gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="min-w-[100px]"
          >
            {isEditing ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
