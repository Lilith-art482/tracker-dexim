"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PiggyBank,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Minus,
  Loader2,
  Calendar,
  RefreshCw,
  TrendingUp,
  ArrowUp,
  Target,
  Wallet,
} from "lucide-react";
import type { EmergencyFund, Transaction } from "@/lib/finance-types";
import {
  getEmergencyFund,
  upsertEmergencyFund,
  getTransactionsByUser,
} from "@/lib/finance-client";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function computeMonthlyExpenses(transactions: Transaction[]): number {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const start = threeMonthsAgo.toISOString().split("T")[0];

  const expenses = transactions.filter(
    (t) => t.type === "expense" && t.date >= start,
  );
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  return expenses.length > 0 ? Math.round(total / 3) : 0;
}

export function FinanceEmergencyFund() {
  const uid = auth.currentUser?.uid || "user-1";

  const [fund, setFund] = useState<EmergencyFund | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [targetInput, setTargetInput] = useState("");
  const [addInput, setAddInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  const monthlyExpenses = computeMonthlyExpenses(transactions);
  const currentAmount = fund?.currentAmount ?? 0;
  const targetAmount = fund?.targetAmount ?? 0;
  const monthsCovered =
    monthlyExpenses > 0
      ? Math.round((currentAmount / monthlyExpenses) * 10) / 10
      : 0;
  const percent = targetAmount > 0
    ? Math.round((currentAmount / targetAmount) * 100)
    : 0;
  const shortfall = targetAmount - currentAmount;

  const coverageLevel =
    monthsCovered >= 3 ? "safe" : monthsCovered >= 1 ? "medium" : "low";
  const coverageColor =
    coverageLevel === "safe"
      ? "text-emerald-500"
      : coverageLevel === "medium"
        ? "text-amber-500"
        : "text-rose-500";
  const coverageBg =
    coverageLevel === "safe"
      ? "bg-emerald-500/10"
      : coverageLevel === "medium"
        ? "bg-amber-500/10"
        : "bg-rose-500/10";
  const CoverageIcon =
    coverageLevel === "safe"
      ? ShieldCheck
      : coverageLevel === "medium"
        ? Shield
        : ShieldAlert;

  const fetchFund = useCallback(async () => {
    try {
      const data = await getEmergencyFund(uid);
      setFund(data);
    } catch {
      console.error("Failed to fetch emergency fund");
    }
  }, [uid]);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await getTransactionsByUser(uid);
      setTransactions(data);
    } catch {
      console.error("Failed to fetch transactions");
    }
  }, [uid]);

  useEffect(() => {
    Promise.all([fetchFund(), fetchTransactions()]).finally(() =>
      setLoading(false),
    );
  }, [fetchFund, fetchTransactions]);

  const handleSaveTarget = async () => {
    const val = parseInt(targetInput, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Укажите корректную сумму цели");
      return;
    }
    setSaving(true);
    try {
      const updated = await upsertEmergencyFund(uid, {
        targetAmount: val,
        currentAmount,
      });
      setFund(updated);
      setTargetInput("");
      toast.success("Цель обновлена");
    } catch {
      setFund((prev) => (prev ? { ...prev, targetAmount: val } : prev));
      setTargetInput("");
      toast.success("Цель обновлена");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFunds = async () => {
    const val = parseInt(addInput, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }
    setSaving(true);
    const newCurrent = (fund?.currentAmount ?? 0) + val;
    try {
      const updated = await upsertEmergencyFund(uid, {
        currentAmount: newCurrent,
        targetAmount,
      });
      setFund(updated);
      toast.success(`Добавлено ${val.toLocaleString()} ₽`);
    } catch {
      setFund((prev) => (prev ? { ...prev, currentAmount: newCurrent } : prev));
      toast.success(`Добавлено ${val.toLocaleString()} ₽`);
    } finally {
      setSaving(false);
    }
    setAddInput("");
  };

  const handleWithdrawFunds = async () => {
    const val = parseInt(withdrawInput, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }
    setSaving(true);
    const newCurrent = Math.max(0, (fund?.currentAmount ?? 0) - val);
    try {
      const updated = await upsertEmergencyFund(uid, {
        currentAmount: newCurrent,
        targetAmount,
      });
      setFund(updated);
      toast.success(`Снято ${val.toLocaleString()} ₽`);
    } catch {
      setFund((prev) => (prev ? { ...prev, currentAmount: newCurrent } : prev));
      toast.success(`Снято ${val.toLocaleString()} ₽`);
    } finally {
      setSaving(false);
    }
    setWithdrawInput("");
  };

  const handleRecalcExpenses = () => {
    const avg = computeMonthlyExpenses(transactions);
    if (avg <= 0) {
      toast.error("Недостаточно данных для расчёта");
      return;
    }
    const suggested = avg * 6;
    setFund((prev) => (prev ? { ...prev, targetAmount: suggested } : prev));
    toast.success(
      `Среднемесячные расходы: ${avg.toLocaleString()} ₽. Рекомендуемая цель: ${suggested.toLocaleString()} ₽`,
    );
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top row: progress + summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="sm:col-span-1">
          <CardContent className="flex flex-col items-center py-6">
            <div className="relative flex items-center justify-center">
              <svg width="180" height="180" className="-rotate-90">
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={
                    coverageLevel === "safe"
                      ? "#22c55e"
                      : coverageLevel === "medium"
                        ? "#f59e0b"
                        : "#ef4444"
                  }
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold">{percent}%</span>
                <span className="text-xs text-muted-foreground text-center">
                  {currentAmount.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="sm:col-span-2 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Цель
              </div>
              <p className="text-xl font-bold">
                {targetAmount.toLocaleString()} ₽
              </p>
              {targetAmount > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-muted-foreground">
                    Осталось {shortfall.toLocaleString()} ₽
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Накоплено
              </div>
              <p className="text-xl font-bold">
                {currentAmount.toLocaleString()} ₽
              </p>
              {monthlyExpenses > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <CoverageIcon className={cn("h-3 w-3", coverageColor)} />
                  <span className={coverageColor}>
                    хватит на {monthsCovered} мес.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Расходы в мес.
              </div>
              <p className="text-xl font-bold">
                {monthlyExpenses.toLocaleString()} ₽
              </p>
              {monthlyExpenses > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:underline"
                  onClick={handleRecalcExpenses}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Пересчитать
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Защита
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-full", coverageBg)}>
                  <CoverageIcon className={cn("h-5 w-5", coverageColor)} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", coverageColor)}>
                    {monthsCovered < 1
                      ? "Менее 1 мес."
                      : monthsCovered < 3
                        ? `${monthsCovered} мес.`
                        : `> ${monthsCovered} мес.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {monthsCovered >= 3
                      ? "Достаточно"
                      : monthsCovered >= 1
                        ? "Средне"
                        : "Критично"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Управление</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Цель (₽)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={targetAmount > 0 ? targetAmount.toLocaleString() : "0"}
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="h-8"
                />
                <Button onClick={handleSaveTarget} size="sm" className="h-8 shrink-0" disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "ОК"}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Пополнить (₽)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Сумма"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  className="h-8"
                />
                <Button onClick={handleAddFunds} size="sm" className="h-8 shrink-0" disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Снять (₽)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Сумма"
                  value={withdrawInput}
                  onChange={(e) => setWithdrawInput(e.target.value)}
                  className="h-8"
                />
                <Button onClick={handleWithdrawFunds} size="sm" variant="outline" className="h-8 shrink-0" disabled={saving}>
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Minus className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History + Recommendations side by side */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Рекомендации</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Рекомендуемый размер подушки —{" "}
              <strong>3–6 месяцев</strong> ежемесячных расходов.
            </p>
            {monthlyExpenses > 0 && (
              <>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Текущий уровень</span>
                    <span className={coverageColor}>{monthsCovered} мес.</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Минимум (3 мес.)</span>
                    <span>{(monthlyExpenses * 3).toLocaleString()} ₽</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Оптимум (6 мес.)</span>
                    <span>{(monthlyExpenses * 6).toLocaleString()} ₽</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg p-3",
                    coverageBg,
                  )}
                >
                  <CoverageIcon className={cn("h-5 w-5 shrink-0", coverageColor)} />
                  <p className={cn("text-sm font-medium", coverageColor)}>
                    {monthsCovered >= 3
                      ? "Хороший уровень защиты"
                      : monthsCovered >= 1
                        ? "Средний уровень защиты"
                        : "Критически низкий уровень"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">История операций</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <PiggyBank className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">Нет операций</p>
                <p className="text-xs mt-1">Пополните подушку</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[240px] overflow-y-auto">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          tx.type === "income"
                            ? "bg-emerald-500/10"
                            : "bg-rose-500/10",
                        )}
                      >
                        {tx.type === "income" ? (
                          <Plus className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-rose-600" />
                        )}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-medium truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(tx.date + "T00:00:00Z").toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold tabular-nums shrink-0 ml-2",
                        tx.type === "income"
                          ? "text-emerald-600"
                          : "text-rose-600",
                      )}
                    >
                      {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()} ₽
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
