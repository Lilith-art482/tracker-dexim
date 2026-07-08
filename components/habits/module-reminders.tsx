"use client";

import { useState, useCallback } from "react";
import {
  Bell,
  BellOff,
  Plus,
  Pencil,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { Habit, HabitLog, Reminder } from "@/lib/habit-types";

interface ModuleRemindersProps {
  habits: Habit[];
  reminders: Reminder[];
  onAddReminder: (data: {
    habitId: string;
    time: string;
    daysOfWeek?: number[];
  }) => void;
  onUpdateReminder: (id: string, data: Partial<Reminder>) => void;
  onDeleteReminder: (id: string) => void;
  todayHabits: { habit: Habit; log?: HabitLog }[];
  onToggleHabit: (habitId: string, date: string, status: string) => void;
}

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function getHabitName(habits: Habit[], habitId: string): string {
  return habits.find((h) => h.id === habitId)?.name ?? "Неизвестная привычка";
}

function formatDays(days?: number[]): string {
  if (!days || days.length === 0) return "Каждый день";
  if (days.length === 7) return "Каждый день";
  if (days.length === 5 && days.every((d) => d >= 1 && d <= 5))
    return "Будни";
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d])
    .join(", ");
}

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function ModuleReminders({
  habits,
  reminders,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  todayHabits,
  onToggleHabit,
}: ModuleRemindersProps) {
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formHabitId, setFormHabitId] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formDays, setFormDays] = useState<number[]>([]);

  const resetForm = useCallback(() => {
    setFormHabitId("");
    setFormTime("09:00");
    setFormDays([]);
    setEditingId(null);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Уведомления не поддерживаются в этом браузере");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === "granted") {
      toast.success("Уведомления включены");
    } else {
      toast.error("Разрешение на уведомления отклонено");
    }
  }, []);

  const handleAdd = useCallback(() => {
    if (!formHabitId) {
      toast.error("Выберите привычку");
      return;
    }
    onAddReminder({
      habitId: formHabitId,
      time: formTime,
      daysOfWeek: formDays.length > 0 ? formDays : undefined,
    });
    setAddOpen(false);
    resetForm();
    toast.success("Напоминание добавлено");
  }, [formHabitId, formTime, formDays, onAddReminder, resetForm]);

  const openEdit = useCallback(
    (r: Reminder) => {
      setEditingId(r.id);
      setFormHabitId(r.habitId);
      setFormTime(r.time);
      setFormDays(r.daysOfWeek ?? []);
      setEditOpen(true);
    },
    [],
  );

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    if (!formHabitId) {
      toast.error("Выберите привычку");
      return;
    }
    onUpdateReminder(editingId, {
      habitId: formHabitId,
      time: formTime,
      daysOfWeek: formDays.length > 0 ? formDays : undefined,
    });
    setEditOpen(false);
    resetForm();
    toast.success("Напоминание обновлено");
  }, [editingId, formHabitId, formTime, formDays, onUpdateReminder, resetForm]);

  const toggleDay = useCallback(
    (day: number) => {
      setFormDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
      );
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteId) return;
    onDeleteReminder(deleteId);
    setDeleteId(null);
    toast.success("Напоминание удалено");
  }, [deleteId, onDeleteReminder]);

  const unfinishedHabits = todayHabits.filter((th) => th.log?.status !== "done");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Напоминания</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotificationPermission}
            >
              {notifPermission === "granted" ? (
                <Bell className="size-4" />
              ) : (
                <BellOff className="size-4" />
              )}
              {notifPermission === "granted"
                ? "Уведомления включены"
                : "Включить уведомления"}
            </Button>
          </div>

          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Напоминаний пока нет. Добавьте новое напоминание.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {reminders.map((r) => {
                const habitName = getHabitName(habits, r.habitId);
                return (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 sm:flex-nowrap"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium">
                        {habitName}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {r.time}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {formatDays(r.daysOfWeek)}
                        </span>
                        {!r.enabled && (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <BellOff className="size-3" />
                            отключено
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        size="sm"
                        checked={r.enabled}
                        onCheckedChange={(checked) =>
                          onUpdateReminder(r.id, { enabled: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(r)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={<Button variant="outline" size="sm" />}
            >
              <Plus className="size-4" />
              Добавить напоминание
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новое напоминание</DialogTitle>
                <DialogDescription>
                  Выберите привычку и время для напоминания
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Привычка</Label>
                  <Select
                    value={formHabitId}
                    onValueChange={(v) => setFormHabitId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите привычку" />
                    </SelectTrigger>
                    <SelectContent>
                      {habits.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Время</Label>
                  <Input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Дни недели</Label>
                  <div className="flex flex-wrap gap-1">
                    {ALL_DAYS.map((day) => (
                      <Button
                        key={day}
                        variant={
                          formDays.includes(day) ? "default" : "outline"
                        }
                        size="sm"
                        className="size-8 p-0 text-xs"
                        onClick={() => toggleDay(day)}
                      >
                        {DAY_LABELS[day]}
                      </Button>
                    ))}
                  </div>
                  {formDays.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Не выбрано — каждый день
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Отмена
                </DialogClose>
                <Button onClick={handleAdd}>Добавить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Редактировать напоминание</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Привычка</Label>
                  <Select
                    value={formHabitId}
                    onValueChange={(v) => setFormHabitId(v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {habits.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Время</Label>
                  <Input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Дни недели</Label>
                  <div className="flex flex-wrap gap-1">
                    {ALL_DAYS.map((day) => (
                      <Button
                        key={day}
                        variant={
                          formDays.includes(day) ? "default" : "outline"
                        }
                        size="sm"
                        className="size-8 p-0 text-xs"
                        onClick={() => toggleDay(day)}
                      >
                        {DAY_LABELS[day]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Отмена
                </DialogClose>
                <Button onClick={saveEdit}>Сохранить</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!deleteId}
            onOpenChange={(open) => !open && setDeleteId(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Удалить напоминание?</DialogTitle>
                <DialogDescription>
                  Это действие нельзя отменить.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Отмена
                </DialogClose>
                <Button variant="destructive" onClick={confirmDelete}>
                  Удалить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Вечерний обзор</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {unfinishedHabits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              На сегодня всё выполнено
            </p>
          ) : (
            unfinishedHabits.map((th) => (
              <div
                key={th.habit.id}
                className="flex items-center justify-between gap-2 rounded-lg border p-3"
              >
                <span className="text-sm font-medium">{th.habit.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onToggleHabit(th.habit.id, todayString(), "done")
                  }
                >
                  <CheckCircle2 className="size-3.5" />
                  Сделать сейчас
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Пропущенные напоминания</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {reminders.filter((r) => !r.enabled).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет пропущенных напоминаний
            </p>
          ) : (
            reminders
              .filter((r) => !r.enabled)
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {getHabitName(habits, r.habitId)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <Clock className="mr-1 inline size-3" />
                      {r.time}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateReminder(r.id, { enabled: true })}
                  >
                    Включить
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}