"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, GripVertical, CheckSquare, Square, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Habit, HabitChecklistItem } from "@/lib/habit-types";

interface ModuleChecklistsProps {
  habits: Habit[];
  onUpdateHabit: (id: string, data: Partial<Habit>) => void;
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

export function ModuleChecklists({
  habits,
  onUpdateHabit,
}: ModuleChecklistsProps) {
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, string[]>>({});

  const checklistHabits = habits.filter(
    (h) => h.status === "active" && h.checklistMode,
  );

  const getItems = useCallback(
    (habitId: string): HabitChecklistItem[] => {
      const raw = localStorage.getItem(`checklist_${habitId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }
      return [];
    },
    [],
  );

  const saveItems = useCallback(
    (habitId: string, items: HabitChecklistItem[]) => {
      localStorage.setItem(`checklist_${habitId}`, JSON.stringify(items));
    },
    [],
  );

  const addItem = useCallback(
    (habitId: string) => {
      const text = newItemText[habitId]?.trim();
      if (!text) {
        toast.error("Введите текст пункта");
        return;
      }
      const items = getItems(habitId);
      const newItem: HabitChecklistItem = {
        id: generateId(),
        habitId,
        text,
        order: items.length,
        createdAt: new Date().toISOString(),
      };
      saveItems(habitId, [...items, newItem]);
      setNewItemText((prev) => ({ ...prev, [habitId]: "" }));
      toast.success("Пункт добавлен");
    },
    [newItemText, getItems, saveItems],
  );

  const removeItem = useCallback(
    (habitId: string, itemId: string) => {
      const items = getItems(habitId);
      saveItems(
        habitId,
        items.filter((it) => it.id !== itemId),
      );
      toast.success("Пункт удалён");
    },
    [getItems, saveItems],
  );

  const toggleStatus = useCallback(
    (habitId: string, itemId: string) => {
      setCheckedItems((prev) => {
        const current = prev[habitId] ?? [];
        const next = current.includes(itemId)
          ? current.filter((id) => id !== itemId)
          : [...current, itemId];
        return { ...prev, [habitId]: next };
      });
    },
    [],
  );

  const toggleMode = useCallback(
    (habitId: string) => {
      const habit = checklistHabits.find((h) => h.id === habitId);
      if (!habit) return;
      const nextMode = habit.checklistMode === "all" ? "half" : "all";
      onUpdateHabit(habitId, { checklistMode: nextMode });
      toast.success(
        nextMode === "all" ? "Нужно всё выполнить" : "Достаточно 50%",
      );
    },
    [checklistHabits, onUpdateHabit],
  );

  if (checklistHabits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Чеклисты</CardTitle>
          <CardDescription>
            Привычки с режимом чеклиста
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Нет привычек с чеклистом. Включите чеклист в настройках привычки.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {checklistHabits.map((habit) => {
        const items = getItems(habit.id);
        const checked = checkedItems[habit.id] ?? [];
        const progress =
          items.length > 0
            ? Math.round((checked.length / items.length) * 100)
            : 0;
        const threshold =
          habit.checklistMode === "half"
            ? Math.ceil(items.length / 2)
            : items.length;
        const isComplete = checked.length >= threshold;

        return (
          <Card key={habit.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{habit.name}</CardTitle>
                <Badge
                  variant={habit.checklistMode === "all" ? "default" : "secondary"}
                  className="cursor-pointer text-[10px]"
                  onClick={() => toggleMode(habit.id)}
                >
                  {habit.checklistMode === "all" ? "100%" : "50%"}
                </Badge>
              </div>
              <CardDescription>
                {habit.checklistMode === "all"
                  ? "Нужно выполнить все пункты"
                  : "Достаточно выполнить 50%"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isComplete ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {checked.length}/{items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Пунктов пока нет. Добавьте первый пункт.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {items.map((item) => {
                    const isChecked = checked.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-2.5 transition-colors",
                          isChecked && "bg-muted/50",
                        )}
                      >
                        <button
                          type="button"
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleStatus(habit.id, item.id)}
                        >
                          {isChecked ? (
                            <CheckSquare className="size-4 text-emerald-500" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            isChecked &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeItem(habit.id, item.id)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Новый пункт..."
                  value={newItemText[habit.id] ?? ""}
                  onChange={(e) =>
                    setNewItemText((prev) => ({
                      ...prev,
                      [habit.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addItem(habit.id);
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(habit.id)}
                >
                  <Plus className="size-4" />
                  Добавить
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}