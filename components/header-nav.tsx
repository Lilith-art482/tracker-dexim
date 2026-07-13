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
  Bot,
  LogOut,
  MessageCircle,
  Crown,
} from "lucide-react";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useAudio } from "@/lib/audio-context";
import AudioModal from "@/components/audio-modal";
import AiChat from "@/components/ai-chat";
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
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [language, setLanguage] = useState("ru");
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
    } catch {
      toast.error("Ошибка при выходе");
    } finally {
      setLoggingOut(false);
    }
  };

  const languages = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
  ];

  return (
    <>
      <button
        onClick={() => setChatOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
        title="AI-помощник"
      >
        <Bot className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500" />
        </span>
      </button>

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
          className="w-64 overflow-hidden rounded-2xl border-border/60 p-0 shadow-lg"
        >
          <div className="px-4 pt-3 pb-2 border-b border-border/40 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Settings className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm font-semibold">Настройки</p>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            {/* Внешний вид */}
            <div className="rounded-xl bg-muted/30 p-2.5 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Оформление
                </span>
              </div>

              {/* Тема */}
              <div className="flex gap-1">
                {[
                  { id: "light", icon: Sun, label: "Светлая" },
                  { id: "dark", icon: Moon, label: "Тёмная" },
                ].map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-medium transition-all",
                      theme === id
                        ? id === "light"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:ring-amber-500/20"
                          : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:ring-indigo-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Акцент */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Palette className="h-3 w-3 text-muted-foreground/70" />
                  <span className="text-xs text-muted-foreground/80">
                    Своя цветовая схема
                  </span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground/50 font-medium">
                  Скоро
                </span>
              </div>
            </div>

            {/* Язык */}
            <div className="rounded-xl bg-muted/30 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground/70" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Язык
                </span>
              </div>
              <div className="flex gap-1">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all",
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

            {/* Прочее */}
            <div className="rounded-xl bg-muted/30 p-1.5 space-y-0.5">
              <button
                onClick={() => setAudioModalOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Музыка</span>
                <span
                  className={cn(
                    "ml-auto text-[9px] px-1.5 py-0.5 rounded font-medium",
                    isPlaying
                      ? "bg-primary/15 text-primary"
                      : "bg-muted-foreground/10 text-muted-foreground/60",
                  )}
                >
                  {isPlaying ? "Вкл" : "Выкл"}
                </span>
              </button>

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
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                  onboardingShown
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Онбординг</span>
                </div>
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-medium",
                    onboardingShown
                      ? "bg-primary/15 text-primary"
                      : "bg-muted-foreground/10 text-muted-foreground/60",
                  )}
                >
                  {onboardingShown ? "Показывать" : "Скрыт"}
                </span>
              </button>
            </div>

            {/* Ссылки */}
            <div className="grid grid-cols-2 gap-1">
              <Link
                href="/tariffs"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Тарифы</span>
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Связь</span>
              </Link>
            </div>

            {/* Выход */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/30 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{loggingOut ? "Выход..." : "Выйти"}</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Link
        href="/profile"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <User className="h-4 w-4" />
      </Link>
      <AiChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
      <AudioModal
        open={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />
    </>
  );
}
