"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createElement,
} from "react";
import {
  PiggyBank,
  Target,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Archive,
  RotateCcw,
  ChevronDown,
  ArrowRight,
  Minus,
  Info,
} from "lucide-react";
import type {
  FinanceGoal,
  GoalPriority,
  TransactionCategory,
} from "@/lib/finance-types";
import {
  getGoalsByUser,
  createGoal,
  updateGoal,
  deleteGoal,
  getCategoriesByUser,
} from "@/lib/finance-client";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getFinanceIcon } from "@/lib/finance-icons";

const PRIORITY_LABELS: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-800",
  medium:
    "bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-800",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800",
};

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function FinanceGoals() {
  const uid = auth.currentUser?.uid || "user-1";
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinanceGoal | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, string>>(
    {},
  );
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [showCategoryHint, setShowCategoryHint] = useState(false);

  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formCurrent, setFormCurrent] = useState("0");
  const [formDeadline, setFormDeadline] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formCategoryId, setFormCategoryId] = useState("");

  const resetForm = useCallback(() => {
    setFormName("");
    setFormTarget("");
    setFormCurrent("0");
    setFormDeadline("");
    setFormPriority("medium");
    setFormCategoryId("");
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGoalsByUser(uid);
      setGoals(data);
    } catch {
      console.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCategoriesByUser(uid);
        setCategories(data.filter((c) => !c.isArchived));
      } catch {
        // categories fetch is secondary
      }
    })();
  }, [uid]);

  const activeGoals = useMemo(() => goals.filter((g) => !g.completed), [goals]);
  const completedGoals = useMemo(
    () => goals.filter((g) => g.completed),
    [goals],
  );

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = completedGoals.length;
    const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    return { total, completed, totalTarget, totalSaved };
  }, [goals, completedGoals]);

  const openAddDialog = useCallback(() => {
    setEditingGoal(null);
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((goal: FinanceGoal) => {
    setEditingGoal(goal);
    setFormName(goal.name);
    setFormTarget(String(goal.targetAmount));
    setFormCurrent(String(goal.currentAmount));
    setFormDeadline(goal.deadline);
    setFormPriority(goal.priority);
    setFormCategoryId(goal.categoryId || "");
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    resetForm();
    setEditingGoal(null);
  }, [resetForm]);

  const handleSave = useCallback(async () => {
    if (!formName.trim() || !formTarget || !formDeadline) {
      toast.error("Заполните обязательные поля");
      return;
    }
    const targetAmount = Number(formTarget);
    const currentAmount = Number(formCurrent);
    if (targetAmount <= 0) {
      toast.error("Целевая сумма должна быть больше 0");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Сохраняем...");

    try {
      if (editingGoal) {
        const updated = await updateGoal(editingGoal.id, {
          name: formName.trim(),
          targetAmount,
          currentAmount,
          deadline: formDeadline,
          priority: formPriority as GoalPriority,
          ...(formCategoryId ? { categoryId: formCategoryId } : {}),
        });
        setGoals((prev) =>
          prev.map((g) => (g.id === editingGoal.id ? updated : g)),
        );
        toast.success("Цель обновлена", { id: toastId });
        handleCloseDialog();
      } else {
        const id = crypto.randomUUID();
        const created = await createGoal({
          id,
          userId: uid,
          name: formName.trim(),
          targetAmount,
          currentAmount,
          deadline: formDeadline,
          priority: formPriority as GoalPriority,
          ...(formCategoryId ? { categoryId: formCategoryId } : {}),
          completed: false,
        });
        setGoals((prev) => [...prev, created]);
        toast.success("Цель создана", { id: toastId });
        handleCloseDialog();
      }
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    } finally {
      setSaving(false);
    }
  }, [
    formName,
    formTarget,
    formCurrent,
    formDeadline,
    formPriority,
    formCategoryId,
    editingGoal,
    handleCloseDialog,
    uid,
  ]);

  const handleDelete = useCallback(async (goal: FinanceGoal) => {
    const toastId = toast.loading("Удаляем...");
    try {
      await deleteGoal(goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      toast.success("Цель удалена", { id: toastId });
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  }, []);

  const handleToggleComplete = useCallback(async (goal: FinanceGoal) => {
    const completed = !goal.completed;
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, completed } : g)),
    );

    const toastId = toast.loading(
      completed ? "Завершаем..." : "Восстанавливаем...",
    );
    try {
      const updated = await updateGoal(goal.id, { completed });
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
      toast.success(completed ? "Цель завершена!" : "Цель восстановлена", {
        id: toastId,
      });
    } catch {
      toast.success(completed ? "Цель завершена!" : "Цель восстановлена", {
        id: toastId,
      });
    }
  }, []);

  const handleAdjustGoal = useCallback(
    async (goal: FinanceGoal, delta: number) => {
      if (delta === 0) return;
      const newAmount = Math.max(0, goal.currentAmount + delta);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id ? { ...g, currentAmount: newAmount } : g,
        ),
      );
      setAdjustAmounts((prev) => ({ ...prev, [goal.id]: "" }));

      const label = delta > 0 ? "Пополнено" : "Списано";
      const toastId = toast.loading(
        delta > 0 ? "Пополняем..." : "Списываем...",
      );
      try {
        const updated = await updateGoal(goal.id, { currentAmount: newAmount });
        setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
        toast.success(`${label} ${Math.abs(delta).toLocaleString()} ₽`, {
          id: toastId,
        });
      } catch {
        toast.error("Ошибка сети", { id: toastId });
      }
    },
    [],
  );

  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              Всего целей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              Завершено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/10">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              Общая цель
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalTarget.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-500/10">
                <PiggyBank className="h-4 w-4 text-sky-600" />
              </div>
              Накоплено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalSaved.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить цель
        </Button>
      </div>

      {activeGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 ring-1 ring-emerald-500/20">
              <Target className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">Нет активных целей</p>
            <p className="text-xs text-muted-foreground mt-1">
              Поставьте первую финансовую цель
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={openAddDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать цель
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGoals.map((goal) => {
            const progressPct =
              goal.targetAmount > 0
                ? Math.min(
                    Math.round((goal.currentAmount / goal.targetAmount) * 100),
                    100,
                  )
                : 0;
            const daysRemaining = daysBetween(today, goal.deadline);
            const remaining = goal.targetAmount - goal.currentAmount;
            const perDay =
              daysRemaining > 0 && remaining > 0
                ? Math.ceil(remaining / daysRemaining)
                : 0;
            const perMonth = perDay * 30;

            return (
              <Card
                key={goal.id}
                className="relative overflow-hidden transition-all hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          progressPct >= 100
                            ? "bg-emerald-100 dark:bg-emerald-500/10"
                            : "bg-emerald-100 dark:bg-emerald-500/10",
                        )}
                      >
                        {progressPct >= 100 ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Target className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-medium truncate">
                          {goal.name}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-xs",
                        PRIORITY_STYLES[goal.priority] ||
                          PRIORITY_STYLES.medium,
                      )}
                    >
                      {PRIORITY_LABELS[goal.priority] || goal.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Прогресс</span>
                    <span className="font-semibold">
                      {goal.currentAmount.toLocaleString()} /{" "}
                      {goal.targetAmount.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progressPct >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-green-500"
                          : "bg-gradient-to-r from-emerald-500 to-green-500",
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {progressPct}%
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {daysRemaining > 0
                          ? `${daysRemaining} дн.`
                          : daysRemaining === 0
                            ? "Последний день!"
                            : "Просрочено"}
                      </span>
                    </div>
                  </div>

                  {remaining > 0 && daysRemaining > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span>
                        {perDay.toLocaleString()} ₽/день ·{" "}
                        {perMonth.toLocaleString()} ₽/мес
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        value={adjustAmounts[goal.id] ?? ""}
                        onChange={(e) =>
                          setAdjustAmounts((prev) => ({
                            ...prev,
                            [goal.id]: e.target.value,
                          }))
                        }
                        placeholder="Сумма"
                        min={0}
                        className="h-8 text-xs pr-2"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      disabled={
                        !adjustAmounts[goal.id] ||
                        Number(adjustAmounts[goal.id]) <= 0
                      }
                      onClick={() =>
                        handleAdjustGoal(goal, Number(adjustAmounts[goal.id]))
                      }
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Пополнить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      disabled={
                        !adjustAmounts[goal.id] ||
                        Number(adjustAmounts[goal.id]) <= 0
                      }
                      onClick={() =>
                        handleAdjustGoal(goal, -Number(adjustAmounts[goal.id]))
                      }
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Снять
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => openEditDialog(goal)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8"
                      onClick={() => handleToggleComplete(goal)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Готово
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleDelete(goal)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {completedGoals.length > 0 && (
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setArchivedOpen(!archivedOpen)}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                  <Archive className="h-4 w-4 text-emerald-600" />
                </div>
                Завершённые ({completedGoals.length})
                <ChevronDown
                  className={cn(
                    "h-4 w-4 ml-auto transition-transform",
                    archivedOpen && "rotate-180",
                  )}
                />
              </CardTitle>
            </CardHeader>
          </button>
          {archivedOpen && (
            <CardContent className="space-y-1 pb-4">
              {completedGoals.map((goal) => {
                const daysRemaining = daysBetween(today, goal.deadline);
                return (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm line-through text-muted-foreground font-medium">
                          {goal.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {goal.currentAmount.toLocaleString()} /{" "}
                          {goal.targetAmount.toLocaleString()} ₽
                          {daysRemaining > 0 && " · Завершено досрочно"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleToggleComplete(goal)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600" />

          <DialogHeader className="pt-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {editingGoal ? "Редактировать цель" : "Новая цель"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editingGoal
                    ? "Измените параметры цели"
                    : "Поставьте финансовую цель и следите за прогрессом"}
                </p>
              </div>
            </div>
          </DialogHeader>

          {Number(formTarget) > 0 && (
            <div className="mx-6 p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-200/50 dark:border-emerald-500/20">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Прогресс</span>
                <span className="font-semibold">
                  {Math.min(
                    Math.round(
                      (Number(formCurrent) / Number(formTarget)) * 100,
                    ),
                    100,
                  )}
                  %
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                  style={{
                    width: `${Math.min(Math.round((Number(formCurrent) / Number(formTarget)) * 100), 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1.5">
                {Number(formCurrent).toLocaleString()} /{" "}
                {Number(formTarget).toLocaleString()} ₽
              </p>
            </div>
          )}

          <div className="px-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Название цели</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Например: Новый ноутбук"
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Целевая сумма</label>
                <Input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="150000"
                  min={1}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Уже накоплено</label>
                <Input
                  type="number"
                  value={formCurrent}
                  onChange={(e) => setFormCurrent(e.target.value)}
                  placeholder="0"
                  min={0}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Дедлайн</label>
                <Input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Приоритет</label>
                <div className="grid grid-cols-3 gap-1">
                  {(["high", "medium", "low"] as const).map((p) => {
                    const colors = {
                      high: "data-[active=true]:bg-rose-500 data-[active=true]:text-white data-[active=true]:border-rose-500 border-rose-200 text-rose-600 dark:border-rose-800 dark:text-rose-400 dark:data-[active=true]:bg-rose-600 dark:data-[active=true]:border-rose-600",
                      medium:
                        "data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500 border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400 dark:data-[active=true]:bg-amber-600 dark:data-[active=true]:border-amber-600",
                      low: "data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:border-emerald-500 border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400 dark:data-[active=true]:bg-emerald-600 dark:data-[active=true]:border-emerald-600",
                    };
                    return (
                      <button
                        key={p}
                        type="button"
                        data-active={formPriority === p}
                        onClick={() => setFormPriority(p)}
                        className={cn(
                          "h-9 rounded-lg border text-xs font-medium transition-all hover:opacity-80",
                          colors[p],
                          formPriority !== p &&
                            "bg-transparent text-muted-foreground border-input",
                        )}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                Связать с категорией (необязательно)
                <button
                  type="button"
                  onClick={() => setShowCategoryHint(!showCategoryHint)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </label>
              <Select
                value={formCategoryId || "__none__"}
                onValueChange={(v) =>
                  setFormCategoryId(v === "__none__" || !v ? "" : v)
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Без категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Без категории</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        {createElement(getFinanceIcon(cat.icon), {
                          className: "h-4 w-4",
                          style: cat.color ? { color: cat.color } : undefined,
                        })}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCategoryHint && (
                <p className="text-xs text-muted-foreground leading-relaxed rounded-lg bg-muted/50 px-3 py-2">
                  Привяжите категорию расходов или доходов из раздела
                  «Настройки», чтобы транзакции по ней автоматически учитывались
                  в прогрессе цели. Если вам нужно несколько целей с одной и той
                  же категорией (например, «Стройматериалы» для дома и для
                  квартиры), создайте для каждой отдельную категорию в
                  настройках.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 pt-2 gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="h-10"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-10 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGoal ? "Сохранить" : "Создать цель"}
              {!saving && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
