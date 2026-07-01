"use client";

import { useMode, type ViewMode } from "@/lib/mode-context";
import { Users, User } from "lucide-react";

const options: { value: ViewMode; label: string; icon: typeof Users }[] = [
  { value: "team", label: "Команда", icon: Users },
  { value: "personal", label: "Личное", icon: User },
];

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
