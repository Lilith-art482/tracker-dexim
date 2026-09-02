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
  X,
  Clock,
} from "lucide-react";
import type {
  Habit,
  HabitCategory,
  HabitFrequencyType,
  HabitStatus,
} from "@/lib/habit-types";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  getCategoryLabel,
} from "@/lib/habit-types";
import {
  CATEGORY_ICONS,
  CATEGORY_ACCENTS,
  getFrequencyLabel,
} from "@/lib/habit-category-ui";
import {
  calculateStreak,
  calculateCompletionPercentage,
} from "@/lib/habit-utils";
import { useHabits } from "@/components/habits/habits-context";
import { HabitDialog } from "@/components/habits/module-habit-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_FILTERS: { value: HabitStatus | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "completed", label: "Завершённые" },
  { value: "archived", label: "Архив" },
];

const FREQUENCY_FILTERS: {
  value: HabitFrequencyType | "all";
  label: string;
}[] = [
  { value: "all", label: "Все" },
  { value: "daily", label: "Ежедневно" },
  { value: "weekly", label: "По дням" },
  { value: "interval", label: "С интервалом" },
  { value: "time", label: "По времени" },
];

export function ModuleMyHabits() {
  const {
    habits,
    logs,
    loading,
    updateHabit,
    deleteHabit,
    cloneHabit,
    refresh,
  } = useHabits();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<HabitCategory | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<HabitStatus | "all">("all");
  const [frequencyFilter, setFrequencyFilter] = useState<
    HabitFrequencyType | "all"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (categoryFilter !== "all" && h.category !== categoryFilter)
        return false;
      if (statusFilter !== "all" && h.status !== statusFilter) return false;
      if (frequencyFilter !== "all" && h.frequencyType !== frequencyFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!h.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [habits, categoryFilter, statusFilter, frequencyFilter, searchQuery]);

  const activeFilterCount = useMemo(
    () =>
      (categoryFilter !== "all" ? 1 : 0) +
      (statusFilter !== "all" ? 1 : 0) +
      (frequencyFilter !== "all" ? 1 : 0),
    [categoryFilter, statusFilter, frequencyFilter],
  );

  const resetFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setFrequencyFilter("all");
    setSearchQuery("");
  };

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
        <div>
          <h3 className="text-base font-semibold">Мои привычки</h3>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {habits.length > 0
              ? `${filteredHabits.length} из ${habits.length} привычек`
              : "Создайте привычки, чтобы начать"}
          </p>
        </div>
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
            className="h-9 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          Фильтры
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              showFilters && "rotate-180",
            )}
          />
        </button>

        {showFilters && (
          <div className="space-y-3 rounded-xl border bg-muted/30 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                Категория
              </span>
              <button
                onClick={resetFilters}
                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                Сбросить
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategoryFilter("all")}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  categoryFilter === "all"
                    ? "bg-foreground text-background"
                    : "bg-background text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground hover:ring-foreground/25",
                )}
              >
                Все
              </button>
              {(Object.keys(CATEGORY_LABELS) as HabitCategory[]).map(
                (value) => {
                  const Icon = CATEGORY_ICONS[value];
                  const active = categoryFilter === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setCategoryFilter(value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        active
                          ? cn(
                              "ring-1 ring-transparent",
                              CATEGORY_ACCENTS[value].soft,
                            )
                          : "bg-background text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground hover:ring-foreground/25",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {CATEGORY_LABELS[value]}
                    </button>
                  );
                },
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                Статус
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    statusFilter === value
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground hover:ring-foreground/25",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <Separator />

            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">
                Частота
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENCY_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFrequencyFilter(value)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    frequencyFilter === value
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground hover:ring-foreground/25",
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
          {habits.length === 0 ? (
            <Button
              size="sm"
              onClick={handleAdd}
              variant="outline"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Создать первую привычку
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={resetFilters}
              variant="outline"
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Сбросить фильтры
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHabits.map((habit) => {
            const streak = calculateStreak(habit.id, logs);
            const completion = calculateCompletionPercentage(
              habit.id,
              logs,
              30,
            );
            const accent = CATEGORY_ACCENTS[habit.category];
            const CategoryIcon = CATEGORY_ICONS[habit.category];
            return (
              <Card
                key={habit.id}
                size="sm"
                className="group/card relative gap-3 overflow-hidden"
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-70",
                    accent.gradient,
                  )}
                />
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl shrink-0",
                          accent.soft,
                        )}
                      >
                        <CategoryIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <CardTitle className="text-sm truncate leading-tight">
                          {habit.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <span className={cn("font-medium", accent.text)}>
                            {getCategoryLabel(
                              habit.category,
                              habit.customCategory,
                            )}
                          </span>
                          <span className="text-muted-foreground/40">·</span>
                          <Clock className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                          <span className="truncate">
                            {getFrequencyLabel(habit)}
                          </span>
                        </CardDescription>
                      </div>
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
                </CardHeader>
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Flame className="h-3.5 w-3.5 text-orange-500" />
                      Стрик
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {streak} дн.
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Trophy className={cn("h-3.5 w-3.5", accent.text)} />
                      За 30 дней
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {completion}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        accent.solid,
                      )}
                      style={{ width: `${Math.max(completion, 0)}%` }}
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-between bg-transparent pt-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium",
                      habit.status === "active" &&
                        "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
                      habit.status === "completed" &&
                        "border-primary/30 text-primary",
                      habit.status === "archived" &&
                        "border-muted-foreground/30 text-muted-foreground",
                    )}
                  >
                    {habit.status === "active"
                      ? "Активна"
                      : habit.status === "completed"
                        ? "Завершена"
                        : "В архиве"}
                  </Badge>
                  {habit.difficulty !== "medium" && (
                    <span className="text-xs text-muted-foreground/70">
                      {DIFFICULTY_LABELS[habit.difficulty]}
                    </span>
                  )}
                </CardFooter>
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
