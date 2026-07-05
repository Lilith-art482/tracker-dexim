"use client";

import Link from "next/link";
import {
  Calendar,
  DollarSign,
  ListChecks,
  Zap,
  Award,
  Search,
  User,
  Sun,
  Moon,
} from "lucide-react";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";

const NAV_ITEMS = [
  { id: "planner", label: "Планнер", icon: Calendar },
  { id: "finance", label: "Финансы", icon: DollarSign },
  { id: "habits", label: "Привычки", icon: ListChecks },
  { id: "sport", label: "Спорт", icon: Zap },
  { id: "challenges", label: "Челленджи", icon: Award },
] as const;

export function HeaderNav() {
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleNavClick = (id: string) => {
    if (id === "planner") {
      setMode("personal");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("boardId");
      const uid = searchParams.get("uid");
      if (uid) params.set("uid", uid);
      router.push(`${pathname}?${params.toString()}`);
      return;
    }
    toast.info("Страница в разработке");
  };

  return (
    <div className="flex items-center gap-1 flex-1 overflow-x-auto">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleNavClick(id)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors shrink-0",
            id === "planner" && mode === "personal"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function HeaderActions() {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <div className="hidden md:block">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            type="search"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-48 pl-8 text-sm"
          />
        </div>
      </div>

      <NotificationBell />

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>

      <Link
        href="/profile"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <User className="h-4 w-4" />
      </Link>
    </>
  );
}
