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
  HelpCircle,
  ChevronRight,
  FileText,
  Check,
  X,
  Music,
  BookOpen,
  Newspaper,
  Dumbbell,
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
import { useState, useMemo, useRef, useEffect } from "react";
import { FAQ_DATA } from "@/lib/faq";

const NAV_ITEMS = [
  { id: "planner", label: "Планнер", icon: Calendar },
  { id: "finance", label: "Финансы", icon: DollarSign },
  { id: "habits", label: "Привычки", icon: ListChecks },
  { id: "sport", label: "Спорт и Питание", icon: Dumbbell },
  { id: "divider", label: "", icon: null },
  { id: "blog", label: "Блог", icon: Newspaper },
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
    if (id === "sport") {
      router.push("/sport");
      return;
    }
    if (id === "blog") {
      toast.info("Блог скоро появится!");
      return;
    }
    toast.info("Страница в разработке");
  };

  return (
    <div
      className="flex items-center flex-1 overflow-x-auto scrollbar-none gap-0.5"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black 12px, black 90%, transparent 100%)",
      }}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        if (id === "divider") {
          return (
            <div key={id} className="h-5 w-px bg-border/40 mx-1 shrink-0" />
          );
        }
        const isActive =
          (id === "planner" && pathname === "/") ||
          (id === "finance" && pathname.startsWith("/finance")) ||
          (id === "habits" && pathname.startsWith("/habits")) ||
          (id === "sport" && pathname.startsWith("/sport"));
        return (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all shrink-0 whitespace-nowrap",
              isActive
                ? "text-primary bg-primary/10 shadow-sm"
                : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [language, setLanguage] = useState("ru");
  const [loggingOut, setLoggingOut] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchTab, setSearchTab] = useState<"all" | "pages" | "faq">("all");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const SEARCH_PAGES = [
    { url: "/", label: "Планнер (главная)", icon: Calendar },
    { url: "/finance", label: "Финансы", icon: DollarSign },
    { url: "/habits", label: "Привычки", icon: ListChecks },
    { url: "/profile", label: "Профиль", icon: User },
    { url: "/tariffs", label: "Тарифы", icon: Crown },
    { url: "/about", label: "О нас", icon: FileText },
    { url: "/faq", label: "FAQ", icon: HelpCircle },
    { url: "/contact", label: "Связь с разработчиками", icon: MessageCircle },
    { url: "/auth", label: "Вход / Регистрация", icon: User },
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim())
      return {
        pages: SEARCH_PAGES,
        faq: FAQ_DATA.flatMap((c) => c.items),
        faqCategories: FAQ_DATA,
      };

    const q = searchQuery.toLowerCase();
    const matchedPages = SEARCH_PAGES.filter((p) =>
      p.label.toLowerCase().includes(q),
    );

    const matchedFaqItems = FAQ_DATA.flatMap((cat) =>
      cat.items
        .filter(
          (item) =>
            item.question.toLowerCase().includes(q) ||
            item.answer.toLowerCase().includes(q),
        )
        .map((item) => ({ ...item, categoryLabel: cat.label })),
    );

    const matchedCategories = FAQ_DATA.filter((cat) =>
      cat.label.toLowerCase().includes(q),
    );

    return {
      pages: matchedPages,
      faq: matchedFaqItems,
      faqCategories: matchedCategories,
    };
  }, [searchQuery]);

  const handleSearchSelect = (url: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    window.location.href = url;
  };

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

      {/* Search */}
      <div className="hidden md:block relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Поиск задач, страниц, FAQ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="h-8 w-48 lg:w-56 pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchOpen && (
          <div className="absolute top-full right-0 mt-1.5 w-96 max-h-[70vh] overflow-y-auto rounded-2xl border border-border/60 bg-popover shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {searchQuery ? (
              <>
                {searchResults.pages.length === 0 &&
                searchResults.faq.length === 0 &&
                searchResults.faqCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Ничего не найдено
                  </p>
                ) : (
                  <>
                    {searchResults.pages.length > 0 && (
                      <div className="mb-2">
                        <p className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                          Страницы
                        </p>
                        {searchResults.pages.map((page) => (
                          <button
                            key={page.url}
                            onClick={() => handleSearchSelect(page.url)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-foreground/80 hover:bg-muted/50 transition-all text-left"
                          >
                            <page.icon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                            <span>{page.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.faq.length > 0 && (
                      <div>
                        <p className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                          FAQ
                        </p>
                        {searchResults.faq.slice(0, 5).map((item, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery("");
                              window.location.href = `/faq?q=${encodeURIComponent(item.question)}`;
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-foreground/80 hover:bg-muted/50 transition-all text-left"
                          >
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="truncate block">
                                {item.question}
                              </span>
                              <span className="text-[10px] text-muted-foreground/40 truncate block">
                                {item.answer.slice(0, 80)}…
                              </span>
                            </div>
                          </button>
                        ))}
                        {searchResults.faq.length > 5 && (
                          <p className="px-2.5 py-1.5 text-[10px] text-muted-foreground/40 text-center">
                            +{searchResults.faq.length - 5} ещё
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <p className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  Быстрый доступ
                </p>
                {SEARCH_PAGES.map((page) => (
                  <button
                    key={page.url}
                    onClick={() => handleSearchSelect(page.url)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-foreground/80 hover:bg-muted/50 transition-all text-left"
                  >
                    <page.icon className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                    <span>{page.label}</span>
                  </button>
                ))}

                <div className="mt-2 pt-2 border-t border-border/40">
                  <p className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                    Категории FAQ
                  </p>
                  {FAQ_DATA.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSearchOpen(false);
                        window.location.href = `/faq?category=${cat.id}`;
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-all text-left"
                    >
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <Popover>
        <PopoverTrigger>
          <button className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[360px] overflow-hidden rounded-2xl border-border/60 p-0 shadow-xl"
        >
          {/* Header with gradient */}
          <div className="relative px-5 pt-4 pb-3.5 border-b border-border/40 bg-gradient-to-br from-muted/40 via-background to-muted/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] to-transparent pointer-events-none" />
            <div className="flex items-center gap-3 relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Настройки
                </p>
                <p className="text-[11px] text-muted-foreground/50">
                  Интерфейс, тема, управление
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 space-y-3 max-h-[65vh] overflow-y-auto">
            {/* Language card */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Язык интерфейса
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setLanguage(lang.value)}
                    className={cn(
                      "relative flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                      language === lang.value
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                    )}
                  >
                    {language === lang.value && (
                      <Check className="h-3 w-3 shrink-0" />
                    )}
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme card */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Оформление
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setTheme("light")}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium transition-all",
                    theme === "light"
                      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Sun className="h-3.5 w-3.5" />
                    {theme === "light" && <Check className="h-3 w-3" />}
                  </div>
                  <span>Светлая</span>
                  <div className="flex gap-0.5 mt-0.5">
                    <span className="h-1 w-3 rounded-full bg-amber-300" />
                    <span className="h-1 w-3 rounded-full bg-zinc-200" />
                  </div>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium transition-all",
                    theme === "dark"
                      ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                  )}
                >
                  <div className="flex items-center gap-1">
                    <Moon className="h-3.5 w-3.5" />
                    {theme === "dark" && <Check className="h-3 w-3" />}
                  </div>
                  <span>Тёмная</span>
                  <div className="flex gap-0.5 mt-0.5">
                    <span className="h-1 w-3 rounded-full bg-indigo-400" />
                    <span className="h-1 w-3 rounded-full bg-zinc-700" />
                  </div>
                </button>
                <button
                  disabled
                  className="relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium text-muted-foreground/40 border border-dashed border-border/30 cursor-not-allowed"
                >
                  <div className="flex items-center gap-1">
                    <Palette className="h-3.5 w-3.5" />
                  </div>
                  <span>Своя</span>
                  <span className="text-[9px] text-muted-foreground/30">
                    Скоро
                  </span>
                </button>
              </div>
            </div>

            {/* Music card */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Музыка
                </span>
                <span
                  className={cn(
                    "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    isPlaying
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted-foreground/10 text-muted-foreground/60",
                  )}
                >
                  {isPlaying ? "Звучит" : "Выкл"}
                </span>
              </div>
              <button
                onClick={() => setAudioModalOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg bg-background/60 hover:bg-background/90 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all border border-border/30 hover:border-border/60 group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 group-hover:from-violet-500/20 group-hover:to-purple-500/20 transition-colors">
                  <Music className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <span className="flex-1 text-left">
                  {isPlaying ? "Изменить мелодию" : "Выбрать фоновую мелодию"}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
              </button>
            </div>

            {/* Onboarding card */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Онбординг
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
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all border",
                  onboardingShown
                    ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                    : "bg-background/60 text-muted-foreground border-border/30 hover:bg-background/90 hover:text-foreground hover:border-border/60",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Показывать при входе</span>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] font-medium",
                    onboardingShown
                      ? "text-primary"
                      : "text-muted-foreground/60",
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-3.5 rounded-full transition-colors relative",
                      onboardingShown
                        ? "bg-primary/30"
                        : "bg-muted-foreground/20",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm transition-all",
                        onboardingShown ? "left-4" : "left-0.5",
                      )}
                    />
                  </div>
                </div>
              </button>
            </div>

            {/* Navigation card */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
              <div className="flex items-center gap-2 mb-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                </div>
                <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Перейти
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/tariffs"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Crown className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span>Тарифы</span>
                </Link>
                <Link
                  href="/about"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors">
                    <FileText className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <span>О нас</span>
                </Link>
                <Link
                  href="/faq"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span>FAQ</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                    <MessageCircle className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                  <span>Контакты</span>
                </Link>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-1">
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-rose-200/60 dark:border-rose-900/30 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800/40 transition-all bg-rose-50/30 dark:bg-rose-950/10"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <span>{loggingOut ? "Выход..." : "Выйти из аккаунта"}</span>
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

      <AiChat open={chatOpen} onClose={() => setChatOpen(false)} />
      <AudioModal
        open={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />
    </>
  );
}
