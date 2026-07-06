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
} from "lucide-react";
import type { EmergencyFund, Transaction } from "@/lib/finance-types";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

  const [targetInput, setTargetInput] = useState("");
  const [addInput, setAddInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  const [autoDeposit, setAutoDeposit] = useState(false);
  const [autoPercent, setAutoPercent] = useState(5);

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

  const coverageColor =
    monthsCovered >= 3
      ? "text-emerald-500"
      : monthsCovered >= 1
        ? "text-amber-500"
        : "text-rose-500";
  const coverageBg =
    monthsCovered >= 3
      ? "bg-emerald-500/10"
      : monthsCovered >= 1
        ? "bg-amber-500/10"
        : "bg-rose-500/10";
  const coverageIcon =
    monthsCovered >= 3
      ? ShieldCheck
      : monthsCovered >= 1
        ? Shield
        : ShieldAlert;
  const CoverageIcon = coverageIcon;

  const fetchFund = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/emergency-fund?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setFund(data);
      }
    } catch {
      // use mock fallback
    }
  }, [uid]);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/transactions?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
    } catch {
      // use mock fallback
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
    try {
      const res = await fetch("/api/finance/emergency-fund", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAmount: val, userId: uid }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFund(updated);
        setTargetInput("");
        toast.success("Цель обновлена");
      } else {
        toast.error("Не удалось сохранить цель");
      }
    } catch {
      setFund((prev) => (prev ? { ...prev, targetAmount: val } : prev));
      setTargetInput("");
      toast.success("Цель обновлена (локально)");
    }
  };

  const handleAddFunds = async () => {
    const val = parseInt(addInput, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }
    const newCurrent = (fund?.currentAmount ?? 0) + val;
    try {
      const res = await fetch("/api/finance/emergency-fund", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newCurrent, userId: uid }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFund(updated);
        toast.success(`Добавлено ${val.toLocaleString()} ₽`);
      } else {
        toast.error("Не удалось пополнить");
      }
    } catch {
      setFund((prev) => (prev ? { ...prev, currentAmount: newCurrent } : prev));
      toast.success(`Добавлено ${val.toLocaleString()} ₽ (локально)`);
    }
    setAddInput("");
  };

  const handleWithdrawFunds = async () => {
    const val = parseInt(withdrawInput, 10);
    if (isNaN(val) || val <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }
    const newCurrent = Math.max(0, (fund?.currentAmount ?? 0) - val);
    try {
      const res = await fetch("/api/finance/emergency-fund", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newCurrent, userId: uid }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFund(updated);
        toast.success(`Снято ${val.toLocaleString()} ₽`);
      } else {
        toast.error("Не удалось снять средства");
      }
    } catch {
      setFund((prev) => (prev ? { ...prev, currentAmount: newCurrent } : prev));
      toast.success(`Снято ${val.toLocaleString()} ₽ (локально)`);
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

  const emergencyTransactions = transactions.filter((t) =>
    t.tags.some((tag) => tag.toLowerCase().includes("emergency")),
  );

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <PiggyBank className="h-5 w-5" />
            Подушка безопасности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-4">
            <div className="relative flex items-center justify-center">
              <svg width="200" height="200" className="-rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold">{percent}%</span>
                <span className="text-xs text-muted-foreground">
                   {currentAmount.toLocaleString()} ₽ /{" "}
                   {targetAmount.toLocaleString()} ₽
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Хватит на ~{monthsCovered} мес.
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <CoverageIcon className={cn("h-4 w-4", coverageColor)} />
              <span className={cn("text-sm font-medium", coverageColor)}>
                {shortfall > 0
                  ? `Не хватает ${shortfall.toLocaleString()} ₽ для полной защиты`
                  : "Подушка безопасности"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Управление</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">
                Цель (₽)
              </label>
              <Input
                type="number"
                placeholder={targetAmount > 0 ? targetAmount.toLocaleString() : "0"}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveTarget} size="sm">
              Сохранить
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">
                Пополнить (₽)
              </label>
              <Input
                type="number"
                placeholder="Сумма"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
              />
            </div>
            <Button onClick={handleAddFunds} size="sm" variant="default">
              <Plus className="h-4 w-4 mr-1" />
              Добавить
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">
                Снять (₽)
              </label>
              <Input
                type="number"
                placeholder="Сумма"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
              />
            </div>
            <Button
              onClick={handleWithdrawFunds}
              size="sm"
              variant="outline"
            >
              <Minus className="h-4 w-4 mr-1" />
              Снять
            </Button>
          </div>

          <Button
            onClick={handleRecalcExpenses}
            variant="secondary"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Пересчитать ежемесячные расходы
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            История операций
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет операций с тегом &laquo;emergency&raquo;
            </p>
          ) : (
            <div className="space-y-2">
              {emergencyTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        tx.type === "income"
                          ? "bg-emerald-500/10"
                          : "bg-rose-500/10",
                      )}
                    >
                      {tx.type === "income" ? (
                        <Plus className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date + "T00:00:00Z").toLocaleDateString(
                          "ru-RU",
                        )}
                        {" · "}
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {tx.type === "income" ? "пополнение" : "снятие"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      tx.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-600",
                    )}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {tx.amount.toLocaleString()} ₽
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Рекомендации
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Рекомендуемый размер подушки безопасности —{" "}
            <strong>3–6 месяцев</strong> ваших ежемесячных расходов.
          </p>

          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-3",
              coverageBg,
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                coverageBg,
              )}
            >
              <CoverageIcon className={cn("h-5 w-5", coverageColor)} />
            </div>
            <div>
              <p className={cn("text-sm font-semibold", coverageColor)}>
                {monthsCovered < 1
                  ? "Менее 1 месяца"
                  : monthsCovered < 3
                    ? `${monthsCovered} месяца`
                    : `${monthsCovered} месяцев`}{" "}
                покрытия
              </p>
              <p className="text-xs text-muted-foreground">
                {monthsCovered >= 3
                  ? "Хороший уровень защиты"
                  : monthsCovered >= 1
                    ? "Средний уровень защиты"
                    : "Критически низкий уровень"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Автопополнение
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Автопополнение</span>
            <Switch
              checked={autoDeposit}
              onCheckedChange={(val) => setAutoDeposit(val)}
            />
          </div>
          {autoDeposit && (
            <>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Процент"
                  value={autoPercent}
                  onChange={(e) => setAutoPercent(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  % от дохода
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Каждый месяц {autoPercent}% дохода будет откладываться в
                подушку
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
