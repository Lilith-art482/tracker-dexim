"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Archive,
  ListChecks,
  Filter,
  Trophy,
  Flame,
  Loader2,
  ChevronDown,
} from "lucide-react";
import type { Habit, HabitCategory, HabitFrequencyType, HabitStatus } from "@/lib/habit-types";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  DIFFICULTY_LABELS,
  WEEKDAYS,
} from "@/lib/habit-types";
import { calculateStreak, calculateCompletionPercentage } from "@/lib/habit-utils";
import { useHabits } from "@/components/habits/habits-context";
import { HabitDialog } from "@/components/habits/module-habit-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_FILTERS: { value: HabitCategory | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value: value as HabitCategory,
    label,
  })),
];

const STATUS_FILTERS: { value: HabitStatus | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
  { value: "archived", label: "Архив" },
];

const FREQUENCY_FILTERS: { value: HabitFrequencyType | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "daily", label: "Ежедневно" },
  { value: "weekly", label: "По дням" },
  { value: "interval", label: "С интервалом" },
  { value: "time", label: "По времени" },
];

function getFrequencyLabel(habit: Habit): string {
  switch (habit.frequencyType) {
    case "daily":
      return "Ежедневно";
    case "weekly":
      return habit.frequencyDays
        ? habit.frequencyDays.map((d) => WEEKDAYS[d]).join(", ")
        : "По дням";
    case "interval":
      return `Каждые ${habit.frequencyInterval} дн.`;
    case "time":
      return `В ${habit.frequencyTime || "—"}`;
    default:
      return "—";
  }
}

export function ModuleMyHabits() {
  const { habits, logs, loading, updateHabit, deleteHabit, cloneHabit, refresh } = useHabits();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<HabitStatus | "all">("all");
  const [frequencyFilter, setFrequencyFilter] = useState<HabitFrequencyType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (categoryFilter !== "all" && h.category !== categoryFilter) return false;
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      if (frequencyFilter !== "all" && h.frequencyType !== frequencyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!h.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [habits, categoryFilter, statusFilter, frequencyFilter, searchQuery]);

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingHabit(null);
    setDialogOpen(true);
  };

  const handleSaved = (_habit: Habit) => {
    refresh();
  };

  const handleDelete = async (habit: Habit) => {
    toast("Удалить привычку?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          await deleteHabit(habit.id);
          toast.success("Привычка удалена");
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const handleArchive = async (habit: Habit) => {
    await updateHabit(habit.id, { status: "archived" });
    toast.success("Привычка архивирована");
  };

  const handleClone = async (habit: Habit) => {
    await cloneHabit(habit.id);
    toast.success("Привычка скопирована");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Мои привычки</h3>
        <Button size="sm" onClick={handleAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            type="search"
            placeholder="Поиск привычек"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          Фильтры
          <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
        </button>

        {showFilters && (
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              {CATEGORY_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCategoryFilter(value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    categoryFilter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex flex-wrap gap-1">
              {FREQUENCY_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFrequencyFilter(value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    frequencyFilter === value
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredHabits.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ListChecks className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {habits.length === 0
              ? "У вас ещё нет привычек"
              : "Нет привычек, соответствующих фильтрам"}
          </p>
          {habits.length === 0 && (
            <Button size="sm" onClick={handleAdd} variant="outline" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Создать первую привычку
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHabits.map((habit) => {
            const streak = calculateStreak(habit.id, logs);
            const completion = calculateCompletionPercentage(habit.id, logs, 30);
            return (
              <Card key={habit.id} size="sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0",
                          CATEGORY_COLORS[habit.category].replace("text-", "bg-"),
                        )}
                      />
                      <CardTitle className="text-sm truncate">
                        {habit.name}
                      </CardTitle>
                    </div>
                    <CardAction>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleEdit(habit)}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Редактировать"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleClone(habit)}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Копировать"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {habit.status === "active" && (
                          <button
                            onClick={() => handleArchive(habit)}
                            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="Архивировать"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(habit)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </CardAction>
                  </div>
                  <CardDescription className="text-xs">
                    {CATEGORY_LABELS[habit.category]} · {getFrequencyLabel(habit)}
                    {habit.difficulty !== "medium" && ` · ${DIFFICULTY_LABELS[habit.difficulty]}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium tabular-nums">
                        {streak} дн.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Trophy className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium tabular-nums">
                        {completion}%
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      {habit.status === "active"
                        ? "Активна"
                        : habit.status === "completed"
                          ? "Завершена"
                          : "В архиве"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editingHabit}
        onSaved={handleSaved}
      />
    </div>
  );
}