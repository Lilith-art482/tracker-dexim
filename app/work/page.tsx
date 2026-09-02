"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Construction,
  Pen,
  Code,
  Heart,
  Landmark,
  GraduationCap,
  Flower2,
  Dumbbell,
  CalendarDays,
  StickyNote,
  Scale,
  Calculator,
  Store,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

function BeeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 10a2 2 0 1 0 4 0 2 2 0 1 0-4 0" />
      <path d="M13 6a2 2 0 1 0 4 0 2 2 0 1 0-4 0" />
      <path d="M7 17a4 4 0 0 0 8 0" />
      <path d="M12 2v4" />
      <path d="M9 3.5 10 2" />
      <path d="M15 3.5 14 2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="M5.6 5.6 7 7" />
      <path d="M18.4 5.6 17 7" />
      <rect x="8" y="10" width="8" height="7" rx="2" />
    </svg>
  );
}

const PROFESSIONS: {
  title: string;
  subtitle?: string | null;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  href?: string;
  underDevelopment?: boolean;
}[] = [
  {
    title: "Контент-менеджер",
    subtitle: "Блогер",
    icon: Pen,
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "from-sky-500/10 to-sky-500/5",
    borderColor: "border-sky-500/15",
    href: "/work/content",
  },
  {
    title: "Разработчик",
    subtitle: null,
    icon: Code,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "from-emerald-500/10 to-emerald-500/5",
    borderColor: "border-emerald-500/15",
    href: "/work/dev",
  },
  {
    title: "Медик",
    subtitle: null,
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "from-rose-500/10 to-rose-500/5",
    borderColor: "border-rose-500/15",
    underDevelopment: true,
  },
  {
    title: "Государственный",
    subtitle: "служащий",
    icon: Landmark,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "from-amber-500/10 to-amber-500/5",
    borderColor: "border-amber-500/15",
    underDevelopment: true,
  },
  {
    title: "Педагог",
    subtitle: null,
    icon: GraduationCap,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "from-violet-500/10 to-violet-500/5",
    borderColor: "border-violet-500/15",
    underDevelopment: true,
  },
  {
    title: "Пчеловод",
    subtitle: null,
    icon: BeeIcon,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "from-yellow-500/10 to-yellow-500/5",
    borderColor: "border-yellow-500/15",
    underDevelopment: true,
  },
  {
    title: "Бухгалтер",
    subtitle: null,
    icon: Calculator,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "from-indigo-500/10 to-indigo-500/5",
    borderColor: "border-indigo-500/15",
    underDevelopment: true,
  },
  {
    title: "Предприниматель",
    subtitle: null,
    icon: Store,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "from-teal-500/10 to-teal-500/5",
    borderColor: "border-teal-500/15",
    underDevelopment: true,
  },
  {
    title: "Повар",
    subtitle: null,
    icon: ChefHat,
    color: "text-red-600 dark:text-red-400",
    bgColor: "from-red-500/10 to-red-500/5",
    borderColor: "border-red-500/15",
    underDevelopment: true,
  },
  {
    title: "Юрист",
    subtitle: null,
    icon: Scale,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "from-cyan-500/10 to-cyan-500/5",
    borderColor: "border-cyan-500/15",
    underDevelopment: true,
  },
];

const GENERAL: {
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  href?: string;
}[] = [
  {
    title: "Расписание",
    icon: CalendarDays,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "from-teal-500/10 to-teal-500/5",
    borderColor: "border-teal-500/15",
    href: "/schedule",
  },
  {
    title: "Заметки",
    icon: StickyNote,
    color: "text-fuchsia-600 dark:text-fuchsia-400",
    bgColor: "from-fuchsia-500/10 to-fuchsia-500/5",
    borderColor: "border-fuchsia-500/15",
    href: "/work/notes",
  },
];

function Card({
  item,
  index,
}: {
  item: (typeof PROFESSIONS)[number] | (typeof GENERAL)[number];
  index: number;
}) {
  const Icon = item.icon;
  const href = "href" in item ? item.href : undefined;
  const underDevelopment = "underDevelopment" in item ? item.underDevelopment : undefined;

  const content = (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-2xl border p-5 sm:p-6 bg-gradient-to-br transition-all",
        href ? "card-hover cursor-pointer" : "",
        item.bgColor,
        item.borderColor,
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute -right-4 -bottom-4 opacity-[0.07]">
        <Icon className="h-28 w-28" strokeWidth={1} />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl bg-background/80 shadow-sm",
              item.color,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {underDevelopment === true && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Construction className="h-3 w-3" />
              В разработке
            </div>
          )}
        </div>

        <h3 className="text-sm sm:text-base font-bold mb-0.5">
          {item.title}
        </h3>
        {"subtitle" in item && item.subtitle && (
          <p className="text-xs text-muted-foreground">
            {item.subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="h-full">{content}</Link>;
  }

  return content;
}

export default function WorkPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/15 to-orange-500/10">
            <Briefcase className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Work</h1>
            <p className="text-xs text-muted-foreground">
              Задачи и шаблоны для специалистов всех направлений
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {PROFESSIONS.map((prof, i) => (
            <Card key={prof.title} item={prof} index={i} />
          ))}
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Общее
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {GENERAL.map((item, i) => (
            <Card key={item.title} item={item} index={PROFESSIONS.length + i} />
          ))}
        </div>
      </div>
    </div>
  );
}
