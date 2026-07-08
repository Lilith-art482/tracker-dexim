export type HabitFrequencyType = "daily" | "weekly" | "interval" | "time";

export type HabitCategory =
  | "health"
  | "work"
  | "education"
  | "finance"
  | "relationships"
  | "self-development"
  | "other";

export type HabitDifficulty = "easy" | "medium" | "hard";

export type HabitStatus = "active" | "completed" | "archived";

export type HabitLogStatus = "done" | "missed" | "skipped";

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequencyType: HabitFrequencyType;
  frequencyDays?: number[];
  frequencyInterval?: number;
  frequencyTime?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  difficulty: HabitDifficulty;
  durationMinutes?: number;
  goal?: string;
  goalType?: "streak" | "count";
  goalValue?: number;
  goalPeriod?: "month" | "all";
  note?: string;
  status: HabitStatus;
  checklistMode?: "all" | "half";
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  status: HabitLogStatus;
  durationMinutes?: number;
  note?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitChecklistItem {
  id: string;
  habitId: string;
  text: string;
  order: number;
  createdAt: string;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  habitId?: string;
  unlockedAt: string;
  ownerId?: string;
}

export type AchievementType =
  | "first_habit"
  | "streak_7"
  | "streak_30"
  | "streak_90"
  | "total_100"
  | "perfect_month";

export interface Reminder {
  id: string;
  habitId: string;
  time: string;
  daysOfWeek?: number[];
  enabled: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLevel {
  points: number;
  level: number;
  ownerId?: string;
}

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: "Здоровье",
  work: "Работа",
  education: "Образование",
  finance: "Финансы",
  relationships: "Отношения",
  "self-development": "Саморазвитие",
  other: "Другое",
};

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  health: "text-emerald-500",
  work: "text-blue-500",
  education: "text-purple-500",
  finance: "text-amber-500",
  relationships: "text-rose-500",
  "self-development": "text-cyan-500",
  other: "text-gray-500",
};

export const DIFFICULTY_LABELS: Record<HabitDifficulty, string> = {
  easy: "Лёгкая",
  medium: "Средняя",
  hard: "Сложная",
};

export const DIFFICULTY_POINTS: Record<HabitDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const ACHIEVEMENT_LABELS: Record<AchievementType, string> = {
  first_habit: "Первый шаг",
  streak_7: "Недельная серия",
  streak_30: "Месячная серия",
  streak_90: "Железная воля",
  total_100: "100 выполнений",
  perfect_month: "Идеальный месяц",
};

export const ACHIEVEMENT_DESCRIPTIONS: Record<AchievementType, string> = {
  first_habit: "Выполнить первую привычку",
  streak_7: "Достичь 7-дневного стрика",
  streak_30: "Достичь 30-дневного стрика",
  streak_90: "Достичь 90-дневного стрика",
  perfect_month: "100% выполнение за месяц",
  total_100: "Выполнить 100 привычек всего",
};

export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0, title: "Новичок" },
  { level: 2, minPoints: 50, title: "Ученик" },
  { level: 3, minPoints: 150, title: "Продвинутый" },
  { level: 4, minPoints: 300, title: "Эксперт" },
  { level: 5, minPoints: 500, title: "Мастер" },
  { level: 6, minPoints: 800, title: "Гуру привычек" },
];

export const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export const MOTIVATIONAL_QUOTES = [
  "Маленькие шаги приводят к большим результатам.",
  "Привычка — это то, что ты делаешь, даже когда не хочется.",
  "21 день формирует привычку. Продолжай!",
  "Ты уже на пути к лучшей версии себя.",
  "Каждый день — это новый шанс стать лучше.",
  "Дисциплина — это мост между целями и достижениями.",
  "Не останавливайся, когда устал. Остановись, когда закончил.",
  "Твои привычки определяют твоё будущее.",
  "Сегодняшнее усилие — завтрашний результат.",
  "Ты сильнее, чем твои оправдания.",
];
