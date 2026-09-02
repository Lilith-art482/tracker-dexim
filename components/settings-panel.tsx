"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  X,
  Globe,
  Monitor,
  Sun,
  Moon,
  Palette,
  Music,
  Sparkles,
  ChevronRight,
  Crown,
  HelpCircle,
  MessageCircle,
  Trash2,
  LogOut,
  Check,
  Volume2,
  CircleDot,
  Keyboard,
  Eye,
  UserPlus,
  Users,
  FileText,
  Hash,
  User,
} from "lucide-react";
import { useSettingsPanel } from "@/lib/settings-panel-context";
import { useTheme } from "next-themes";
import { useLanguage, type Lang } from "@/lib/language-context";
import { useMenuMode } from "@/lib/menu-mode-context";
import { useAudio } from "@/lib/audio-context";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PALETTE_GROUPS, DEFAULT_THEME } from "@/lib/palette-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const AudioModal = dynamic(() => import("@/components/audio-modal"), { ssr: false });
const ThemeEditorModal = dynamic(() => import("@/components/theme-editor-modal").then(m => ({ default: m.ThemeEditorModal })), { ssr: false });
const ShortcutConfigModal = dynamic(() => import("@/components/shortcut-config-modal").then(m => ({ default: m.ShortcutConfigModal })), { ssr: false });
const ResetDataDialog = dynamic(() => import("@/components/reset-data-dialog").then(m => ({ default: m.ResetDataDialog })), { ssr: false });
const SectionVisibilityModal = dynamic(() => import("@/components/section-visibility-modal").then(m => ({ default: m.SectionVisibilityModal })), { ssr: false });
const SectionShortcutConfig = dynamic(() => import("@/components/section-shortcut-config").then(m => ({ default: m.SectionShortcutConfig })), { ssr: false });

const languages = [
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

export function SettingsPanel() {
  const { open, setOpen } = useSettingsPanel();
  const { theme, setTheme } = useTheme();
  const { lang: language, setLang: setLanguage } = useLanguage();
  const { isPlaying } = useAudio();
  const router = useRouter();

  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);
  const [shortcutModalOpen, setShortcutModalOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUserId, setShareUserId] = useState("");
  const [onboardingShown, setOnboardingShown] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [shortcutConfigOpen, setShortcutConfigOpen] = useState(false);

  useEffect(() => {
    setOnboardingShown(
      localStorage.getItem("inmotion_onboarding_hidden") !== "true",
    );
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const apply = async () => {
      try {
        const root = document.documentElement;
        const props = [
          "--primary", "--ring", "--chart-1", "--sidebar-primary", "--sidebar-ring",
          "--background", "--card", "--popover", "--muted", "--border", "--foreground",
          "--sidebar", "--sidebar-foreground", "--sidebar-accent", "--sidebar-border",
        ];
        props.forEach((p) => root.style.removeProperty(p));
        root.style.filter = "";

        const { applyTheme } = await import("@/components/theme-editor-modal");
        const raw = localStorage.getItem("inmotion_theme");
        if (raw) {
          const parsed = JSON.parse(raw);
          const merged = { ...DEFAULT_THEME, ...parsed };
          applyTheme(merged);
        } else {
          const savedAccent = localStorage.getItem("inmotion_accent_color");
          const savedCustom = localStorage.getItem("inmotion_custom_color");
          if (savedAccent) {
            const c = PALETTE_GROUPS.flatMap((g) => g.colors).find((c) => c.value === savedAccent);
            const accentCustom = savedAccent === "custom" && savedCustom ? savedCustom : c?.light || DEFAULT_THEME.accent.custom;
            const accentPreset = savedAccent === "custom" ? "custom" : savedAccent;
            const settings = { ...DEFAULT_THEME, accent: { preset: accentPreset, custom: accentCustom } };
            applyTheme(settings);
            localStorage.setItem("inmotion_theme", JSON.stringify(settings));
          }
        }
      } catch {}
    };
    const timer = setTimeout(apply, 50);
    return () => clearTimeout(timer);
  }, [theme]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      setOpen(false);
    } catch {
      toast.error("Ошибка при выходе");
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[102] bg-black/20 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-full sm:w-[420px] z-[103]",
          "flex flex-col bg-background border-l shadow-[0_0_40px_-12px_rgba(0,0,0,0.3)]",
          "rounded-tl-2xl rounded-bl-2xl overflow-hidden",
        )}
        style={{ animation: "slideInFromRight 0.3s ease-out" }}
      >
        <style>{`
          @keyframes slideInFromRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-primary via-primary/80 to-primary" />
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-gradient-to-r from-primary/10 via-background to-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/30">
              <Settings className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Настройки</p>
              <p className="text-[10px] text-muted-foreground/60">Интерфейс, тема, управление</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {/* Language */}
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
                  onClick={() => setLanguage(lang.value as Lang)}
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

          {/* Theme */}
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
                onClick={() => setThemeEditorOpen(true)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium transition-all",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                )}
              >
                <div className="flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" />
                </div>
                <span>Кастомизация</span>
                <div className="flex gap-0.5 mt-0.5">
                  <span className="h-1 w-3 rounded-full bg-primary" />
                  <span className="h-1 w-3 rounded-full bg-primary/60" />
                  <span className="h-1 w-3 rounded-full bg-primary/30" />
                </div>
              </button>
            </div>

            {/* Circular shortcut */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Видимость разделов
                </span>
              </div>
              <button
                onClick={() => setVisibilityModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Eye className="h-3 w-3" />
                Настроить видимость
              </button>
            </div>

            {/* Circular shortcut */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Круговое меню
                </span>
              </div>
              <button
                onClick={() => setShortcutModalOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Keyboard className="h-3 w-3" />
                Настроить клавиши
              </button>
            </div>

            {/* Section shortcuts */}
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="h-3.5 w-3.5 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                  Быстрые клавиши
                </span>
              </div>
              <button
                onClick={() => setShortcutConfigOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Keyboard className="h-3 w-3" />
                Настроить клавиши разделов
              </button>
            </div>
          </div>

          {/* Music */}
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
                    ? "bg-primary/15 text-primary dark:text-primary"
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

          {/* Onboarding */}
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
                <Sparkles className="h-3.5 w-3.5" />
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

          {/* Navigation */}
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
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Crown className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span>Тарифы</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors">
                  <FileText className="h-3.5 w-3.5 text-sky-600" />
                </div>
                <span>О нас</span>
              </Link>
              <Link
                href="/faq"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                </div>
                <span>FAQ</span>
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors">
                  <MessageCircle className="h-3.5 w-3.5 text-rose-600" />
                </div>
                <span>Контакты</span>
              </Link>
            </div>

            {uid && (
              <button
                onClick={() => setShareDialogOpen(true)}
                className="flex w-full items-center justify-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-background/40 hover:bg-background/80 border border-border/20 hover:border-border/50 group mt-1.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <span>Совместный доступ</span>
              </button>
            )}
          </div>

          {/* Reset Data */}
          <div>
            <button
              onClick={() => setResetDialogOpen(true)}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/30 px-4 py-2.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800/40 transition-all bg-amber-50/30 dark:bg-amber-950/10"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Trash2 className="h-3.5 w-3.5" />
              </div>
              <span>Сбросить данные</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pb-4">
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
      </div>

      {/* Modals */}
      <AudioModal open={audioModalOpen} onClose={() => setAudioModalOpen(false)} />
      <ThemeEditorModal open={themeEditorOpen} onOpenChange={setThemeEditorOpen} />
      <ShortcutConfigModal open={shortcutModalOpen} onClose={() => setShortcutModalOpen(false)} />
      <ResetDataDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
      <SectionVisibilityModal open={visibilityModalOpen} onOpenChange={setVisibilityModalOpen} />
      <SectionShortcutConfig open={shortcutConfigOpen} onClose={() => setShortcutConfigOpen(false)} />

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Совместный доступ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium">Добавить пользователя</p>
              <p className="text-xs text-muted-foreground">
                Введите ID пользователя, которому хотите предоставить доступ к вашим данным.
              </p>
              <div className="rounded-lg bg-background border border-border/50 px-3 py-2 text-[11px] text-muted-foreground/60 leading-relaxed">
                <p>
                  <strong className="text-foreground/80">Где найти ID?</strong>{" "}
                  Настройки →{" "}
                  <Hash className="h-2.5 w-2.5 inline-block align-middle" /> Мой ID
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/80">
                ID пользователя
              </label>
              <Input
                value={shareUserId}
                onChange={(e) => setShareUserId(e.target.value)}
                placeholder="Вставьте ID..."
                className="h-9 font-mono text-xs"
              />
            </div>
            <Button
              className="w-full"
              disabled={shareUserId.trim().length < 10}
              onClick={() => {
                toast.success("Функция будет доступна в одном из следующих обновлений");
                setShareDialogOpen(false);
                setShareUserId("");
              }}
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Предоставить доступ
            </Button>
            <p className="text-[10px] text-muted-foreground/40 text-center">
              Совместный доступ к бюджету, привычкам и задачам появится в ближайших обновлениях
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
