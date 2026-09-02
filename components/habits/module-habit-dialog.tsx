"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Target,
  Clock,
  Tag,
  CheckSquare,
  FileText,
} from "lucide-react";
import type {
  Habit,
  HabitCategory,
  HabitFrequencyType,
  HabitDifficulty,
} from "@/lib/habit-types";
import { DIFFICULTY_LABELS, WEEKDAYS } from "@/lib/habit-types";
import { CATEGORY_ICONS, CATEGORY_ACCENTS } from "@/lib/habit-category-ui";
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
    <div className="space-y-3 rounded-xl border bg-gradient-to-b from-muted/40 to-muted/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
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
  const [customCategory, setCustomCategory] = useState(
    habit?.customCategory ?? "",
  );
  const [difficulty, setDifficulty] = useState<HabitDifficulty>(
    habit?.difficulty ?? "medium",
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
      setCustomCategory(habit.customCategory ?? "");
      setDifficulty(habit.difficulty);
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
      setCustomCategory("");
      setDifficulty("medium");
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
      customCategory: customCategory.trim() || undefined,
      difficulty,
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
        <div className="relative px-6 pt-6 pb-5 border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <DialogHeader className="p-0 relative">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 shrink-0">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  {isEditing ? "Редактировать привычку" : "Новая привычка"}
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5 text-muted-foreground/70">
                  {isEditing
                    ? "Настройте параметры привычки"
                    : "Создайте привычку и начните свой путь"}
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
              <div className="grid grid-cols-3 gap-2">
                {CATEGORY_OPTIONS.map(({ value, label }) => {
                  const Icon = CATEGORY_ICONS[value];
                  const accent = CATEGORY_ACCENTS[value];
                  const selected = category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 transition-all",
                        selected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          accent.soft,
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={cn(
                          "text-[11px] font-medium text-center leading-tight",
                          selected
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {category === "other" && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Укажите свою категорию"
                  maxLength={50}
                  className="mt-2"
                  aria-invalid={!!errors.customCategory}
                />
              )}
              {errors.customCategory && (
                <p className="text-xs text-destructive">
                  {errors.customCategory}
                </p>
              )}
            </FieldRow>
            <FieldRow label="Сложность">
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as HabitDifficulty)}
              >
                <SelectTrigger>
                  <SelectValue>{DIFFICULTY_LABELS[difficulty]}</SelectValue>
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
          </SectionBlock>

          <SectionBlock icon={Clock} title="Частота">
            <FieldRow label="Тип">
              <Select
                value={frequencyType}
                onValueChange={(v) => setFrequencyType(v as HabitFrequencyType)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {
                      FREQUENCY_OPTIONS.find((o) => o.value === frequencyType)
                        ?.label
                    }
                  </SelectValue>
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
                      <SelectValue>
                        {goalType === "streak" ? "Стрик" : "Количество"}
                      </SelectValue>
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
                      <SelectValue>
                        {goalPeriod === "month" ? "Месяц" : "Всё время"}
                      </SelectValue>
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
