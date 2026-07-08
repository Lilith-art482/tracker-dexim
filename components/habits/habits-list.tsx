"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Dumbbell,
  BookOpen,
  Brain,
  DollarSign,
  Users,
  Briefcase,
  MoreHorizontal,
  ListChecks,
  RotateCcw,
  Archive,
  Sparkles,
} from "lucide-react";
import type { Habit, HabitCategory, HabitStatus } from "@/lib/habits-types";
import {
  COMPLEXITY_LABELS,
  getCategoryLabel,
} from "@/lib/habits-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HabitDialog } from "./habit-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<HabitCategory, typeof Dumbbell> = {
  health: Dumbbell,
  work: Briefcase,
  education: BookOpen,
  finance: DollarSign,
  relationships: Users,
  "self-development": Brain,
  other: MoreHorizontal,
};

const STATUS_OPTIONS: { value: HabitStatus; label: string; icon: typeof ListChecks }[] = [
  { value: "active", label: "Активные", icon: RotateCcw },
  { value: "completed", label: "Завершённые", icon: ListChecks },
  { value: "archived", label: "Архив", icon: Archive },
];

function frequencyLabel(habit: Habit): string {
  switch (habit.frequency.type) {
    case "daily":
      return "Ежедневно";
    case "weekly": {
      const days = habit.frequency.daysOfWeek
        ?.map((d) => ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][d])
        .join(", ");
      return days ? `По ${days}` : "Еженедельно";
    }
    case "scheduled":
      return `Каждые ${habit.frequency.intervalDays} дн.`;
    case "time":
      return habit.frequency.scheduledTime
        ? `В ${habit.frequency.scheduledTime}`
        : "По времени";
    default:
      return "";
  }
}

interface HabitsListProps {
  habits: Habit[];
  onAdd: (habit: Habit) => void;
  onUpdate: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export function HabitsList({ habits, onAdd, onUpdate, onDelete }: HabitsListProps) {
  const [statusFilter, setStatusFilter] = useState<HabitStatus>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const filtered = habits.filter((h) => h.status === statusFilter);

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingHabit(null);
  };

  const handleSave = (habit: Habit) => {
    if (editingHabit) {
      onUpdate(habit);
    } else {
      onAdd(habit);
    }
    handleDialogClose();
  };

  const handleDelete = (habit: Habit) => {
    toast("Удалить привычку?", {
      action: {
        label: "Удалить",
        onClick: () => {
          onDelete(habit.id);
          toast.success("Привычка удалена");
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  statusFilter === opt.value
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Добавить
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/5 to-transparent">
              <ListChecks className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
          </div>
          <p className="text-sm font-medium">
            {statusFilter === "active"
              ? "Нет активных привычек"
              : statusFilter === "completed"
                ? "Нет завершённых привычек"
                : "Архив пуст"}
          </p>
          {statusFilter === "active" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="rounded-xl border-white/20 dark:border-white/10"
            >
              <Plus className="h-4 w-4" />
              Добавить привычку
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((habit) => {
            const Icon = CATEGORY_ICONS[habit.category];
            return (
              <Card
                key={habit.id}
                className="group relative overflow-hidden border border-white/10 dark:border-white/5 bg-gradient-to-br from-white/40 to-white/5 dark:from-white/5 dark:to-white/[0.02] backdrop-blur-sm hover:shadow-lg hover:shadow-black/[0.02] dark:hover:shadow-black/5 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardContent className="p-3 sm:p-4 relative">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 text-primary shrink-0 ring-1 ring-primary/10">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-foreground/90">
                        {habit.name}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {getCategoryLabel(habit)}
                        {` · ${COMPLEXITY_LABELS[habit.complexity]}`}
                        {` · ${frequencyLabel(habit)}`}
                        {habit.goal && ` · ${habit.goal}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-white/40 dark:hover:bg-white/[0.06]"
                        onClick={() => handleEdit(habit)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/5"
                        onClick={() => handleDelete(habit)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <HabitDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        habit={editingHabit}
        onSave={handleSave}
      />
    </div>
  );
}
