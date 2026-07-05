"use client";

import { useMode } from "@/lib/mode-context";
import { Users, User } from "lucide-react";
import { cn } from "@/lib/utils";

const options: {
  value: "team" | "personal";
  label: string;
  icon: typeof Users;
}[] = [
  { value: "team", label: "Команда", icon: Users },
  { value: "personal", label: "Личное", icon: User },
];

export function CompactModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="inline-flex items-center rounded-lg border p-0.5 h-8">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 h-7 text-xs font-medium transition-colors",
            mode === value
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="h-3 w-3" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
