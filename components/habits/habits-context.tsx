"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type {
  Habit,
  HabitLog,
  HabitCategory,
  HabitFrequencyType,
  HabitStatus,
  Achievement,
  Reminder,
} from "@/lib/habit-types";
import {
  calculateStreak,
  calculateLongestStreak,
  calculateCompletionPercentage,
  getWeeklyProgress,
} from "@/lib/habit-utils";

interface TodayHabit {
  habit: Habit;
  log?: HabitLog;
}

interface HabitStats {
  total: number;
  doneToday: number;
  plannedToday: number;
  bestStreak: number;
  completionPercent: number;
  weeklyProgress: { day: string; done: number; total: number }[];
}

interface HabitContextValue {
  habits: Habit[];
  logs: HabitLog[];
  achievements: Achievement[];
  reminders: Reminder[];
  todayHabits: TodayHabit[];
  stats: HabitStats;
  loading: boolean;
  addHabit: (data: Partial<Habit>) => Promise<Habit | null>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<Habit | null>;
  deleteHabit: (id: string) => Promise<void>;
  cloneHabit: (id: string) => Promise<void>;
  toggleHabit: (
    habitId: string,
    status: "done" | "missed" | "skipped",
  ) => Promise<void>;
  toggleHabitForDate: (
    habitId: string,
    date: string,
    status: "done" | "missed" | "skipped",
  ) => Promise<void>;
  addReminder: (data: {
    habitId: string;
    time: string;
    daysOfWeek?: number[];
  }) => Promise<void>;
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  addAchievement: (data: Omit<Achievement, "id">) => Promise<void>;
  refresh: () => Promise<void>;
}

const HabitContext = createContext<HabitContextValue | null>(null);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [habitsRes, logsRes, achievementsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch("/api/habit-logs"),
        fetch("/api/achievements"),
      ]);
      if (habitsRes.ok) {
        const data = await habitsRes.json();
        setHabits(Array.isArray(data) ? data : []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data : []);
      }
      if (achievementsRes.ok) {
        const data = await achievementsRes.json();
        setAchievements(Array.isArray(data) ? data : []);
      }
      const remindersRes = await fetch("/api/reminders");
      if (remindersRes.ok) {
        const data = await remindersRes.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch {
      setHabits([]);
      setLogs([]);
      setAchievements([]);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = new Date().toISOString().split("T")[0];
  const dayOfWeek = new Date().getDay();

  const isScheduledToday = useCallback(
    (habit: Habit): boolean => {
      if (habit.status !== "active") return false;
      if (habit.frequencyType === "daily") return true;
      if (habit.frequencyType === "weekly" && habit.frequencyDays) {
        return habit.frequencyDays.includes(dayOfWeek);
      }
      if (habit.frequencyType === "interval" && habit.frequencyInterval) {
        const lastLog = [...logs]
          .filter((l) => l.habitId === habit.id)
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!lastLog) return true;
        const daysSince = Math.floor(
          (new Date(today + "T00:00:00Z").getTime() -
            new Date(lastLog.date + "T00:00:00Z").getTime()) /
            86400000,
        );
        return daysSince >= habit.frequencyInterval;
      }
      return false;
    },
    [logs, today, dayOfWeek],
  );

  const todayHabits = useMemo(() => {
    return habits
      .filter((h) => isScheduledToday(h))
      .map((habit) => ({
        habit,
        log: logs.find((l) => l.habitId === habit.id && l.date === today),
      }));
  }, [habits, logs, today, isScheduledToday]);

  const stats = useMemo((): HabitStats => {
    const active = habits.filter((h) => h.status === "active");
    const todayLogs = logs.filter((l) => l.date === today);
    const doneToday = todayLogs.filter((l) => l.status === "done").length;
    const allStreaks = active.map((h) => calculateLongestStreak(h.id, logs));
    const bestStreak = Math.max(0, ...allStreaks);
    const allCompletion = active.map((h) =>
      calculateCompletionPercentage(h.id, logs, 30),
    );
    const avgCompletion =
      active.length > 0
        ? Math.round(allCompletion.reduce((s, v) => s + v, 0) / active.length)
        : 0;
    return {
      total: active.length,
      doneToday,
      plannedToday: todayHabits.length,
      bestStreak,
      completionPercent: avgCompletion,
      weeklyProgress: getWeeklyProgress(logs),
    };
  }, [habits, logs, today, todayHabits]);

  const addHabit = useCallback(
    async (data: Partial<Habit>): Promise<Habit | null> => {
      try {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        const created: Habit = await res.json();
        setHabits((prev) => [...prev, created]);
        return created;
      } catch {
        return null;
      }
    },
    [],
  );

  const updateHabit = useCallback(
    async (id: string, data: Partial<Habit>): Promise<Habit | null> => {
      try {
        const res = await fetch(`/api/habits?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) return null;
        const updated: Habit = await res.json();
        setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
        return updated;
      } catch {
        return null;
      }
    },
    [],
  );

  const deleteHabit = useCallback(async (id: string) => {
    try {
      await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch {
      //
    }
  }, []);

  const cloneHabit = useCallback(
    async (id: string) => {
      const original = habits.find((h) => h.id === id);
      if (!original) return;
      const { id: _, createdAt: _c, updatedAt: _u, ...rest } = original;
      await addHabit({ ...rest, name: `${original.name} (копия)` });
    },
    [habits, addHabit],
  );

  const toggleHabit = useCallback(
    async (habitId: string, status: "done" | "missed" | "skipped") => {
      try {
        const res = await fetch("/api/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date: today, status }),
        });
        if (!res.ok) return;
        const updatedLog: HabitLog = await res.json();
        setLogs((prev) => {
          const filtered = prev.filter(
            (l) => !(l.habitId === habitId && l.date === today),
          );
          return [...filtered, updatedLog];
        });
      } catch {
        //
      }
    },
    [today],
  );

  const toggleHabitForDate = useCallback(
    async (
      habitId: string,
      date: string,
      status: "done" | "missed" | "skipped",
    ) => {
      try {
        const res = await fetch("/api/habit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ habitId, date, status }),
        });
        if (!res.ok) return;
        const updatedLog: HabitLog = await res.json();
        setLogs((prev) => {
          const filtered = prev.filter(
            (l) => !(l.habitId === habitId && l.date === date),
          );
          return [...filtered, updatedLog];
        });
      } catch {
        //
      }
    },
    [],
  );

  const addReminder = useCallback(
    async (data: { habitId: string; time: string; daysOfWeek?: number[] }) => {
      try {
        const res = await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, enabled: true }),
        });
        if (!res.ok) return;
        const created: Reminder = await res.json();
        setReminders((prev) => [...prev, created]);
      } catch {
        //
      }
    },
    [],
  );

  const updateReminder = useCallback(
    async (id: string, data: Partial<Reminder>) => {
      try {
        const res = await fetch(`/api/reminders?id=${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) return;
        const updated: Reminder = await res.json();
        setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
      } catch {
        //
      }
    },
    [],
  );

  const deleteReminder = useCallback(async (id: string) => {
    try {
      await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      //
    }
  }, []);

  const addAchievement = useCallback(async (data: Omit<Achievement, "id">) => {
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      const created: Achievement = await res.json();
      setAchievements((prev) => [...prev, created]);
    } catch {
      //
    }
  }, []);

  const value = useMemo(
    () => ({
      habits,
      logs,
      achievements,
      reminders,
      todayHabits,
      stats,
      loading,
      addHabit,
      updateHabit,
      deleteHabit,
      cloneHabit,
      toggleHabit,
      toggleHabitForDate,
      addReminder,
      updateReminder,
      deleteReminder,
      addAchievement,
      refresh: fetchAll,
    }),
    [
      habits,
      logs,
      achievements,
      reminders,
      todayHabits,
      stats,
      loading,
      addHabit,
      updateHabit,
      deleteHabit,
      cloneHabit,
      toggleHabit,
      toggleHabitForDate,
      addReminder,
      updateReminder,
      deleteReminder,
      addAchievement,
      fetchAll,
    ],
  );

  return (
    <HabitContext.Provider value={value}>{children}</HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabits must be used within HabitProvider");
  return ctx;
}
