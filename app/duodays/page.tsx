"use client";

import { useState } from "react";
import { CalendarDays, Flower2, BarChart3 } from "lucide-react";
import DuoDaysCalendar from "@/components/duodays/calendar";
import DuoDaysCycle from "@/components/duodays/cycle";
import DuoDaysMenCalendar from "@/components/duodays/men-calendar";
import { cn } from "@/lib/utils";
import { useSectionVisibility } from "@/lib/section-visibility-context";

const ALL_TABS = [
  { id: "calendar", label: "Intimacy Log & Schedule", icon: CalendarDays },
  { id: "cycle", label: "Cycle & Baby Planner", icon: Flower2 },
  { id: "men", label: "Men's Calendar", icon: CalendarDays },
  { id: "stats", label: "Statistics", icon: BarChart3 },
];

type TabId = (typeof ALL_TABS)[number]["id"];

export default function DuoDaysPage() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const { isSubVisible } = useSectionVisibility();

  const TABS = ALL_TABS.filter((t) => isSubVisible("family", t.id));

  const renderTab = () => {
    switch (activeTab) {
      case "calendar":
        return <DuoDaysCalendar />;
      case "cycle":
        return <DuoDaysCycle />;
      case "men":
        return <DuoDaysMenCalendar />;
      case "stats":
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
              <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Статистика в разработке
            </p>
          </div>
        );
      default:
        return <DuoDaysCalendar />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-14 z-40 bg-background border-b border-border/40">
        <div className="flex overflow-x-auto scrollbar-none gap-0 px-2 sm:px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 sm:p-4 max-w-[2000px] mx-auto">{renderTab()}</div>
    </div>
  );
}
