"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Clock,
  ListChecks,
  Bell,
  Target,
  FileText,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const FREQUENCY_OPTIONS: { value: HabitFrequencyType; label: string; desc: string }[] = [
  { value: "daily", label: "Ежедневно", desc: "Каждый день без пропусков" },
  { value: "weekly", label: "По дням недели", desc: "Выбранные дни" },
  { value: "scheduled", label: "Каждые N дней", desc: "С заданным интервалом" },
  { value: "time", label: "В определённое время", desc: "Фиксированное время" },
];

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const COMPLEXITY_LIST: { value: HabitComplexity; label: string; color: string }[] = [
  { value: "easy", label: "Лёгкая", color: "bg-emerald-500" },
  { value: "medium", label: "Средняя", color: "bg-amber-500" },
  { value: "hard", label: "Сложная", color: "bg-red-500" },
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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/60 tracking-wide uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}

function GlassSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-br from-white/40 to-white/5 dark:from-white/5 dark:to-white/[0.02] backdrop-blur-xl p-4 space-y-3 shadow-lg shadow-black/[0.02] dark:shadow-black/10">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
      <div className="flex items-center gap-2.5 relative">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-foreground/80">{title}</span>
      </div>
      <div className="relative space-y-2.5">
        {children}
      </div>
    </div>
  );
}

export function HabitDialog({ open, onOpenChange, habit, onSave }: HabitDialogProps) {
  const isEditing = !!habit;

  const [name, setName] = useState("");
  const [category, setCategory] = useState<HabitCategory>("health");
  const [customCategory, setCustomCategory] = useState("");
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
      setCustomCategory(habit.customCategory ?? "");
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
      setCustomCategory("");
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
      ...(category === "other" && customCategory.trim() ? { customCategory: customCategory.trim() } : {}),
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

  const selectedComplexity = COMPLEXITY_LIST.find((c) => c.value === complexity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl gap-0 overflow-hidden p-0 border-0 bg-gradient-to-br from-background via-primary/[0.02] to-background"
      >
        <div className="relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <div className="px-7 pt-6 pb-5 border-b border-white/10 dark:border-white/5">
              <DialogHeader className="p-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 text-primary shadow-lg shadow-primary/10 ring-1 ring-white/20 dark:ring-white/10">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      {isEditing ? "Редактировать привычку" : "Новая привычка"}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-0.5 text-foreground/40">
                      {isEditing
                        ? "Измените параметры привычки"
                        : "Создайте привычку, которая изменит вашу жизнь"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Body */}
            <div className="px-7 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Name */}
              <GlassSection icon={Sparkles} title="Что вы хотите выработать?">
                <FieldRow label="Название">
                  <div className="relative">
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Например: Утренняя зарядка"
                      aria-invalid={!!errors.name}
                      className={cn(
                        "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                        "placeholder:text-foreground/30",
                        "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                        errors.name && "ring-2 ring-destructive/30 border-destructive/30",
                      )}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive/80 mt-1 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                </FieldRow>
              </GlassSection>

              {/* Category & Complexity row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassSection icon={ListChecks} title="Категория">
                  <FieldRow label="Тип">
                    <Select
                      value={category}
                      onValueChange={(v) => setCategory(v as HabitCategory)}
                    >
                      <SelectTrigger className={cn(
                        "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                        "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-white/10 bg-background/80 backdrop-blur-2xl">
                        {HABIT_CATEGORIES.map(({ value, label }) => (
                          <SelectItem key={value} value={value} className="rounded-lg">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                  {category === "other" && (
                    <FieldRow label="Своя категория">
                      <Input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Введите название категории"
                        className={cn(
                          "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                          "placeholder:text-foreground/30",
                          "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                        )}
                      />
                    </FieldRow>
                  )}
                </GlassSection>

                <GlassSection icon={Target} title="Сложность">
                  <FieldRow label="Уровень">
                    <div className="flex gap-2">
                      {COMPLEXITY_LIST.map(({ value, label, color }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setComplexity(value)}
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-3 transition-all duration-200",
                            "border",
                            complexity === value
                              ? "border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 shadow-lg shadow-primary/5"
                              : "border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-white/[0.06]",
                          )}
                        >
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            color,
                            complexity === value && "ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                          )} />
                          <span className={cn(
                            "text-xs font-medium",
                            complexity === value ? "text-primary" : "text-foreground/50",
                          )}>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FieldRow>
                </GlassSection>
              </div>

              {/* Schedule */}
              <GlassSection icon={Clock} title="Расписание">
                <FieldRow label="Частота">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FREQUENCY_OPTIONS.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFrequencyType(value)}
                        className={cn(
                          "rounded-xl p-3 text-left transition-all duration-200 border",
                          frequencyType === value
                            ? "border-primary/30 bg-gradient-to-b from-primary/10 to-primary/5 shadow-lg shadow-primary/5"
                            : "border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-white/[0.06]",
                        )}
                      >
                        <div className="text-xs font-semibold mb-0.5">{label}</div>
                        <div className="text-[10px] text-foreground/40 leading-tight">{desc}</div>
                      </button>
                    ))}
                  </div>
                </FieldRow>

                {frequencyType === "weekly" && (
                  <FieldRow label="Дни недели">
                    <div className="flex gap-1.5 flex-wrap">
                      {DAY_LABELS.map((label, i) => {
                        const active = daysOfWeek.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleDay(i)}
                            className={cn(
                              "h-9 w-9 rounded-full text-xs font-medium transition-all duration-200",
                              active
                                ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                : "bg-white/40 dark:bg-white/[0.04] text-foreground/50 hover:text-foreground hover:bg-white/60 dark:hover:bg-white/[0.06] border border-white/20 dark:border-white/10",
                            )}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.daysOfWeek && (
                      <p className="text-xs text-destructive/80 mt-1 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                        {errors.daysOfWeek}
                      </p>
                    )}
                  </FieldRow>
                )}

                {frequencyType === "scheduled" && (
                  <FieldRow label="Интервал (дни)">
                    <div className="relative max-w-[160px]">
                      <Input
                        type="number"
                        min={1}
                        value={intervalDays}
                        onChange={(e) => setIntervalDays(Number(e.target.value))}
                        aria-invalid={!!errors.intervalDays}
                        className={cn(
                          "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                          "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                        )}
                      />
                    </div>
                    {errors.intervalDays && (
                      <p className="text-xs text-destructive/80 mt-1 flex items-center gap-1">
                        <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
                        {errors.intervalDays}
                      </p>
                    )}
                  </FieldRow>
                )}

                {frequencyType === "time" && (
                  <FieldRow label="Время">
                    <div className="relative max-w-[160px]">
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className={cn(
                          "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                          "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                        )}
                      />
                    </div>
                  </FieldRow>
                )}
              </GlassSection>

              {/* Details */}
              <GlassSection icon={FileText} title="Дополнительно">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FieldRow label="Время на выполнение (мин)">
                    <Input
                      type="number"
                      min={0}
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(Number(e.target.value))}
                      className={cn(
                        "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                        "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                      )}
                    />
                  </FieldRow>
                  <FieldRow label="Цель">
                    <Input
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Например: 30 дней подряд"
                      className={cn(
                        "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                        "placeholder:text-foreground/30",
                        "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                      )}
                    />
                  </FieldRow>
                </div>
                <FieldRow label="Заметка">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Любые дополнительные заметки о привычке"
                    className={cn(
                      "min-h-[60px] resize-none rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                      "placeholder:text-foreground/30",
                      "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                    )}
                  />
                </FieldRow>
              </GlassSection>

              {/* Reminder */}
              <div className={cn(
                "rounded-2xl border p-4 transition-all duration-300",
                reminder
                  ? "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5"
                  : "border-white/10 dark:border-white/5 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300",
                      reminder
                        ? "bg-gradient-to-br from-primary/30 to-primary/10 text-primary"
                        : "bg-white/20 dark:bg-white/[0.04] text-foreground/30",
                    )}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Напоминание</Label>
                      <p className="text-xs text-foreground/40">Получать уведомление о привычке</p>
                    </div>
                  </div>
                  <Switch
                    checked={reminder}
                    onCheckedChange={setReminder}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                {reminder && (
                  <div className="mt-3 pt-3 border-t border-white/10 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                    <FieldRow label="Время напоминания">
                      <div className="relative max-w-[160px]">
                        <Input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className={cn(
                            "h-10 rounded-xl border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/[0.04] backdrop-blur-sm",
                            "focus-visible:ring-primary/30 focus-visible:border-primary/30",
                          )}
                        />
                      </div>
                    </FieldRow>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="px-7 py-4 border-t border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/[0.02] backdrop-blur-sm gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-foreground/60 hover:text-foreground hover:bg-white/40 dark:hover:bg-white/[0.06]"
              >
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!name.trim()}
                className={cn(
                  "min-w-[120px] rounded-xl bg-gradient-to-r from-primary to-primary/80",
                  "hover:from-primary/90 hover:to-primary/70",
                  "shadow-lg shadow-primary/20",
                  "text-primary-foreground font-semibold",
                  "transition-all duration-200",
                  "disabled:opacity-40 disabled:shadow-none",
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isEditing ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
