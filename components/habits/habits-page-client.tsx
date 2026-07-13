"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Trophy,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitProvider, useHabits } from "./habits-context";
import { ModuleDashboard } from "./module-dashboard";
import { ModuleMyHabits } from "./module-my-habits";
import { ModuleStatistics } from "./module-statistics";
import { ModuleAchievements } from "./module-achievements";
import { ModuleSchedule } from "./module-schedule";

const TABS = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "my-habits", label: "Мои привычки", icon: ListChecks },
  { id: "statistics", label: "Статистика", icon: BarChart3 },
  { id: "achievements", label: "Достижения", icon: Trophy },
  { id: "schedule", label: "Расписание", icon: Clock },
] as const;

type TabId = (typeof TABS)[number]["id"];

function HabitsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const {
    habits,
    logs,
    achievements,
    loading,
    updateHabit,
    toggleHabitForDate,
  } = useHabits();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  const handleScheduleToggle = (
    habitId: string,
    date: string,
    status: string,
  ) => {
    toggleHabitForDate(habitId, date, status as "done" | "missed" | "skipped");
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-14 z-40 bg-background border-b border-border/40">
        <div className="flex overflow-x-auto scrollbar-none gap-0 px-2 sm:px-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 sm:p-4 max-w-6xl mx-auto">
        {activeTab === "dashboard" && <ModuleDashboard />}
        {activeTab === "my-habits" && <ModuleMyHabits />}
        {activeTab === "statistics" && (
          <ModuleStatistics habits={habits} logs={logs} />
        )}
        {activeTab === "achievements" && (
          <ModuleAchievements
            habits={habits}
            logs={logs}
            achievements={achievements}
          />
        )}
        {activeTab === "schedule" && (
          <ModuleSchedule
            habits={habits}
            logs={logs}
            onToggleHabit={handleScheduleToggle}
          />
        )}
      </div>
    </div>
  );
}

export function HabitsPageClient() {
  return (
    <HabitProvider>
      <HabitsContent />
    </HabitProvider>
  );
}
