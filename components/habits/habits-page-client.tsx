"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Calendar,
  BarChart3,
  Trophy,
  Bell,
  Clock,
  ClipboardList,
  Cloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitProvider, useHabits } from "./habits-context";
import { ModuleDashboard } from "./module-dashboard";
import { ModuleMyHabits } from "./module-my-habits";
import { ModuleCalendar } from "./module-calendar";
import { ModuleStatistics } from "./module-statistics";
import { ModuleAchievements } from "./module-achievements";
import { ModuleReminders } from "./module-reminders";
import { ModuleSchedule } from "./module-schedule";
import { ModuleChecklists } from "./module-checklists";
import { ModuleBackup } from "./module-backup";

const TABS = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "my-habits", label: "Мои привычки", icon: ListChecks },
  { id: "calendar", label: "Календарь", icon: Calendar },
  { id: "statistics", label: "Статистика", icon: BarChart3 },
  { id: "achievements", label: "Достижения", icon: Trophy },
  { id: "reminders", label: "Напоминания", icon: Bell },
  { id: "schedule", label: "Расписание", icon: Clock },
  { id: "checklists", label: "Чек-листы", icon: ClipboardList },
  { id: "backup", label: "Бэкап", icon: Cloud },
] as const;

type TabId = (typeof TABS)[number]["id"];

function HabitsContent() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const {
    habits,
    logs,
    achievements,
    reminders,
    todayHabits,
    stats,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    cloneHabit,
    toggleHabit,
    toggleHabitForDate,
    addReminder,
    updateReminder,
    deleteReminder,
    addAchievement,
    refresh,
  } = useHabits();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">
          Загрузка...
        </div>
      </div>
    );
  }

  const handleCalendarUpdateLog = (logId: string, status: string) => {
    const log = logs.find((l) => l.id === logId);
    if (log) {
      toggleHabitForDate(log.habitId, log.date, status as "done" | "missed" | "skipped");
    }
  };

  const handleReminderToggle = (habitId: string, date: string, status: string) => {
    toggleHabitForDate(habitId, date, status as "done" | "missed" | "skipped");
  };

  const handleScheduleToggle = (habitId: string, date: string, status: string) => {
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
        {activeTab === "calendar" && (
          <ModuleCalendar
            habits={habits}
            logs={logs}
            onUpdateLog={handleCalendarUpdateLog}
          />
        )}
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
        {activeTab === "reminders" && (
          <ModuleReminders
            habits={habits}
            reminders={reminders}
            todayHabits={todayHabits}
            onToggleHabit={handleReminderToggle}
            onAddReminder={addReminder}
            onUpdateReminder={updateReminder}
            onDeleteReminder={deleteReminder}
          />
        )}
        {activeTab === "schedule" && (
          <ModuleSchedule
            habits={habits}
            logs={logs}
            onToggleHabit={handleScheduleToggle}
          />
        )}
        {activeTab === "checklists" && (
          <ModuleChecklists
            habits={habits}
            onUpdateHabit={updateHabit}
          />
        )}
        {activeTab === "backup" && (
          <ModuleBackup
            habits={habits}
            logs={logs}
            achievements={achievements}
            onReset={refresh}
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
