import type {
  Habit,
  HabitLog,
  Achievement,
  WeeklyChartData,
} from "./habits-types";

const today = new Date().toISOString().split("T")[0];

function daysAgo(n: number): string {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().split("T")[0];
}

export const mockHabits: Habit[] = [
  {
    id: "habit-1",
    name: "Утренняя зарядка",
    category: "health",
    frequency: { type: "daily" },
    reminder: true,
    reminderTime: "07:00",
    complexity: "easy",
    timeMinutes: 15,
    goal: "30 дней подряд",
    status: "active",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(1),
  },
  {
    id: "habit-2",
    name: "Чтение книги",
    category: "education",
    frequency: { type: "daily" },
    reminder: true,
    reminderTime: "21:00",
    complexity: "medium",
    timeMinutes: 30,
    goal: "12 книг в год",
    status: "active",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(2),
  },
  {
    id: "habit-3",
    name: "Медитация",
    category: "self-development",
    frequency: { type: "daily" },
    reminder: true,
    reminderTime: "08:30",
    complexity: "easy",
    timeMinutes: 10,
    status: "active",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(3),
  },
  {
    id: "habit-4",
    name: "Пробежка",
    category: "health",
    frequency: { type: "weekly", daysOfWeek: [1, 3, 5] },
    reminder: false,
    complexity: "hard",
    timeMinutes: 45,
    goal: "5 км за 30 мин",
    status: "active",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(5),
  },
  {
    id: "habit-5",
    name: "Учить английский",
    category: "education",
    frequency: { type: "daily" },
    reminder: true,
    reminderTime: "19:00",
    complexity: "medium",
    timeMinutes: 20,
    goal: "Достичь B2 за 6 месяцев",
    status: "active",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(1),
  },
  {
    id: "habit-6",
    name: "Вести бюджет",
    category: "finance",
    frequency: { type: "daily" },
    reminder: true,
    reminderTime: "20:00",
    complexity: "medium",
    timeMinutes: 10,
    goal: "Контроль расходов",
    status: "active",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(1),
  },
  {
    id: "habit-7",
    name: "Пить воду",
    category: "health",
    frequency: { type: "daily" },
    reminder: false,
    complexity: "easy",
    goal: "2 литра в день",
    status: "active",
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
  },
  {
    id: "habit-8",
    name: "Планирование дня",
    category: "work",
    frequency: { type: "weekly", daysOfWeek: [0, 1, 2, 3, 4] },
    reminder: true,
    reminderTime: "09:00",
    complexity: "easy",
    timeMinutes: 5,
    status: "active",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    id: "habit-9",
    name: "Звонить маме",
    category: "relationships",
    frequency: { type: "weekly", daysOfWeek: [6] },
    reminder: true,
    reminderTime: "12:00",
    complexity: "easy",
    timeMinutes: 15,
    status: "active",
    createdAt: daysAgo(200),
    updatedAt: daysAgo(6),
  },
  {
    id: "habit-10",
    name: "Отжимания",
    category: "health",
    frequency: { type: "scheduled", intervalDays: 2 },
    reminder: false,
    complexity: "medium",
    timeMinutes: 10,
    goal: "100 отжиманий за подход",
    status: "completed",
    createdAt: daysAgo(180),
    updatedAt: daysAgo(30),
  },
];

function generateLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const activeHabits = mockHabits.filter((h) => h.status === "active");

  for (const habit of activeHabits) {
    for (let i = 0; i < 30; i++) {
      const date = daysAgo(i);
      const shouldSkip = Math.random() < 0.15;
      const isDone = Math.random() < 0.7;

      if (isDone) {
        logs.push({
          id: `log-${habit.id}-${date}`,
          habitId: habit.id,
          date,
          status: "done",
          completedAt: `${date}T${habit.reminderTime || "08:00"}:00.000Z`,
          timeSpent: habit.timeMinutes,
        });
      } else if (shouldSkip) {
        logs.push({
          id: `log-${habit.id}-${date}-skipped`,
          habitId: habit.id,
          date,
          status: "skipped",
        });
      } else {
        logs.push({
          id: `log-${habit.id}-${date}-missed`,
          habitId: habit.id,
          date,
          status: "missed",
        });
      }
    }
  }
  return logs;
}

export const mockHabitLogs: HabitLog[] = generateLogs();

export function getMockWeeklyData(): WeeklyChartData[] {
  const data: WeeklyChartData[] = [];
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  for (let i = 6; i >= 0; i--) {
    const date = daysAgo(i);
    const dayLogs = mockHabitLogs.filter((l) => l.date === date);
    const total = mockHabits.filter((h) => h.status === "active").length;
    const completed = dayLogs.filter((l) => l.status === "done").length;

    data.push({
      day: days[6 - i],
      date,
      completed,
      total,
    });
  }

  return data;
}

export const mockAchievements: Achievement[] = [
  {
    id: "ach-1",
    name: "Первый шаг",
    description: "Выполнить первую привычку",
    icon: "star",
    condition: () => true,
    unlockedAt: daysAgo(30),
  },
  {
    id: "ach-2",
    name: "Недельный стрик",
    description: "7 дней подряд без пропусков",
    icon: "flame",
    condition: () => false,
    unlockedAt: daysAgo(25),
  },
  {
    id: "ach-3",
    name: "30-дневный стрик",
    description: "30 дней подряд",
    icon: "zap",
    condition: () => false,
  },
  {
    id: "ach-4",
    name: "Железная воля",
    description: "90 дней подряд",
    icon: "trophy",
    condition: () => false,
  },
  {
    id: "ach-5",
    name: "Сотня",
    description: "100 выполненных привычек всего",
    icon: "award",
    condition: () => false,
    unlockedAt: daysAgo(10),
  },
  {
    id: "ach-6",
    name: "Идеальный месяц",
    description: "100% выполнение за месяц",
    icon: "target",
    condition: () => false,
  },
];
