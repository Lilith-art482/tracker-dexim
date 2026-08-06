import {
  HeartPulse,
  Briefcase,
  GraduationCap,
  Wallet,
  Heart,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { Habit, HabitCategory } from "./habit-types";
import { WEEKDAYS } from "./habit-types";

export const CATEGORY_ICONS: Record<HabitCategory, LucideIcon> = {
  health: HeartPulse,
  work: Briefcase,
  education: GraduationCap,
  finance: Wallet,
  relationships: Heart,
  "self-development": Sparkles,
  other: Tag,
};

export const CATEGORY_ACCENTS: Record<
  HabitCategory,
  { soft: string; gradient: string; solid: string; text: string }
> = {
  health: {
    soft: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500 via-emerald-400 to-teal-300",
    solid: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  work: {
    soft: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    gradient: "from-blue-500 via-blue-400 to-sky-300",
    solid: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  education: {
    soft: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    gradient: "from-purple-500 via-purple-400 to-fuchsia-300",
    solid: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  finance: {
    soft: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500 via-amber-400 to-yellow-300",
    solid: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  relationships: {
    soft: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500 via-rose-400 to-pink-300",
    solid: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
  "self-development": {
    soft: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    gradient: "from-cyan-500 via-cyan-400 to-sky-300",
    solid: "bg-cyan-500",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  other: {
    soft: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    gradient: "from-gray-500 via-gray-400 to-slate-300",
    solid: "bg-gray-500",
    text: "text-gray-600 dark:text-gray-400",
  },
};

export function getFrequencyLabel(habit: Habit): string {
  switch (habit.frequencyType) {
    case "daily":
      return "Ежедневно";
    case "weekly":
      return habit.frequencyDays
        ? habit.frequencyDays.map((d) => WEEKDAYS[d]).join(", ")
        : "По дням";
    case "interval":
      return `Каждые ${habit.frequencyInterval} дн.`;
    case "time":
      return `В ${habit.frequencyTime || "—"}`;
    default:
      return "—";
  }
}
