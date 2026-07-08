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
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <ListChecks className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm">
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
              <Card key={habit.id} className="card-hover">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{habit.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryLabel(habit)}
                        {` · ${COMPLEXITY_LABELS[habit.complexity]}`}
                        {` · ${frequencyLabel(habit)}`}
                        {habit.goal && ` · ${habit.goal}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(habit)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive/70 hover:text-destructive"
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
