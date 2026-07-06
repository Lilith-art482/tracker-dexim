"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  AlertTriangle,
  Loader2,
  CalendarArrowUp,
  Plus,
  ArrowRightLeft,
  Landmark,
  RefreshCw,
} from "lucide-react";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
  EmergencyFund,
  BudgetPlan,
} from "@/lib/finance-types";
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

type Period = "week" | "month" | "quarter" | "halfyear" | "year" | "custom";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Неделя",
  month: "Месяц",
  quarter: "Квартал",
  halfyear: "Полгода",
  year: "Год",
  custom: "Свой",
};

function getPeriodRange(period: Period): { start: string; end: string; label: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: Date;

  switch (period) {
    case "week":
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarter":
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case "halfyear":
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { start: start.toISOString().split("T")[0], end, label: PERIOD_LABELS[period] };
}

function getDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const current = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (current <= last) {
    days.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

function LineChart({ data, color = "#4E6E62" }: { data: { date: string; value: number }[]; color?: string }) {
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
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
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
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo(() => {
    if (period === "custom") {
      return { start: customStart || "2026-01-01", end: customEnd || new Date().toISOString().split("T")[0], label: "Свой" };
    }
    return getPeriodRange(period);
  }, [period, customStart, customEnd]);

  const uid = auth.currentUser?.uid || "user-1";

  const fetchAll = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setRefreshing(true);
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
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => { fetchAll(true); }, [fetchAll]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const periodTxns = useMemo(
    () => transactions.filter((t) => t.date >= range.start && t.date <= range.end),
    [transactions, range],
  );

  const periodIncome = periodTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const periodExpenses = periodTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const periodObligations = periodTxns
    .filter((t) => t.type === "expense" && (t.categoryId === "fin-cat-3" || t.categoryId === "fin-cat-6"))
    .reduce((s, t) => s + t.amount, 0);
  const freeMoney = periodIncome - periodExpenses - periodObligations;

  const days = getDaysInRange(range.start, range.end);

  let runningBalance = totalBalance;
  const balanceTrend = days.map((date) => {
    const dayTxns = periodTxns.filter((t) => t.date === date);
    for (const t of dayTxns) {
      if (t.type === "income") runningBalance -= t.amount;
      else if (t.type === "expense") runningBalance += t.amount;
    }
    return { date, value: runningBalance };
  });

  const hasData = periodIncome > 0 || periodExpenses > 0;
  const healthRatio = hasData ? (periodIncome > 0 ? periodExpenses / periodIncome : 1) : 0;
  const healthColor = !hasData ? "text-muted-foreground" : healthRatio <= 0.5 ? "text-emerald-500" : healthRatio <= 0.8 ? "text-amber-500" : "text-rose-500";
  const healthBg = !hasData ? "bg-muted/50" : healthRatio <= 0.5 ? "bg-emerald-500/10" : healthRatio <= 0.8 ? "bg-amber-500/10" : "bg-rose-500/10";
  const healthLabel = !hasData ? "Нет данных" : healthRatio <= 0.5 ? "Отлично" : healthRatio <= 0.8 ? "Нормально" : "Тревожно";

  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of periodTxns) {
      if (tx.type !== "expense") continue;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
    }
    const sorted = Object.entries(map)
      .map(([id, amount]) => ({ id, name: CATEGORY_NAMES[id] || id, amount, color: CATEGORY_COLORS[id] || "#6b7280" }))
      .sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [periodTxns]);

  const topCategories = expenseCategories.slice(0, 6);
  const otherAmount = expenseCategories.slice(6).reduce((s, c) => s + c.amount, 0);
  const totalExpenses = periodExpenses;

  const dailyAvgExpense = days.length > 0 ? periodExpenses / days.length : 0;
  const dailyAvgIncome = days.length > 0 ? periodIncome / days.length : 0;
  const projectedRemaining = periodIncome - periodExpenses;

  const prevRange = useMemo(() => {
    const periodMs = new Date(range.end).getTime() - new Date(range.start).getTime() + 86400000;
    const prevEnd = new Date(new Date(range.start).getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - periodMs + 86400000);
    return {
      start: prevStart.toISOString().split("T")[0],
      end: prevEnd.toISOString().split("T")[0],
    };
  }, [range]);

  const prevPeriodExpenses = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense" && t.date >= prevRange.start && t.date <= prevRange.end)
        .reduce((s, t) => s + t.amount, 0),
    [transactions, prevRange],
  );

  const expenseChange = prevPeriodExpenses > 0
    ? ((periodExpenses - prevPeriodExpenses) / prevPeriodExpenses) * 100
    : 0;

  const budgetLoad = useMemo(() => {
    if (!budget || !budget.categoryBudgets.length) return null;
    const totalLimit = budget.categoryBudgets.reduce((s, cb) => s + cb.limit, 0);
    const categories = budget.categoryBudgets.map((cb) => {
      const spent = periodTxns
        .filter((t) => t.type === "expense" && t.categoryId === cb.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      return {
        id: cb.categoryId,
        name: CATEGORY_NAMES[cb.categoryId] || cb.categoryId,
        color: CATEGORY_COLORS[cb.categoryId] || "#6b7280",
        limit: cb.limit,
        spent,
        pct: cb.limit > 0 ? Math.min(Math.round((spent / cb.limit) * 100), 100) : 0,
      };
    });
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const totalPct = totalLimit > 0 ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100) : 0;
    return { totalLimit, totalSpent, totalPct, categories };
  }, [budget, periodTxns]);

  if (initialLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => fetchAll(false)}
          className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Обновить"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </button>
        {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              period === key
                ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {label}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="h-4 w-4" />
              Общий баланс
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalBalance.toLocaleString()} ₽</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Доходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{periodIncome.toLocaleString()} ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">{range.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-rose-600">
              <TrendingDown className="h-4 w-4" />
              Расходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{periodExpenses.toLocaleString()} ₽</p>
            <div className="flex items-center gap-1 mt-0.5">
              {prevPeriodExpenses > 0 && (
                <span className={cn("text-xs", expenseChange > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {expenseChange > 0 ? "↑" : "↓"} {Math.abs(Math.round(expenseChange))}%
                </span>
              )}
            </div>
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
            <p className={cn("text-2xl font-bold", freeMoney >= 0 ? "text-sky-600" : "text-rose-600")}>
              {freeMoney.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Динамика баланса</CardTitle>
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
            <CardTitle className="text-sm font-medium">Расходы по категориям</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalExpenses === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Нет расходов за период</p>
            ) : (
              <>
                {topCategories.map((cat) => {
                  const pct = (cat.amount / totalExpenses) * 100;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium tabular-nums ml-2">{cat.amount.toLocaleString()} ₽</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
                {otherAmount > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-3 w-3 rounded-full shrink-0 bg-muted-foreground/40" />
                        <span>Прочее</span>
                      </div>
                      <span className="tabular-nums ml-2">{otherAmount.toLocaleString()} ₽</span>
                      <span className="text-xs w-10 text-right">{Math.round((otherAmount / totalExpenses) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${(otherAmount / totalExpenses) * 100}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Всего расходов</span>
                  <span>{totalExpenses.toLocaleString()} ₽</span>
                </div>
              </>
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
              <div className={cn("flex items-center gap-3 rounded-lg p-3", healthBg)}>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", healthBg)}>
                  <AlertTriangle className={cn("h-5 w-5", healthColor)} />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", healthColor)}>{healthLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {hasData ? `${Math.round(healthRatio * 100)}% расходов от доходов` : "Нет операций за период"}
                    </p>
                </div>
              </div>
                  {hasData && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Расходы / Доходы</span>
                        <span>{Math.round(healthRatio * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            healthRatio <= 0.5 ? "bg-emerald-500" : healthRatio <= 0.8 ? "bg-amber-500" : "bg-rose-500",
                          )}
                          style={{ width: `${Math.min(healthRatio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CalendarArrowUp className="h-4 w-4" />
                Прогноз
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Средний расход в день</span>
                <span className="font-medium">{Math.round(dailyAvgExpense).toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Средний доход в день</span>
                <span className="font-medium">{Math.round(dailyAvgIncome).toLocaleString()} ₽</span>
              </div>
              <div className={cn("flex justify-between text-sm font-medium pt-2 border-t", projectedRemaining >= 0 ? "text-sky-600" : "text-rose-600")}>
                <span>Прогноз остатка</span>
                <span>{projectedRemaining.toLocaleString()} ₽</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Если траты сохранятся на текущем уровне
              </p>
            </CardContent>
          </Card>

          {budgetLoad && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  Нагрузка на бюджет
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Всего расходов</span>
                  <span className="font-semibold">{budgetLoad.totalSpent.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Лимит бюджета</span>
                  <span>{budgetLoad.totalLimit.toLocaleString()} ₽</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      budgetLoad.totalPct <= 50 ? "bg-emerald-500" : budgetLoad.totalPct <= 80 ? "bg-amber-500" : "bg-rose-500",
                    )}
                    style={{ width: `${budgetLoad.totalPct}%` }}
                  />
                </div>
                <p className={cn("text-xs text-center font-medium", budgetLoad.totalPct <= 50 ? "text-emerald-600" : budgetLoad.totalPct <= 80 ? "text-amber-600" : "text-rose-600")}>
                  Использовано {budgetLoad.totalPct}% бюджета
                </p>
                <div className="space-y-2 pt-1">
                  {budgetLoad.categories.slice(0, 5).map((cat) => (
                    <div key={cat.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="tabular-nums ml-1">
                          {cat.spent.toLocaleString()} / {cat.limit.toLocaleString()} ₽
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            cat.pct > 100 ? "bg-rose-500" : cat.pct > 80 ? "bg-amber-500" : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(cat.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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
                  <span className="font-semibold">{emergencyFund.currentAmount.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Цель</span>
                  <span>{emergencyFund.targetAmount.toLocaleString()} ₽</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min((emergencyFund.currentAmount / emergencyFund.targetAmount) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {Math.round((emergencyFund.currentAmount / emergencyFund.targetAmount) * 100)}% от цели
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
