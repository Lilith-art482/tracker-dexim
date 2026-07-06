"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Circle,
  Archive,
  RotateCcw,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import type { FinanceGoal, FinanceAccount, GoalPriority } from "@/lib/finance-types";
import {
  getGoalsByUser,
  createGoal,
  updateGoal,
  deleteGoal,
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

const PRIORITY_LABELS: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-600 border-rose-200",
  medium: "bg-amber-500/10 text-amber-600 border-amber-200",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00Z");
  const b = new Date(to + "T00:00:00Z");
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function FinanceGoals() {
  const uid = auth.currentUser?.uid || "user-1";
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [accounts, setAccounts] =
    useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinanceGoal | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formCurrent, setFormCurrent] = useState("0");
  const [formDeadline, setFormDeadline] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formAccountId, setFormAccountId] = useState("");
  const [formAutoDeposit, setFormAutoDeposit] = useState("0");

  const resetForm = useCallback(() => {
    setFormName("");
    setFormTarget("");
    setFormCurrent("0");
    setFormDeadline("");
    setFormPriority("medium");
    setFormAccountId("");
    setFormAutoDeposit("0");
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
    setFormAccountId(goal.accountId || "");
    setFormAutoDeposit(String(goal.autoDepositPercent ?? 0));
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
    const autoDepositPercent = Math.max(
      0,
      Math.min(100, Number(formAutoDeposit) || 0),
    );
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
          ...(formAccountId ? { accountId: formAccountId } : {}),
          autoDepositPercent,
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
          ...(formAccountId ? { accountId: formAccountId } : {}),
          autoDepositPercent,
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
    formAccountId,
    formAutoDeposit,
    editingGoal,
    handleCloseDialog,
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
              <Target className="h-4 w-4" />
              Всего целей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Завершено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {stats.completed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
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
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-sky-600">
              <PiggyBank className="h-4 w-4" />
              Накоплено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-sky-600">
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
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Нет активных целей</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
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
            const progressPct = Math.min(
              Math.round((goal.currentAmount / goal.targetAmount) * 100),
              100,
            );
            const daysRemaining = daysBetween(today, goal.deadline);
            const remaining = goal.targetAmount - goal.currentAmount;
            const perDay =
              daysRemaining > 0 && remaining > 0
                ? Math.ceil(remaining / daysRemaining)
                : 0;
            const perMonth = perDay * 30;

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-medium">
                      {goal.name}
                    </CardTitle>
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
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        progressPct >= 100 ? "bg-emerald-500" : "bg-primary",
                      )}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {progressPct}%
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {daysRemaining > 0
                        ? `Осталось ${daysRemaining} дн.`
                        : daysRemaining === 0
                          ? "Последний день!"
                          : "Просрочено"}
                    </span>
                    <span className="mx-1">·</span>
                    <span>
                      до{" "}
                      {new Date(
                        goal.deadline + "T00:00:00Z",
                      ).toLocaleDateString("ru-RU")}
                    </span>
                  </div>

                  {remaining > 0 && daysRemaining > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {perDay.toLocaleString()} ₽/день ·{" "}
                        {perMonth.toLocaleString()} ₽/мес
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(goal)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Изменить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleComplete(goal)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Готово
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
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
        <Card>
          <button
            type="button"
            onClick={() => setArchivedOpen(!archivedOpen)}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Archive className="h-4 w-4" />
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
            <CardContent className="space-y-2">
              {completedGoals.map((goal) => {
                const daysRemaining = daysBetween(today, goal.deadline);
                return (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm line-through text-muted-foreground">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Редактировать цель" : "Новая цель"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Например: Новый ноутбук"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Целевая сумма</label>
                <Input
                  type="number"
                  value={formTarget}
                  onChange={(e) => setFormTarget(e.target.value)}
                  placeholder="150000"
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Уже накоплено</label>
                <Input
                  type="number"
                  value={formCurrent}
                  onChange={(e) => setFormCurrent(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Дедлайн</label>
                <Input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Приоритет</label>
                <Select
                  value={formPriority}
                  onValueChange={(v) => v && setFormPriority(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Счёт (необязательно)
                </label>
                <Select
                  value={formAccountId}
                  onValueChange={(v) => setFormAccountId(v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Без счёта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без счёта</SelectItem>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Авто-депозит (%)</label>
                <Input
                  type="number"
                  value={formAutoDeposit}
                  onChange={(e) => setFormAutoDeposit(e.target.value)}
                  placeholder="10"
                  min={0}
                  max={100}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingGoal ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
