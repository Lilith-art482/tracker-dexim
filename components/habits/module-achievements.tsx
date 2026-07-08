"use client";

import { useMemo } from "react";
import type { Habit, HabitLog, Achievement, AchievementType } from "@/lib/habit-types";
import {
  ACHIEVEMENT_LABELS,
  ACHIEVEMENT_DESCRIPTIONS,
  LEVEL_THRESHOLDS,
} from "@/lib/habit-types";
import { cn } from "@/lib/utils";
import {
  TrophyIcon,
  StarIcon,
  TargetIcon,
  ZapIcon,
  FlameIcon,
  ShieldIcon,
  AwardIcon,
  LockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  MedalIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ModuleAchievementsProps {
  habits: Habit[];
  logs: HabitLog[];
  achievements: Achievement[];
}

const ACHIEVEMENT_ICONS: Record<AchievementType, React.ReactNode> = {
  first_habit: <StarIcon className="size-5" />,
  streak_7: <FlameIcon className="size-5" />,
  streak_30: <ZapIcon className="size-5" />,
  streak_90: <ShieldIcon className="size-5" />,
  total_100: <TrophyIcon className="size-5" />,
  perfect_month: <MedalIcon className="size-5" />,
};

function todayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export function ModuleAchievements({ habits, logs, achievements }: ModuleAchievementsProps) {
  const unlockedTypes = useMemo(() => {
    return new Set(achievements.map((a) => a.type));
  }, [achievements]);

  const achievementDates = useMemo(() => {
    const map = new Map<AchievementType, string>();
    for (const a of achievements) {
      if (!map.has(a.type)) {
        map.set(a.type, a.unlockedAt);
      }
    }
    return map;
  }, [achievements]);

  const points = useMemo(() => {
    let total = 0;
    for (const achievement of achievements) {
      switch (achievement.type) {
        case "first_habit": total += 10; break;
        case "streak_7": total += 20; break;
        case "streak_30": total += 50; break;
        case "streak_90": total += 100; break;
        case "total_100": total += 30; break;
        case "perfect_month": total += 40; break;
      }
    }

    for (const log of logs) {
      if (log.status === "done") {
        const habit = habits.find((h) => h.id === log.habitId);
        if (habit) {
          if (habit.difficulty === "easy") total += 1;
          else if (habit.difficulty === "medium") total += 2;
          else total += 3;
        }
      }
    }
    return total;
  }, [achievements, logs, habits]);

  const currentLevel = useMemo(() => {
    let level = LEVEL_THRESHOLDS[0];
    for (const l of LEVEL_THRESHOLDS) {
      if (points >= l.minPoints) level = l;
    }
    return level;
  }, [points]);

  const nextLevel = useMemo(() => {
    const idx = LEVEL_THRESHOLDS.findIndex((l) => l.level === currentLevel.level);
    if (idx < LEVEL_THRESHOLDS.length - 1) return LEVEL_THRESHOLDS[idx + 1];
    return null;
  }, [currentLevel]);

  const levelProgress = useMemo(() => {
    if (!nextLevel) return 100;
    const prevMin = currentLevel.minPoints;
    const nextMin = nextLevel.minPoints;
    const range = nextMin - prevMin;
    if (range === 0) return 100;
    return Math.min(100, Math.round(((points - prevMin) / range) * 100));
  }, [points, currentLevel, nextLevel]);

  const allAchievementTypes: AchievementType[] = [
    "first_habit",
    "streak_7",
    "streak_30",
    "streak_90",
    "total_100",
    "perfect_month",
  ];

  const goals = useMemo(() => {
    return habits.filter((h) => h.goal && h.goalValue);
  }, [habits]);

  const goalProgress = useMemo(() => {
    return goals.map((habit) => {
      const habitLogs = logs.filter((l) => l.habitId === habit.id);
      const doneCount = habitLogs.filter((l) => l.status === "done").length;

      let progress = 0;
      if (habit.goalType === "streak") {
        let streak = 0;
        const sorted = habitLogs
          .filter((l) => l.status === "done")
          .sort((a, b) => b.date.localeCompare(a.date));
        const today = todayUTC();
        let checkDate = today;
        for (const log of sorted) {
          if (log.date === checkDate) {
            streak++;
            const d = new Date(checkDate + "T00:00:00Z");
            d.setUTCDate(d.getUTCDate() - 1);
            checkDate = d.toISOString().split("T")[0];
          } else {
            break;
          }
        }
        progress = Math.min(100, Math.round((streak / (habit.goalValue || 1)) * 100));
      } else {
        progress = Math.min(100, Math.round((doneCount / (habit.goalValue || 1)) * 100));
      }

      return { habit, doneCount, progress };
    });
  }, [goals, logs]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Мой уровень</CardTitle>
          <CardDescription>
            {LEVEL_THRESHOLDS.length} уровней мастерства привычек
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <div className="flex size-20 items-center justify-center rounded-full bg-[#4E6E62]/10 ring-4 ring-[#4E6E62]/20">
              <AwardIcon className="size-10 text-[#4E6E62]" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <span className="text-2xl font-bold">{currentLevel.title}</span>
                <Badge variant="secondary">Ур. {currentLevel.level}</Badge>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{points} очков</span>
                  {nextLevel && (
                    <span className="text-muted-foreground">
                      {nextLevel.minPoints - points} до {nextLevel.title}
                    </span>
                  )}
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#4E6E62] transition-all"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LEVEL_THRESHOLDS.map((lvl) => (
              <div
                key={lvl.level}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors",
                  lvl.level <= currentLevel.level
                    ? "bg-[#4E6E62]/10 text-[#4E6E62]"
                    : "bg-muted text-muted-foreground/50",
                )}
              >
                <span className="text-xs font-medium">{lvl.title}</span>
                <span className="text-[10px]">{lvl.minPoints} pts</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {goalProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Прогресс по целям</CardTitle>
            <CardDescription>
              Текущие цели привычек
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalProgress.map(({ habit, doneCount, progress }) => (
              <div key={habit.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TargetIcon className="size-4 text-[#4E6E62]" />
                    <div>
                      <span className="text-sm font-medium">{habit.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {habit.goal} · {habit.goalType === "streak" ? `${doneCount}/${habit.goalValue} дней` : `${doneCount}/${habit.goalValue} раз`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={progress >= 100 ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {progress}%
                  </Badge>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      progress >= 100 ? "bg-emerald-500" : "bg-[#4E6E62]",
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Достижения</CardTitle>
          <CardDescription>
            {achievements.length} из {allAchievementTypes.length} получено
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {allAchievementTypes.map((type) => {
              const unlocked = unlockedTypes.has(type);
              const date = achievementDates.get(type);
              const isNew = date && new Date(date + "T00:00:00Z") > new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={type}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    unlocked
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : "border-border opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      unlocked ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {unlocked ? ACHIEVEMENT_ICONS[type] : <LockIcon className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          unlocked ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground",
                        )}
                      >
                        {ACHIEVEMENT_LABELS[type]}
                      </span>
                      {isNew && (
                        <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ACHIEVEMENT_DESCRIPTIONS[type]}
                    </p>
                    {unlocked && date && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CalendarIcon className="size-3" />
                        Получено: {formatDate(date)}
                      </p>
                    )}
                  </div>
                  {unlocked && (
                    <CheckCircle2Icon className="size-5 shrink-0 text-emerald-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
