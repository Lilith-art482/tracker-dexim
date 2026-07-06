"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  ArrowRightLeft,
  Receipt,
  Target,
  Landmark,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
  EmergencyFund,
  BudgetPlan,
} from "@/lib/finance-types";
import { mockFinanceAccounts } from "@/lib/finance-mock";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "fin-cat-1": "#ef4444",
  "fin-cat-2": "#f97316",
  "fin-cat-3": "#eab308",
  "fin-cat-4": "#22c55e",
  "fin-cat-5": "#3b82f6",
  "fin-cat-6": "#ec4899",
  "fin-cat-7": "#8b5cf6",
  "fin-cat-8": "#6b7280",
  "fin-cat-9": "#10b981",
  "fin-cat-10": "#06b6d4",
};

const CATEGORY_NAMES: Record<string, string> = {
  "fin-cat-1": "Еда",
  "fin-cat-2": "Транспорт",
  "fin-cat-3": "Жильё",
  "fin-cat-4": "Одежда",
  "fin-cat-5": "Развлечения",
  "fin-cat-6": "Здоровье",
  "fin-cat-7": "Образование",
  "fin-cat-8": "Прочее",
  "fin-cat-9": "Зарплата",
  "fin-cat-10": "Фриланс",
};

function LineChart({
  data,
  color = "#4E6E62",
}: {
  data: { date: string; value: number }[];
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const values = data.map((d) => d.value);
    const min = Math.min(...values) * 0.95;
    const max = Math.max(...values) * 1.05;
    const range = max - min || 1;

    const padding = { top: 16, right: 16, bottom: 24, left: 48 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * plotW,
      y: padding.top + plotH - ((d.value - min) / range) * plotH,
    }));

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = color + "15";
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + plotH);
    for (const p of points) ctx.lineTo(p.x, p.y);
    ctx.lineTo(points[points.length - 1].x, padding.top + plotH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    const yLabels = [min, (min + max) / 2, max];
    for (const y of yLabels) {
      const yPos = padding.top + plotH - ((y - min) / range) * plotH;
      ctx.fillText(Math.round(y).toLocaleString(), padding.left - 6, yPos + 3);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(w - padding.right, yPos);
      ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#999";
    const step = Math.max(1, Math.floor(data.length / 5));
    for (let i = 0; i < data.length; i += step) {
      const d = new Date(data[i].date);
      ctx.fillText(`${d.getDate()}.${d.getMonth() + 1}`, points[i].x, h - 4);
    }
  }, [data, color]);

  return <canvas ref={canvasRef} className="w-full h-[200px]" />;
}

export function FinanceDashboard() {
  const [accounts, setAccounts] =
    useState<FinanceAccount[]>(mockFinanceAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid || "user-1";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, txRes, catRes, budRes, emRes] = await Promise.all([
        fetch(`/api/finance/accounts?uid=${uid}`),
        fetch(`/api/finance/transactions?uid=${uid}`),
        fetch(`/api/finance/categories?uid=${uid}`),
        fetch(`/api/finance/budgets?uid=${uid}`),
        fetch(`/api/finance/emergency-fund?uid=${uid}`),
      ]);
      if (accRes.ok) setAccounts(await accRes.json());
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
      if (catRes.ok) setCategories(await catRes.json());
      if (budRes.ok) {
        const data = await budRes.json();
        setBudget(Array.isArray(data) && data.length > 0 ? data[0] : null);
      }
      if (emRes.ok) setEmergencyFund(await emRes.json());
    } catch {
      console.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const monthIncome = transactions
    .filter((t) => t.type === "income" && t.date >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpenses = transactions
    .filter((t) => t.type === "expense" && t.date >= monthStart)
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyObligations = transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.date >= monthStart &&
        (t.categoryId === "fin-cat-3" || t.categoryId === "fin-cat-6"),
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const freeMoney = monthIncome - monthExpenses - monthlyObligations;

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  let runningBalance = totalBalance;
  const balanceTrend = last30Days.map((date) => {
    const dayTxns = transactions.filter((t) => t.date === date);
    for (const t of dayTxns) {
      if (t.type === "income") runningBalance -= t.amount;
      else if (t.type === "expense") runningBalance += t.amount;
    }
    return { date, value: runningBalance };
  });

  const recentTxns = [...transactions]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 10);

  const healthRatio = monthIncome > 0 ? monthExpenses / monthIncome : 1;
  const healthColor =
    healthRatio <= 0.5
      ? "text-emerald-500"
      : healthRatio <= 0.8
        ? "text-amber-500"
        : "text-rose-500";
  const healthBg =
    healthRatio <= 0.5
      ? "bg-emerald-500/10"
      : healthRatio <= 0.8
        ? "bg-amber-500/10"
        : "bg-rose-500/10";
  const healthLabel =
    healthRatio <= 0.5
      ? "Отлично"
      : healthRatio <= 0.8
        ? "Нормально"
        : "Тревожно";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      console.error("Failed to delete transaction");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Общий баланс
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalBalance.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Доходы за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {monthIncome.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-rose-600">
              <TrendingDown className="h-4 w-4" />
              Расходы за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">
              {monthExpenses.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-sky-600">
              <PiggyBank className="h-4 w-4" />
              Свободные деньги
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                freeMoney >= 0 ? "text-sky-600" : "text-rose-600",
              )}
            >
              {freeMoney.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Динамика баланса (30 дней)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceTrend.length >= 2 ? (
            <LineChart data={balanceTrend} />
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              Недостаточно данных для графика
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Последние операции
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTxns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Нет операций
              </p>
            ) : (
              <div className="space-y-1">
                {recentTxns.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                          tx.type === "income"
                            ? "bg-emerald-500/10"
                            : "bg-rose-500/10",
                        )}
                      >
                        {tx.type === "income" ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORY_NAMES[tx.categoryId] || tx.categoryId}
                          {" · "}
                          {new Date(tx.date + "T00:00:00Z").toLocaleDateString(
                            "ru-RU",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4" />
                Здоровье бюджета
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3",
                  healthBg,
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    healthBg,
                  )}
                >
                  <AlertTriangle className={cn("h-5 w-5", healthColor)} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", healthColor)}>
                    {healthLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(healthRatio * 100)}% расходов от доходов
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Расходы / Доходы</span>
                  <span>{Math.round(healthRatio * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      healthRatio <= 0.5
                        ? "bg-emerald-500"
                        : healthRatio <= 0.8
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${Math.min(healthRatio * 100, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {emergencyFund && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <PiggyBank className="h-4 w-4" />
                  Подушка безопасности
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Накоплено</span>
                  <span className="font-semibold">
                    {emergencyFund.currentAmount.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Цель</span>
                  <span>{emergencyFund.targetAmount.toLocaleString()} ₽</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min((emergencyFund.currentAmount / emergencyFund.targetAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round(
                    (emergencyFund.currentAmount / emergencyFund.targetAmount) *
                      100,
                  )}
                  % от цели
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
