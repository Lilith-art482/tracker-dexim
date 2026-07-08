import { Habit, HabitLog, Achievement, Reminder } from "./habit-types";

const today = new Date().toISOString().split("T")[0];

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

export const mockHabits: Habit[] = [
  {
    id: "habit-1",
    name: "Утренняя зарядка",
    category: "health",
    frequencyType: "daily",
    difficulty: "easy",
    reminderEnabled: true,
    reminderTime: "07:00",
    durationMinutes: 15,
    goal: "Делать 30 дней подряд",
    goalType: "streak",
    goalValue: 30,
    status: "active",
    note: "Разминка, отжимания, пресс",
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "habit-2",
    name: "Чтение книги",
    category: "education",
    frequencyType: "daily",
    difficulty: "easy",
    reminderEnabled: true,
    reminderTime: "21:00",
    durationMinutes: 30,
    goal: "Прочитать 4 книги за месяц",
    goalType: "count",
    goalValue: 20,
    goalPeriod: "month",
    status: "active",
    note: "Минимум 30 минут перед сном",
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "habit-3",
    name: "Медитация",
    category: "health",
    frequencyType: "daily",
    difficulty: "easy",
    reminderEnabled: true,
    reminderTime: "08:30",
    durationMinutes: 10,
    status: "active",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "habit-4",
    name: "Курс английского",
    category: "education",
    frequencyType: "weekly",
    frequencyDays: [1, 3, 5],
    difficulty: "medium",
    reminderEnabled: true,
    reminderTime: "19:00",
    durationMinutes: 45,
    status: "active",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "habit-5",
    name: "Уборка квартиры",
    category: "other",
    frequencyType: "interval",
    frequencyInterval: 3,
    difficulty: "medium",
    reminderEnabled: false,
    durationMinutes: 60,
    status: "active",
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "habit-6",
    name: "Вести бюджет",
    category: "finance",
    frequencyType: "daily",
    difficulty: "medium",
    reminderEnabled: true,
    reminderTime: "20:00",
    durationMinutes: 10,
    goal: "Вести учёт 30 дней подряд",
    goalType: "streak",
    goalValue: 30,
    status: "active",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "habit-7",
    name: "Пробежка",
    category: "health",
    frequencyType: "weekly",
    frequencyDays: [1, 4, 6],
    difficulty: "hard",
    reminderEnabled: false,
    durationMinutes: 30,
    status: "active",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockHabitLogs: HabitLog[] = [];

for (let day = 1; day <= 30; day++) {
  const date = daysAgo(day);
  for (const habit of mockHabits.slice(0, 3)) {
    const done = Math.random() > 0.3;
    mockHabitLogs.push({
      id: `log-${habit.id}-${day}`,
      habitId: habit.id,
      date,
      status: done ? "done" : Math.random() > 0.5 ? "missed" : "skipped",
      durationMinutes: habit.durationMinutes,
      createdAt: date + "T00:00:00Z",
      updatedAt: date + "T00:00:00Z",
    });
  }
}

export const mockAchievements: Achievement[] = [
  {
    id: "ach-1",
    type: "first_habit",
    unlockedAt: daysAgo(60),
  },
  {
    id: "ach-2",
    type: "streak_7",
    unlockedAt: daysAgo(30),
  },
];

export const mockReminders: Reminder[] = [
  {
    id: "rem-1",
    habitId: "habit-1",
    time: "07:00",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rem-2",
    habitId: "habit-2",
    time: "21:00",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
