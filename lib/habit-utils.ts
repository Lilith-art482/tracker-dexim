import { Habit, HabitLog } from "./habit-types";

export function calculateStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId).sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;
  for (const log of habitLogs) {
    if (log.date === checkDate && log.status === "done") {
      streak++;
      const d = new Date(checkDate + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else if (log.date === checkDate && log.status === "skipped") {
      const d = new Date(checkDate + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else if (log.date < checkDate) {
      break;
    }
  }
  return streak;
}

export function calculateLongestStreak(habitId: string, logs: HabitLog[]): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId).sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;
  for (const log of habitLogs) {
    if (log.status === "done") {
      current++;
      longest = Math.max(longest, current);
    } else if (log.status !== "skipped") {
      current = 0;
    }
  }
  return longest;
}

export function calculateCompletionPercentage(habitId: string, logs: HabitLog[], days: number = 30): number {
  const habitLogs = logs.filter((l) => l.habitId === habitId);
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  const startStr = startDate.toISOString().split("T")[0];
  const periodLogs = habitLogs.filter((l) => l.date >= startStr);
  if (periodLogs.length === 0) return 0;
  const done = periodLogs.filter((l) => l.status === "done").length;
  return Math.round((done / periodLogs.length) * 100);
}

export function calculateBestDay(logs: HabitLog[]): { date: string; count: number } {
  const dayCounts = new Map<string, number>();
  for (const log of logs) {
    if (log.status === "done") {
      dayCounts.set(log.date, (dayCounts.get(log.date) || 0) + 1);
    }
  }
  let best = { date: "", count: 0 };
  for (const [date, count] of dayCounts) {
    if (count > best.count) best = { date, count };
  }
  return best;
}

export function calculateWorstDay(logs: HabitLog[]): { date: string; count: number } {
  const dayCounts = new Map<string, { done: number; total: number }>();
  for (const log of logs) {
    if (!dayCounts.has(log.date)) dayCounts.set(log.date, { done: 0, total: 0 });
    const record = dayCounts.get(log.date)!;
    record.total++;
    if (log.status === "done") record.done++;
  }
  let worst = { date: "", count: Infinity };
  for (const [date, { done }] of dayCounts) {
    if (done < worst.count && done < (dayCounts.get(date)?.total || 1)) {
      worst = { date, count: done };
    }
  }
  return worst;
}

export function getCategoryCompletion(logs: HabitLog[], habits: Habit[]): Record<string, { done: number; total: number }> {
  const result: Record<string, { done: number; total: number }> = {};
  for (const habit of habits) {
    const cat = habit.category;
    if (!result[cat]) result[cat] = { done: 0, total: 0 };
    const habitLogs = logs.filter((l) => l.habitId === habit.id);
    result[cat].total += habitLogs.length;
    result[cat].done += habitLogs.filter((l) => l.status === "done").length;
  }
  return result;
}

export function getWeeklyProgress(logs: HabitLog[]): { day: string; done: number; total: number }[] {
  const result: { day: string; done: number; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = logs.filter((l) => l.date === dateStr);
    const dayName = new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(d);
    result.push({
      day: dayName,
      done: dayLogs.filter((l) => l.status === "done").length,
      total: dayLogs.length,
    });
  }
  return result;
}
