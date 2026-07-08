export type HabitCategory =
  | "health"
  | "work"
  | "education"
  | "finance"
  | "relationships"
  | "self-development"
  | "other";

export const HABIT_CATEGORIES: { value: HabitCategory; label: string }[] = [
  { value: "health", label: "Здоровье" },
  { value: "work", label: "Работа" },
  { value: "education", label: "Образование" },
  { value: "finance", label: "Финансы" },
  { value: "relationships", label: "Отношения" },
  { value: "self-development", label: "Саморазвитие" },
  { value: "other", label: "Другое" },
];

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: "Здоровье",
  work: "Работа",
  education: "Образование",
  finance: "Финансы",
  relationships: "Отношения",
  "self-development": "Саморазвитие",
  other: "Другое",
};

export type HabitFrequencyType = "daily" | "weekly" | "scheduled" | "time";

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek?: number[]; // 0-6 for weekly
  intervalDays?: number; // every N days for scheduled
  scheduledTime?: string; // HH:mm format
}

export type HabitComplexity = "easy" | "medium" | "hard";

export const COMPLEXITY_WEIGHTS: Record<HabitComplexity, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const COMPLEXITY_LABELS: Record<HabitComplexity, string> = {
  easy: "Легкая",
  medium: "Средняя",
  hard: "Сложная",
};

export type HabitStatus = "active" | "completed" | "archived";

export type HabitLogStatus = "done" | "skipped" | "missed";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  reminder: boolean;
  reminderTime?: string; // HH:mm
  complexity: HabitComplexity;
  timeMinutes?: number;
  goal?: string;
  note?: string;
  status: HabitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: HabitLogStatus;
  completedAt?: string; // ISO string
  timeSpent?: number; // minutes
  note?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: (stats: HabitStats) => boolean;
}

export interface HabitStats {
  totalActive: number;
  doneToday: number;
  plannedToday: number;
  currentStreak: number;
  bestStreak: number;
  weeklyProgress: { date: string; done: number; total: number }[];
  monthlyCompletion: number;
}

export interface DailyHabit {
  habit: Habit;
  log?: HabitLog;
  isPlanned: boolean;
}

export interface WeeklyChartData {
  day: string;
  date: string;
  completed: number;
  total: number;
}
