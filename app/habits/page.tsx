"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Calendar,
  BarChart3,
  Trophy,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit, HabitLog, HabitLogStatus } from "@/lib/habits-types";
import { HabitsDashboard } from "@/components/habits/habits-dashboard";
import { HabitsList } from "@/components/habits/habits-list";
import { HabitsCalendar } from "@/components/habits/habits-calendar";

const TABS = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "list", label: "Мои привычки", icon: ListChecks },
  { id: "calendar", label: "Календарь", icon: Calendar },
  { id: "statistics", label: "Статистика", icon: BarChart3 },
  { id: "achievements", label: "Достижения", icon: Trophy },
  { id: "reminders", label: "Напоминания", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STORAGE_KEY_HABITS = "tracker-habits";
const STORAGE_KEY_LOGS = "tracker-habit-logs";

function loadHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HABITS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadLogs(): HabitLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHabits(loadHabits());
    setLogs(loadLogs());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
    }
  }, [habits, loaded]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    }
  }, [logs, loaded]);

  const handleAddHabit = useCallback((habit: Habit) => {
    setHabits((prev) => [...prev, habit]);
  }, []);

  const handleUpdateHabit = useCallback((habit: Habit) => {
    setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
  }, []);

  const handleDeleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setLogs((prev) => prev.filter((l) => l.habitId !== id));
  }, []);

  const handleToggleLog = useCallback(
    (habitId: string, status: HabitLogStatus, date?: string) => {
      const targetDate = date ?? getToday();
      setLogs((prev) => {
        const existing = prev.findIndex(
          (l) => l.habitId === habitId && l.date === targetDate,
        );
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], status };
          return updated;
        }
        return [
          ...prev,
          {
            id: `log-${habitId}-${targetDate}`,
            habitId,
            date: targetDate,
            status,
            completedAt:
              status === "done" ? new Date().toISOString() : undefined,
          },
        ];
      });
    },
    [],
  );

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <HabitsDashboard
            habits={habits}
            logs={logs}
            onToggleLog={handleToggleLog}
          />
        );
      case "list":
        return (
          <HabitsList
            habits={habits}
            onAdd={handleAddHabit}
            onUpdate={handleUpdateHabit}
            onDelete={handleDeleteHabit}
          />
        );
      case "calendar":
        return (
          <HabitsCalendar
            habits={habits}
            logs={logs}
            onToggleLog={handleToggleLog}
          />
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Раздел в разработке</p>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient blurs */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="relative mb-6 rounded-3xl border border-white/10 dark:border-white/5 bg-gradient-to-br from-white/60 to-white/20 dark:from-white/[0.08] dark:to-white/[0.02] backdrop-blur-xl p-5 sm:p-6 shadow-lg">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-primary/5 text-primary shadow-lg shadow-primary/10 ring-1 ring-white/20 dark:ring-white/10">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Привычки
              </h1>
              <p className="text-xs sm:text-sm text-foreground/50 mt-0.5">
                Вырабатывайте полезные привычки каждый день
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative mb-6 rounded-2xl border border-white/10 dark:border-white/5 bg-gradient-to-br from-white/50 to-white/10 dark:from-white/[0.06] dark:to-white/[0.02] backdrop-blur-xl p-1.5 shadow-lg">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0",
                  activeTab === tab.id
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/5"
                    : "text-foreground/40 hover:text-foreground/70 hover:bg-white/50 dark:hover:bg-white/[0.06]",
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative rounded-3xl border border-white/10 dark:border-white/5 bg-gradient-to-br from-white/60 to-white/20 dark:from-white/[0.10] dark:to-white/[0.04] backdrop-blur-xl p-4 sm:p-6 shadow-lg">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
          <div className="relative">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
