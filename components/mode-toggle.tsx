"use client";

import { useMode, type ViewMode } from "@/lib/mode-context";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Users, User } from "lucide-react";

const options: { value: ViewMode; label: string; icon: typeof Users }[] = [
  { value: "team", label: "Команда", icon: Users },
  { value: "personal", label: "Личное", icon: User },
];

export function ModeToggle() {
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleModeChange = (newMode: ViewMode) => {
    setMode(newMode);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("boardId");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => handleModeChange(value)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground dark:text-foreground/70 dark:hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
