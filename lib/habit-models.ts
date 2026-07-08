import { getAdminDb } from "./firebase-admin";
import { TableName } from "./schema";
import { Habit, HabitLog, Achievement, Reminder } from "./habit-types";

import { mockHabits, mockHabitLogs, mockAchievements, mockReminders } from "./habit-mock-data";
import { isDatabaseAvailable } from "./db";

const COL = (name: string) => name;

const toPlain = <T>(snap: { id: string; data: () => T }): T & { id: string } => ({
  id: snap.id,
  ...snap.data(),
});

// --- Utilities ---

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Habits ---

export async function getAllHabits(): Promise<Habit[]> {
  if (!(await isDatabaseAvailable())) return mockHabits;
  const snap = await getAdminDb().collection(COL(TableName.HABITS)).get();
  return snap.docs.map((d) => toPlain(d) as Habit);
}

export async function getHabitsByOwner(ownerId: string): Promise<Habit[]> {
  if (!(await isDatabaseAvailable())) return mockHabits;
  const snap = await getAdminDb()
    .collection(COL(TableName.HABITS))
    .where("ownerId", "==", ownerId)
    .get();
  return snap.docs.map((d) => toPlain(d) as Habit);
}

export async function getHabitById(id: string): Promise<Habit | null> {
  if (!(await isDatabaseAvailable())) return mockHabits.find((h) => h.id === id) || null;
  const snap = await getAdminDb().collection(COL(TableName.HABITS)).doc(id).get();
  if (!snap.exists) return null;
  return toPlain(snap) as Habit;
}

export async function createHabit(
  data: Omit<Habit, "id" | "createdAt" | "updatedAt">
): Promise<Habit> {
  const now = new Date().toISOString();
  const habit: Habit = { id: generateId(), ...data, createdAt: now, updatedAt: now };
  if (!(await isDatabaseAvailable())) return habit;
  await getAdminDb().collection(COL(TableName.HABITS)).doc(habit.id).set(habit);
  return habit;
}

export async function updateHabit(
  id: string,
  data: Partial<Omit<Habit, "id" | "createdAt" | "updatedAt">>
): Promise<Habit | null> {
  if (!(await isDatabaseAvailable())) {
    const idx = mockHabits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    Object.assign(mockHabits[idx], data, { updatedAt: new Date().toISOString() });
    return mockHabits[idx];
  }
  await getAdminDb()
    .collection(COL(TableName.HABITS))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb().collection(COL(TableName.HABITS)).doc(id).get();
  if (!snap.exists) return null;
  return toPlain(snap) as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  if (!(await isDatabaseAvailable())) return;
  await getAdminDb().collection(COL(TableName.HABITS)).doc(id).delete();
}

// --- Habit Logs ---

export async function getHabitLogs(habitId: string): Promise<HabitLog[]> {
  if (!(await isDatabaseAvailable())) return mockHabitLogs.filter((l) => l.habitId === habitId);
  const snap = await getAdminDb()
    .collection(COL(TableName.HABIT_LOGS))
    .where("habitId", "==", habitId)
    .get();
  return snap.docs.map((d) => toPlain(d) as HabitLog);
}

export async function getHabitLogsForDate(date: string): Promise<HabitLog[]> {
  if (!(await isDatabaseAvailable())) return mockHabitLogs.filter((l) => l.date === date);
  const snap = await getAdminDb()
    .collection(COL(TableName.HABIT_LOGS))
    .where("date", "==", date)
    .get();
  return snap.docs.map((d) => toPlain(d) as HabitLog);
}

export async function getAllLogs(ownerId?: string): Promise<HabitLog[]> {
  if (!(await isDatabaseAvailable())) return mockHabitLogs;
  const snap = ownerId
    ? await getAdminDb().collection(COL(TableName.HABIT_LOGS)).where("ownerId", "==", ownerId).get()
    : await getAdminDb().collection(COL(TableName.HABIT_LOGS)).get();
  return snap.docs.map((d) => toPlain(d) as HabitLog);
}

export async function createLog(
  data: Omit<HabitLog, "id" | "createdAt" | "updatedAt">
): Promise<HabitLog> {
  const now = new Date().toISOString();
  const log: HabitLog = { id: generateId(), ...data, createdAt: now, updatedAt: now };
  if (!(await isDatabaseAvailable())) return log;
  await getAdminDb().collection(COL(TableName.HABIT_LOGS)).doc(log.id).set(log);
  return log;
}

export async function updateLog(
  id: string,
  data: Partial<Pick<HabitLog, "status" | "durationMinutes" | "note">>
): Promise<HabitLog | null> {
  if (!(await isDatabaseAvailable())) return null;
  await getAdminDb()
    .collection(COL(TableName.HABIT_LOGS))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb().collection(COL(TableName.HABIT_LOGS)).doc(id).get();
  if (!snap.exists) return null;
  return toPlain(snap) as HabitLog;
}

export async function getOrCreateLog(habitId: string, date: string): Promise<HabitLog> {
  if (!(await isDatabaseAvailable())) {
    const existing = mockHabitLogs.find((l) => l.habitId === habitId && l.date === date);
    if (existing) return existing;
    const now = new Date().toISOString();
    const log: HabitLog = {
      id: generateId(),
      habitId,
      date,
      status: "done",
      createdAt: now,
      updatedAt: now,
    };
    mockHabitLogs.push(log);
    return log;
  }
  const snap = await getAdminDb()
    .collection(COL(TableName.HABIT_LOGS))
    .where("habitId", "==", habitId)
    .where("date", "==", date)
    .limit(1)
    .get();
  if (!snap.empty) return toPlain(snap.docs[0]) as HabitLog;
  const now = new Date().toISOString();
  const log: HabitLog = {
    id: generateId(),
    habitId,
    date,
    status: "done",
    createdAt: now,
    updatedAt: now,
  };
  await getAdminDb().collection(COL(TableName.HABIT_LOGS)).doc(log.id).set(log);
  return log;
}

// --- Achievements ---

export async function getAllAchievements(): Promise<Achievement[]> {
  if (!(await isDatabaseAvailable())) return mockAchievements;
  const snap = await getAdminDb().collection(COL(TableName.ACHIEVEMENTS)).get();
  return snap.docs.map((d) => toPlain(d) as Achievement);
}

export async function createAchievement(data: Omit<Achievement, "id">): Promise<Achievement> {
  const achievement: Achievement = { id: generateId(), ...data };
  if (!(await isDatabaseAvailable())) return achievement;
  await getAdminDb().collection(COL(TableName.ACHIEVEMENTS)).doc(achievement.id).set(achievement);
  return achievement;
}

// --- Reminders ---

export async function getAllReminders(): Promise<Reminder[]> {
  if (!(await isDatabaseAvailable())) return mockReminders;
  const snap = await getAdminDb().collection(COL(TableName.REMINDERS)).get();
  return snap.docs.map((d) => toPlain(d) as Reminder);
}

export async function createReminder(data: Omit<Reminder, "id" | "createdAt" | "updatedAt">): Promise<Reminder> {
  const now = new Date().toISOString();
  const reminder: Reminder = { id: generateId(), ...data, createdAt: now, updatedAt: now };
  if (!(await isDatabaseAvailable())) return reminder;
  await getAdminDb().collection(COL(TableName.REMINDERS)).doc(reminder.id).set(reminder);
  return reminder;
}

export async function updateReminder(id: string, data: Partial<Omit<Reminder, "id">>): Promise<Reminder | null> {
  if (!(await isDatabaseAvailable())) return null;
  await getAdminDb()
    .collection(COL(TableName.REMINDERS))
    .doc(id)
    .update({ ...data, updatedAt: new Date().toISOString() });
  const snap = await getAdminDb().collection(COL(TableName.REMINDERS)).doc(id).get();
  if (!snap.exists) return null;
  return toPlain(snap) as Reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  if (!(await isDatabaseAvailable())) return;
  await getAdminDb().collection(COL(TableName.REMINDERS)).doc(id).delete();
}

// --- Calculations ---

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
