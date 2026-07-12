"use client";

import Link from "next/link";
import {
  Calendar,
  DollarSign,
  ListChecks,
  Search,
  User,
  Settings,
  Sun,
  Moon,
  Palette,
  Globe,
  Monitor,
} from "lucide-react";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";


const NAV_ITEMS = [
  { id: "planner", label: "Планнер", icon: Calendar },
  { id: "finance", label: "Финансы", icon: DollarSign },
  { id: "habits", label: "Привычки", icon: ListChecks },
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
      router.push(`/?${params.toString()}`);
      return;
    }
    if (id === "finance") {
      router.push("/finance");
      return;
    }
    if (id === "habits") {
      router.push("/habits");
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
            (id === "planner" && pathname === "/") ||
              (id === "finance" && pathname.startsWith("/finance")) ||
              (id === "habits" && pathname.startsWith("/habits"))
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
  const [language, setLanguage] = useState("ru");

  const languages = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
  ];

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

      <Popover>
        <PopoverTrigger>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={8} className="w-56 p-3">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground/70">
                <Globe className="h-3.5 w-3.5" />
                Язык
              </div>
              <div className="flex flex-col gap-0.5">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors text-left",
                      language === lang.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    <span className="text-xs">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground/70">
                <Monitor className="h-3.5 w-3.5" />
                Тема
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    theme === "light"
                      ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Светлая
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    theme === "dark"
                      ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Тёмная
                </button>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground/70">
                <Palette className="h-3.5 w-3.5" />
                Цветовая гамма
              </div>
              <button
                disabled
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/50 cursor-not-allowed"
              >
                <div className="flex -space-x-1">
                  <div className="h-3 w-3 rounded-full border border-border bg-blue-500" />
                  <div className="h-3 w-3 rounded-full border border-border bg-purple-500" />
                  <div className="h-3 w-3 rounded-full border border-border bg-emerald-500" />
                </div>
                В разработке
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Link
        href="/profile"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <User className="h-4 w-4" />
      </Link>
    </>
  );
}
