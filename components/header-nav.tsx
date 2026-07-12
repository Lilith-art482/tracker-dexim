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
  Volume2,
  Sparkles,
} from "lucide-react";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useAudio } from "@/lib/audio-context";
import AudioModal from "@/components/audio-modal";
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
  const { setMode } = useMode();
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
  const { isPlaying } = useAudio();
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [onboardingShown, setOnboardingShown] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("inmotion_onboarding_hidden") !== "true";
    }
    return true;
  });
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
          <button className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-60 overflow-hidden rounded-2xl border-border/60 p-0 shadow-lg"
        >
          <div className="px-4 pt-3.5 pb-2 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Настройки</p>
                <p className="text-[11px] text-muted-foreground/60">
                  Интерфейс и язык
                </p>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-1">
            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2 mb-2.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Язык
                </span>
              </div>
              <div className="flex gap-1">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      "flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                      language === lang.value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-2.5 h-px bg-border/50" />

            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2 mb-2.5">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Тема
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                    theme === "light"
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:text-amber-600 dark:bg-amber-500/10 dark:ring-amber-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Светлая
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                    theme === "dark"
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:ring-indigo-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Тёмная
                </button>
              </div>
            </div>

            <div className="mx-2.5 h-px bg-border/50" />

            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Музыка
                </span>
                <span
                  className={cn(
                    "ml-auto text-[10px] px-1.5 py-0.5 rounded",
                    isPlaying
                      ? "bg-primary/15 text-primary"
                      : "bg-muted-foreground/10",
                  )}
                >
                  {isPlaying ? "Вкл" : "Выкл"}
                </span>
              </div>
              <button
                onClick={() => setAudioModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-left"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/60">
                  <Volume2 className="h-3.5 w-3.5" />
                </div>
                <span>Управление мелодией</span>
              </button>
            </div>

            <div className="mx-2.5 h-px bg-border/50" />

            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Обучение
                </span>
              </div>
              <button
                onClick={() => {
                  const hidden =
                    localStorage.getItem("inmotion_onboarding_hidden") ===
                    "true";
                  localStorage.setItem(
                    "inmotion_onboarding_hidden",
                    hidden ? "false" : "true",
                  );
                  setOnboardingShown(hidden);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all",
                  onboardingShown
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Онбординг</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    onboardingShown
                      ? "bg-primary/15 text-primary"
                      : "bg-muted-foreground/10",
                  )}
                >
                  {onboardingShown ? "Показывать" : "Скрыт"}
                </span>
              </button>
            </div>

            <div className="mx-2.5 h-px bg-border/50" />

            <div className="px-2.5 py-2">
              <div className="flex items-center gap-2 mb-2.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Акцент
                </span>
              </div>
              <button
                disabled
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground/50 bg-muted/30 cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    <div className="h-3 w-3 rounded-full border-2 border-background bg-blue-500" />
                    <div className="h-3 w-3 rounded-full border-2 border-background bg-violet-500" />
                    <div className="h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                  </div>
                  <span>Своя цветовая схема</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-foreground/10">
                  Soon
                </span>
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
      <AudioModal
        open={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />
    </>
  );
}
