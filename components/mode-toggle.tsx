"use client";

import { useMode, type ViewMode } from "@/lib/mode-context";
import { usePathname } from "next/navigation";
import { Users, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const options: { value: ViewMode; label: string; icon: typeof Users }[] = [
  { value: "team", label: "Команда", icon: Users },
  { value: "personal", label: "Личное", icon: User },
];

export function ModeToggle() {
  const { mode, setMode, dashboardOpen, setDashboardOpen } = useMode();
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setDashboardOpen(!dashboardOpen)}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg border p-0.5 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
          dashboardOpen
            ? "bg-violet-500/10 text-violet-600 shadow-sm border-violet-500/20"
            : "text-muted-foreground hover:text-foreground border-border/60 hover:border-border",
        )}
        title="Дашборд"
      >
        <LayoutDashboard className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
        <span className="hidden sm:inline">Дашборд</span>
      </button>

      <div className="flex items-center gap-0.5 rounded-lg border p-0.5 border-border/60">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => {
              setMode(value);
              if (dashboardOpen) setDashboardOpen(false);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
              mode === value && !dashboardOpen
                ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
