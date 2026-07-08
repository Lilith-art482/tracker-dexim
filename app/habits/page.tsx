"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Calendar,
  BarChart3,
  Trophy,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HabitsDashboard } from "@/components/habits/habits-dashboard";

const TABS = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "list", label: "Мои привычки", icon: ListChecks },
  { id: "calendar", label: "Календарь", icon: Calendar },
  { id: "statistics", label: "Статистика", icon: BarChart3 },
  { id: "achievements", label: "Достижения", icon: Trophy },
  { id: "reminders", label: "Напоминания", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <HabitsDashboard />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm">Раздел в разработке</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Привычки
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Вырабатывайте полезные привычки каждый день
        </p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              activeTab === tab.id
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
