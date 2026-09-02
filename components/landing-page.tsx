"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3, ListChecks, Heart, Bot, Zap, Dumbbell, BookOpen,
  Newspaper, Calendar, Clock, Moon, Sun, Music, Globe, ChevronRight,
  Check, X, Crown, Rocket, Sparkles, Shield, Eye, EyeOff,
  ArrowRight, Palette, LayoutDashboard, Target, Users, DollarSign,
  Repeat, Bell, Tag, Search, Download, Smartphone, Lock,
  Timer, TreePine, GraduationCap, Stethoscope, Briefcase, Scale,
  ChefHat, Calculator, Building2, Megaphone, MessageCircle,
  TrendingUp, PieChart, Wallet, CreditCard, PiggyBank,
  AlarmClock, BedDouble, Activity, Utensils, PenTool,
  FolderKanban, GitBranch, Cpu, Wifi, Star, Monitor, Mail,
  Info, Lightbulb, LayoutGrid, ChevronDown, Settings, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GooeyCtaButton } from "@/components/ui/gooey-cta-button";
import { BottomInfoBar } from "@/components/bottom-info-bar";
import { SectionDivider } from "@/components/section-divider";
import { cn } from "@/lib/utils";

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const BUILT_BLOCKS = [
  {
    icon: Calendar, label: "Планинер", color: "text-blue-500", bg: "bg-blue-500/10", href: "/features/planner",
    desc: "Канбан-доски с drag-and-drop, личные и командные задачи, список, план, недельная таблица, дашборд с аналитикой, архив.",
  },
  {
    icon: BookOpen, label: "Заметки", color: "text-violet-500", bg: "bg-violet-500/10", href: "/features/notes",
    desc: "Блочный редактор с форматированием: заголовки, списки, цитаты, код, задачи, делители. Теги и поиск.",
  },
  {
    icon: DollarSign, label: "Финансы", color: "text-emerald-500", bg: "bg-emerald-500/10", href: "/features/finance",
    desc: "Счета и кошельки, транзакции, категории, бюджет, цели, кредиты, подушка безопасности, статистика, повторяющиеся платежи, список покупок, кассовый прогноз.",
  },
  {
    icon: FolderKanban, label: "Работа", color: "text-amber-500", bg: "bg-amber-500/10", href: "/features/work",
    desc: "Готовые шаблоны для 6+ специальностей: контент-менеджер, разработчик, юрист, медик и др. Расписание задач, рабочие заметки.",
  },
  {
    icon: Heart, label: "Привычки", color: "text-rose-500", bg: "bg-rose-500/10", href: "/features/habits",
    desc: "Трекер привычек с сериями, достижения, календарь выполнения, напоминания, чеклисты, статистика по неделям/месяцам/году.",
  },
  {
    icon: Users, label: "Семья", color: "text-pink-500", bg: "bg-pink-500/10", href: "/features/family",
    desc: "Календари событий, планирование, совместные задачи и напоминания для всей семьи.",
  },
  {
    icon: Dumbbell, label: "Спорт и питание", color: "text-orange-500", bg: "bg-orange-500/10", href: "/features/sport",
    desc: "Трекинг тренировок, дневник питания, калории, БЖУ, прогресс и цели.",
  },
  {
    icon: BedDouble, label: "Сон", color: "text-indigo-500", bg: "bg-indigo-500/10", href: "/features/sleep",
    desc: "Дневник сна, статистика, калькулятор циклов, контроль качества отдыха.",
  },
  {
    icon: Timer, label: "Фокусирование", color: "text-teal-500", bg: "bg-teal-500/10", href: "/features/focus",
    desc: "Три интерактивных режима: Pomodoro, виртуальный лес, глубокая концентрация.",
  },
  {
    icon: Bot, label: "AI-помощник", color: "text-purple-500", bg: "bg-purple-500/10", href: "/features/ai",
    desc: "Контекстный AI: анализирует финансы, задачи и привычки. Отвечает на вопросы, даёт советы, помогает планировать.",
  },
];

const EXTRA_BLOCKS = [
  { icon: Settings, label: "Настройки", href: "/features/settings", desc: "Темы, языки, уведомления, внешний вид" },
  { icon: Bot, label: "AI-агент", href: "/features/ai-agent", desc: "Автоматизация, интеграции, умные сценарии" },
  { icon: User, label: "Профиль", href: "/features/profile", desc: "Аватар, имя, статистика, безопасность" },
  { icon: BarChart3, label: "Нижний бар", href: "/features/bottombar", desc: "Погода, время, курсы валют, быстрый доступ" },
];

const TARIF_FEATURES = {
  basic: [
    { text: "3 доски (личное)", ok: true },
    { text: "4 задачи/день", ok: true },
    { text: "2 счета", ok: true },
    { text: "50 транзакций/мес", ok: true },
    { text: "2 привычки", ok: true },
    { text: "5 AI-запросов/день", ok: true },
    { text: "Командные доски", ok: false },
    { text: "Бюджет и цели", ok: false },
    { text: "Достижения", ok: false },
    { text: "Экспорт данных", ok: false },
  ],
  pro: [
    { text: "20 досок (личное + команда)", ok: true },
    { text: "Безлимит задач", ok: true },
    { text: "15 счетов", ok: true },
    { text: "500 транзакций/мес", ok: true },
    { text: "Бюджет, цели, кредиты", ok: true },
    { text: "15 привычек + достижения", ok: true },
    { text: "30 AI-запросов/день", ok: true },
    { text: "5 участников в команде", ok: true },
    { text: "Экспорт данных", ok: true },
    { text: "Кастомные цвета", ok: false },
  ],
  apex: [
    { text: "Всё без лимита", ok: true },
    { text: "Подробный дашборд финансов", ok: true },
    { text: "Расписание привычек", ok: true },
    { text: "100 участников", ok: true },
    { text: "Интеграция Telegram", ok: true },
    { text: "Своя цветовая схема", ok: true },
    { text: "Музыкальные треки", ok: true },
    { text: "Кастомные настройки разделов", ok: true },
    { text: "Приоритетная поддержка", ok: true },
    { text: "Экспорт CSV, PDF", ok: true },
  ],
};

const VALUES = [
  { icon: Shield, title: "Приватность", desc: "Ваши данные зашифрованы и принадлежат только вам." },
  { icon: Zap, title: "Скорость", desc: "Мгновенная загрузка, плавные анимации, никакого ожидания." },
  { icon: Palette, title: "Гибкость", desc: "Полная настройка внешнего вида: темы, цвета, яркость." },
  { icon: Cpu, title: "AI-интеграция", desc: "Умный помощник, который знает ваш контекст." },
];

export default function LandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const handleMenuEnter = (id: string) => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    setOpenMenu(id);
  };

  const handleMenuLeave = () => {
    menuTimerRef.current = setTimeout(() => setOpenMenu(null), 200);
  };

  const handleAuth = () => {
    onAuthStateChanged(auth, (user) => {
      if (user) router.push("/");
      else router.push("/auth");
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* Header */}
      <header className="relative z-50 border-b border-border/40 bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">In Motion</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <a href="#about" className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              <Info className="h-3.5 w-3.5" />
              О проекте
            </a>
            <a href="#concept" className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              <Lightbulb className="h-3.5 w-3.5" />
              Концепция
            </a>

            {/* Возможности dropdown */}
            <div className="relative" onMouseEnter={() => handleMenuEnter("features")} onMouseLeave={handleMenuLeave}>
              <button className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors rounded-lg",
                openMenu === "features" ? "text-foreground bg-muted/50" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}>
                <LayoutGrid className="h-3.5 w-3.5" />
                Возможности
                <ChevronDown className={cn("h-3 w-3 transition-transform", openMenu === "features" && "rotate-180")} />
              </button>
              {openMenu === "features" && (
                <div className="absolute top-full left-0 pt-2 w-[640px] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="bg-card rounded-xl border border-border/40 shadow-2xl p-3">
                    <div className="grid grid-cols-3 gap-1">
                      {BUILT_BLOCKS.map((b) => {
                        const Icon = b.icon;
                        return (
                          <a key={b.label} href={b.href || "#features"} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", b.bg)}>
                              <Icon className={cn("h-3.5 w-3.5", b.color)} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{b.label}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                    <div className="border-t border-border/30 mt-2 pt-2">
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider px-3 mb-1.5">Дополнительно</p>
                      <div className="grid grid-cols-2 gap-1">
                        {EXTRA_BLOCKS.map((b) => {
                          const Icon = b.icon;
                          return (
                            <a key={b.label} href={b.href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{b.label}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{b.desc}</p>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <a href="#tariffs" className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              <CreditCard className="h-3.5 w-3.5" />
              Тарифы
            </a>
            <a href="#reviews" className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              <Star className="h-3.5 w-3.5" />
              Отзывы
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
              {mounted && theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <Link href="/auth">
              <Button variant="outline" size="sm">Войти</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Регистрация</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section id="hero" className="relative">
          <div className="relative w-full overflow-hidden bg-background border-b border-border/20">

            <div className="relative px-6 sm:px-10 lg:px-16 xl:px-24 pt-16 pb-0 flex flex-col lg:flex-row items-start gap-8 lg:gap-12 min-h-[520px]">
              {/* Left: Title + Text + CTA */}
              <div className="flex-1 max-w-xl pt-4 relative z-10">
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="text-primary text-[11px] font-bold tracking-[0.2em] uppercase">
                    Управляй своей жизнью
                  </span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                  </div>
                </div>

                <h1
                  className="font-[family-name:var(--font-syne)] text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold leading-[0.95] tracking-tight mb-5 text-foreground"
                >
                  IN<br />MOTION
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                  Планировщик, финансы, привычки, заметки, контроль сна, фокусировка
                  с тремя режимами, трекер здоровья, спорт и питание, готовые профили
                  для 6+ специальностей и AI-помощник.
                  Всё в одном приложении с полной настройкой под вас.
                </p>

                <div className="flex items-center gap-3">
                  <Link href="/auth/register">
                    <GooeyCtaButton
                      goo={6}
                      surface="var(--primary)"
                      ink="var(--primary-foreground)"
                    >
                      Начать
                    </GooeyCtaButton>
                  </Link>
                  <Link href="/about">
                    <GooeyCtaButton
                      goo={6}
                      surface="var(--foreground)"
                      ink="var(--background)"
                    >
                      Подробнее
                    </GooeyCtaButton>
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div className="relative border-t border-black/8 dark:border-white/8 px-6 sm:px-10 lg:px-16 xl:px-24 py-4">
              <div className="flex items-center gap-8 sm:gap-14">
                {[
                  { value: "7", label: "разделов" },
                  { value: "50+", label: "функций" },
                  { value: "∞", label: "настроек" },
                ].map((s, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-foreground">{s.value}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SectionDivider variant="gantt" />

        {/* Concept */}
        <section id="concept" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Концепция</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
              Продуктивность — это не про «делать больше», а про «жить осознанно».
              In Motion помогает видеть картину целиком: от утренних привычек до вечерних
              финансов. Всё в одном месте, без переключений между десятком приложений.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 rounded-2xl border border-border/40 bg-card">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Фокус на цели</h3>
              <p className="text-xs text-muted-foreground">Каждый модуль работает на ваши цели, а не отвлекает от них</p>
            </div>
            <div className="text-center p-6 rounded-2xl border border-border/40 bg-card">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Скорость</h3>
              <p className="text-xs text-muted-foreground">Мгновенная загрузка, плавные анимации, никакого ожидания</p>
            </div>
            <div className="text-center p-6 rounded-2xl border border-border/40 bg-card">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Гибкость</h3>
              <p className="text-xs text-muted-foreground">Полная настройка внешнего вида и поведения под себя</p>
            </div>
          </div>
        </section>

        <SectionDivider variant="timeline" />

        {/* Features — detailed blocks */}
        <section id="features" className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Возможности</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Каждый раздел — полноценный инструмент с глубокой функциональностью
            </p>
          </div>

          <div className="space-y-20">
            {/* Планировщик */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Планинер</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Канбан-доски с drag-and-drop, личные и командные задачи, список, план,
                  недельная таблица, дашборд с аналитикой, архив. Всё для управления
                  вашими задачами в одном месте.
                </p>
                <Link href="/features/planner" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Заметки */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Заметки</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Блочный редактор с форматированием: заголовки, списки, цитаты, код,
                  задачи, делители. Теги и поиск для быстрой навигации.
                </p>
                <Link href="/features/notes" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Финансы */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Финансы</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Счета и кошельки, транзакции, категории, бюджет, цели, кредиты и
                  обязательства, подушка безопасности, статистика, повторяющиеся платежи,
                  список покупок, кассовый прогноз.
                </p>
                <Link href="/features/finance" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Работа */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <FolderKanban className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Работа</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Готовые шаблоны досок для более чем 6 специальностей: от
                  контент-менеджера до юриста и медика. Расписание задач, рабочие
                  заметки, интеграция с профессиональными процессами.
                </p>
                <Link href="/features/work" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Привычки */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Привычки</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Трекер привычек с сериями, достижения, календарь выполнения,
                  напоминания, чеклисты, статистика по неделям, месяцам и году.
                </p>
                <Link href="/features/habits" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Семья */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-pink-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Семья</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Календари событий, планирование, совместные задачи и напоминания
                  для всей семьи. Всё в одном доступном месте.
                </p>
                <Link href="/features/family" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Спорт и питание */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <Dumbbell className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Спорт и питание</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Трекинг тренировок, дневник питания, подсчёт калорий и БЖУ,
                  прогресс и цели для здорового образа жизни.
                </p>
                <Link href="/features/sport" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Сон */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
                  <BedDouble className="h-6 w-6 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Сон</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Дневник сна, статистика, калькулятор циклов, контроль качества
                  отдыха для оптимального восстановления.
                </p>
                <Link href="/features/sleep" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* Фокусирование */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-4">
                  <Timer className="h-6 w-6 text-teal-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Фокусирование</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Три интерактивных режима: Pomodoro таймер, виртуальный лес и
                  режим глубокой концентрации. Максимальная продуктивность.
                </p>
                <Link href="/features/focus" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>

            {/* AI-помощник */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-10">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI-помощник</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Контекстный AI: анализирует ваши финансы, задачи и привычки.
                  Отвечает на вопросы, даёт советы, помогает планировать день и
                  достигать целей.
                </p>
                <Link href="/features/ai" className="text-sm text-primary hover:underline">Подробнее →</Link>
              </div>
              <div className="flex-1 w-full rounded-2xl border border-border/40 bg-muted/30 h-[280px] flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">Скоро здесь будет скриншот</span>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider variant="dots" />

        {/* Tariffs */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Тарифы</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Начните бесплатно, обновляйтесь когда будете готовы
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Basic */}
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-bold">Базовый</h3>
                  <p className="text-xs text-muted-foreground">Для личного использования</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">0 ₽</span>
                <span className="text-sm text-muted-foreground"> / мес</span>
              </div>
              <ul className="space-y-2 mb-6">
                {TARIF_FEATURES.basic.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-xs">
                    {f.ok ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                    <span className={cn(!f.ok && "text-muted-foreground/50")}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full">Начать</Button>
              </Link>
            </div>

            {/* PRO */}
            <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 relative shadow-lg shadow-primary/5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground">ПОПУЛЯРНЫЙ</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold">PRO</h3>
                  <p className="text-xs text-muted-foreground">Для продуктивных людей</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">349 ₽</span>
                <span className="text-sm text-muted-foreground"> / мес</span>
              </div>
              <ul className="space-y-2 mb-6">
                {TARIF_FEATURES.pro.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-xs">
                    {f.ok ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                    <span className={cn(!f.ok && "text-muted-foreground/50")}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register">
                <Button className="w-full bg-primary text-primary-foreground">Выбрать PRO</Button>
              </Link>
            </div>

            {/* APEX */}
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="font-bold">APEX</h3>
                  <p className="text-xs text-muted-foreground">Максимум возможностей</p>
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">549 ₽</span>
                <span className="text-sm text-muted-foreground"> / мес</span>
              </div>
              <ul className="space-y-2 mb-6">
                {TARIF_FEATURES.apex.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-xs">
                    {f.ok ? <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <X className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                    <span className={cn(!f.ok && "text-muted-foreground/50")}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full border-amber-300 dark:border-amber-700">Выбрать APEX</Button>
              </Link>
            </div>
          </div>
        </section>

        <SectionDivider variant="gantt" />

        {/* CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-card to-primary/10 p-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Зарегистрируйтесь бесплатно и попробуйте все возможности
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 px-8">
                Создать аккаунт <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <SectionDivider variant="timeline" />

        {/* Reviews */}
        <section id="reviews" className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Отзывы</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Что говорят наши пользователи
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Алексей", role: "Предприниматель", text: "Наконец-то одно приложение для всего. Управление финансами и задачами в одном месте — это именно то, что мне нужно было." },
              { name: "Мария", role: "Фрилансер", text: "AI-помощник просто бомба! Он анализирует мои привычки и помогает лучше планировать день." },
              { name: "Дмитрий", role: "Разработчик", text: "Удобный канбан, быстрая работа, красивый дизайн. Использую каждый день для работы и личных задач." },
            ].map((review) => (
              <div key={review.name} className="rounded-2xl border border-border/40 bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{review.name}</p>
                    <p className="text-[10px] text-muted-foreground">{review.role}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-primary/5 via-card to-primary/10 p-12 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Зарегистрируйтесь бесплатно и попробуйте все возможности
            </p>
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 px-8">
                Создать аккаунт <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Bottom Info Bar */}
      <BottomInfoBar />

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 bg-background pb-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <span>In Motion © 2025</span>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/about" className="hover:text-foreground transition-colors">О проекте</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Контакты</Link>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/30">
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60 flex-wrap">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Политика конфиденциальности и обработки персональных данных</Link>
              <span>·</span>
              <Link href="/offer" className="hover:text-foreground transition-colors">Публичная оферта</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-foreground transition-colors">Пользовательское соглашение</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} mounted={mounted} />
      )}
    </div>
  );
}

/* ─── Limited Settings Panel ─── */

function SettingsPanel({ onClose, mounted }: { onClose: () => void; mounted: boolean }) {
  const { theme, setTheme } = useTheme();
  const [lang, setLang] = useState("ru");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("inmotion_language");
      if (saved) setLang(saved);
    } catch {}
  }, []);

  const handleLang = (v: string) => {
    setLang(v);
    try { localStorage.setItem("inmotion_language", v); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border/40 shadow-2xl w-[400px] max-h-[85vh] overflow-y-auto p-0" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-base font-bold">Настройки</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
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
              {[
                { value: "ru", label: "🇷🇺 Русский" },
                { value: "en", label: "🇬🇧 English" },
                { value: "zh", label: "🇨🇳 中文" },
              ].map((l) => (
                <button key={l.value} onClick={() => handleLang(l.value)}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all",
                    lang === l.value
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                  )}>
                  {lang === l.value && <Check className="h-3 w-3 shrink-0" />}
                  {l.label}
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
              <button onClick={() => setTheme("light")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium transition-all",
                  theme === "light"
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 shadow-sm dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                )}>
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
              <button onClick={() => setTheme("dark")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium transition-all",
                  theme === "dark"
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                )}>
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
              <button onClick={() => setTheme("system")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg px-2.5 py-2.5 text-xs font-medium transition-all",
                  theme === "system"
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/40",
                )}>
                <div className="flex items-center gap-1">
                  <Monitor className="h-3.5 w-3.5" />
                  {theme === "system" && <Check className="h-3 w-3" />}
                </div>
                <span>Система</span>
                <div className="flex gap-0.5 mt-0.5">
                  <span className="h-1 w-3 rounded-full bg-amber-300" />
                  <span className="h-1 w-3 rounded-full bg-indigo-400" />
                </div>
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2.5 px-1">
              Полная настройка цветов, фона и яркости доступна после регистрации
            </p>
          </div>

          {/* Перейти */}
          <div className="rounded-xl bg-muted/20 border border-border/40 p-3.5">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted/50">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
              </div>
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                Перейти
              </span>
            </div>
            <div className="space-y-0.5">
              {[
                { href: "/about", label: "О проекте", icon: Sparkles },
                { href: "/faq", label: "FAQ", icon: MessageCircle },
                { href: "/contact", label: "Контакты", icon: Mail },
                { href: "/tariffs", label: "Тарифы", icon: Crown },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
