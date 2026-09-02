"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, BookOpen, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSectionVisibility } from "@/lib/section-visibility-context";

const ALL_TABS = [
  { id: "planning", href: "/sleep/planning", label: "Планирование сна", icon: CalendarDays },
  { id: "diary", href: "/sleep/diary", label: "Дневник сна", icon: BookOpen },
  { id: "stats", href: "/sleep/stats", label: "Статистика", icon: BarChart3 },
];

export default function SleepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isSubVisible } = useSectionVisibility();
  const TABS = ALL_TABS.filter((t) => isSubVisible("sleep", t.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-30 bg-background border-b border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="flex overflow-x-auto scrollbar-none gap-0 px-4">
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        {children}
      </div>
    </div>
  );
}
