"use client";

"use client";

import { useMode, type ViewMode } from "@/lib/mode-context";
import { usePathname } from "next/navigation";
import { Users, User } from "lucide-react";

const options: { value: ViewMode; label: string; icon: typeof Users }[] = [
  { value: "team", label: "Команда", icon: Users },
  { value: "personal", label: "Личное", icon: User },
];

export function ModeToggle() {
  const { mode, setMode } = useMode();
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`inline-flex items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
            mode === value
              ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
