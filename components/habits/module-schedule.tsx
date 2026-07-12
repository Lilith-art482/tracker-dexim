"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Habit, HabitLog } from "@/lib/habit-types";
import { WEEKDAYS } from "@/lib/habit-types";

interface ModuleScheduleProps {
  habits: Habit[];
  logs: HabitLog[];
  onToggleHabit: (habitId: string, date: string, status: string) => void;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function parseUTC(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00Z");
}

function fmt(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function isDateScheduled(habit: Habit, date: Date): boolean {
  if (habit.frequencyType === "daily") return true;
  if (habit.frequencyType === "weekly" && habit.frequencyDays) {
    return habit.frequencyDays.includes(date.getUTCDay());
  }
  if (habit.frequencyType === "interval" && habit.frequencyInterval) {
    const created = parseUTC(habit.createdAt);
    const diff = daysBetween(created, date);
    return diff > 0 && diff % habit.frequencyInterval === 0;
  }
  return false;
}

const DAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function ModuleSchedule({
  habits,
  logs,
  onToggleHabit,
}: ModuleScheduleProps) {
  const [cursor, setCursor] = useState(new Date());
  const [rollover, setRollover] = useState(false);

  const today = todayStr();
  const now = new Date();
  const cy = cursor.getUTCFullYear();
  const cm = cursor.getUTCMonth();
  const dim = new Date(cy, cm + 1, 0).getDate();
  const startDow = new Date(cy, cm, 1).getUTCDay();

  const scheduled = useMemo(
    () =>
      habits.filter(
        (h) =>
          h.status === "active" &&
          (h.frequencyType === "weekly" || h.frequencyType === "interval"),
      ),
    [habits],
  );

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      return d;
    });
  }, [cursor]);

  const weekCount = useMemo(
    () =>
      scheduled.filter((h) => weekDays.some((wd) => isDateScheduled(h, wd)))
        .length,
    [scheduled, weekDays],
  );

  const overdue = useMemo(
    () =>
      scheduled.filter((h) => {
        if (!isDateScheduled(h, new Date())) return false;
        const log = logs.find((l) => l.habitId === h.id && l.date === today);
        return log?.status !== "done";
      }),
    [scheduled, logs, today],
  );

  const getLog = useCallback(
    (hid: string, d: string) =>
      logs.find((l) => l.habitId === hid && l.date === d),
    [logs],
  );

  const nextDate = useCallback(
    (h: Habit): string => {
      const start = parseUTC(h.createdAt);
      let d = new Date(start);
      const limit = new Date(cursor);
      limit.setUTCMonth(limit.getUTCMonth() + 3);
      while (d <= limit) {
        if (isDateScheduled(h, d) && d >= cursor) {
          return fmt(d);
        }
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return "—";
    },
    [cursor],
  );

  const prevMonth = () => setCursor(new Date(cy, cm - 1, 1));
  const nextMonth = () => setCursor(new Date(cy, cm + 1, 1));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Расписание привычек</CardTitle>
          <CardDescription>
            Привычки с еженедельной и интервальной периодичностью
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium">
              {new Intl.DateTimeFormat("ru-RU", {
                month: "long",
                year: "numeric",
              }).format(cursor)}
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="py-1 font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {Array.from({ length: startDow }, (_, i) => (
              <div key={`e-${i}`} />
            ))}
            {Array.from({ length: dim }, (_, i) => {
              const day = i + 1;
              const date = new Date(cy, cm, day);
              const ds = fmt(date);
              const isToday =
                cy === now.getUTCFullYear() &&
                cm === now.getUTCMonth() &&
                day === now.getUTCDate();
              const dayHabits = scheduled.filter((h) =>
                isDateScheduled(h, date),
              );
              const done = dayHabits.filter((h) => {
                const l = getLog(h.id, ds);
                return l?.status === "done";
              }).length;

              return (
                <div
                  key={day}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-md p-1 text-xs",
                    isToday && "bg-primary/10 font-bold ring-1 ring-primary/30",
                  )}
                >
                  <span>{day}</span>
                  {dayHabits.length > 0 && (
                    <span
                      className={cn(
                        "text-[10px]",
                        done === dayHabits.length
                          ? "text-emerald-500"
                          : done > 0
                            ? "text-amber-500"
                            : "text-muted-foreground",
                      )}
                    >
                      {done}/{dayHabits.length}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Недельный обзор</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm">
            На этой неделе предстоит:{" "}
            <span className="font-bold">{weekCount}</span> привычек
          </p>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((wd, i) => {
              const cnt = scheduled.filter((h) =>
                isDateScheduled(h, wd),
              ).length;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-md p-1.5",
                    fmt(wd) === today && "bg-primary/10 font-bold",
                  )}
                >
                  <div className="text-muted-foreground">
                    {DAYS_SHORT[wd.getUTCDay()]}
                  </div>
                  <div className="text-sm">{wd.getUTCDate()}</div>
                  {cnt > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      {cnt} шт
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Просроченные</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Switch
              size="sm"
              checked={rollover}
              onCheckedChange={setRollover}
            />
            <Label className="text-sm">
              Переносить пропущенные на следующий день
            </Label>
          </div>
          {overdue.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет просроченных привычек
            </p>
          ) : (
            overdue.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{h.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {h.frequencyType === "weekly"
                      ? "Еженедельно"
                      : `Каждые ${h.frequencyInterval} дн.`}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleHabit(h.id, today, "done")}
                >
                  <CheckCircle2 className="size-3.5" />
                  Выполнить
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Все запланированные</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {scheduled.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет привычек с расписанием
            </p>
          ) : (
            scheduled.map((h) => {
              const nowLog = getLog(h.id, today);
              const done = nowLog?.status === "done";
              const next = nextDate(h);
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{h.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {h.frequencyType === "weekly"
                          ? "Еженедельно"
                          : `Интервал ${h.frequencyInterval} дн.`}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>След.: {next}</span>
                      <span>Статус: {done ? "выполнено" : "ожидается"}</span>
                    </div>
                  </div>
                  {isDateScheduled(h, new Date()) && !done && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleHabit(h.id, today, "done")}
                    >
                      <CheckCircle2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
