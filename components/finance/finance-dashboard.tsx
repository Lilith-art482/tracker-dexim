"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  AlertTriangle,
  Loader2,
  CalendarArrowUp,
  Clock,
  BarChart3,
  Landmark,
} from "lucide-react";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
  EmergencyFund,
  BudgetPlan,
  Loan,
  RecurringTransaction,
} from "@/lib/finance-types";
import { useAuthUid } from "@/lib/use-auth-uid";
import {
  getAccountsByUser,
  getTransactionsByUser,
  getCategoriesByUser,
  getBudgetPlansByUser,
  getEmergencyFund,
  getLoansByUser,
  getRecurringTransactionsByUser,
} from "@/lib/finance-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getFinanceIcon } from "@/lib/finance-icons";
import {
  getCurrencySymbol,
  getDisplayCurrency,
  convert,
  getCachedRates,
  getUSDTtoRUB,
  convertToRUB,
} from "@/lib/exchange-rates";
import { syncRecurringTransactions } from "@/lib/finance-recurring-sync";
import { localDateStr, parseLocalDate } from "@/lib/date-utils";

const CATEGORY_COLORS_HEX: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  pink: "#ec4899",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  indigo: "#6366f1",
  cyan: "#06b6d4",
  lime: "#84cc16",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  fuchsia: "#d946ef",
  slate: "#6b7280",
};

function formatDate(date: string): string {
  if (date.includes("T")) {
    return date.slice(5, 16).replace("T", " ");
  }
  return date.slice(5);
}

function DeltaBadge({ value, invert }: { value: number; invert: boolean }) {
  const isGood = invert ? value <= 0 : value >= 0;
  if (value === 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
        isGood
          ? "text-emerald-600 bg-emerald-500/10"
          : "text-rose-600 bg-rose-500/10",
      )}
    >
      {isGood ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 56;
  const h = 20;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FinanceDashboard({
  onNavigateToTransactions,
}: {
  onNavigateToTransactions?: () => void;
}) {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [usdtRate, setUsdtRate] = useState<number>(90);
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(
    null,
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [dashboardPeriod, setDashboardPeriod] = useState<
    "week" | "month" | "quarter" | "half-year" | "year"
  >("month");
  const [catPeriod, setCatPeriod] = useState<
    "week" | "month" | "quarter" | "half-year" | "year"
  >("month");
  const [catType, setCatType] = useState<"expense" | "income">("expense");

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map = new Map<string, FinanceAccount>();
    for (const acc of accounts) {
      map.set(acc.id, acc);
    }
    return map;
  }, [accounts]);

  const { uid } = useAuthUid();

  const fetchAll = useCallback(
    async (isInitial = false) => {
      if (!uid) return;
      if (isInitial) setInitialLoading(true);
      try {
        const [accs, txs, cats, buds, em, loansData] = await Promise.all([
          getAccountsByUser(uid),
          getTransactionsByUser(uid),
          getCategoriesByUser(uid),
          getBudgetPlansByUser(uid),
          getEmergencyFund(uid),
          getLoansByUser(uid),
        ]);
        setAccounts(accs);
        setTransactions(txs);
        setCategories(cats);
        setBudget(buds.length > 0 ? buds[0] : null);
        setEmergencyFund(em);
        setLoans(loansData);

        const generated = await syncRecurringTransactions();
        if (generated > 0) {
          const [newTxs, refreshedAccs] = await Promise.all([
            getTransactionsByUser(uid),
            getAccountsByUser(uid),
          ]);
          setTransactions(newTxs);
          setAccounts(refreshedAccs);
        }
        const recurring = await getRecurringTransactionsByUser(uid);
        setRecurringTransactions(recurring);

        const rate = await getUSDTtoRUB();
        setUsdtRate(rate);
        setRatesLoaded(true);
      } catch (e) {
        console.error("Failed to load finance data", e);
      } finally {
        setInitialLoading(false);
      }
    },
    [uid],
  );

  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);

  const totalBalance = useMemo(() => {
    const rates = getCachedRates();
    return accounts.reduce((sum, a) => {
      const effectiveBalance =
        a.type === "crypto" && a.cryptoCoin && a.cryptoAmount != null && rates
          ? convert(a.cryptoAmount, a.cryptoCoin, a.currency, rates)
          : a.balance;
      return sum + convertToRUB(effectiveBalance, a.currency, usdtRate);
    }, 0);
  }, [accounts, usdtRate, ratesLoaded]);

  const dashboardRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    switch (dashboardPeriod) {
      case "week": {
        const day = now.getDay();
        const d = new Date(now);
        d.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        start = d;
        break;
      }
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter": {
        const q = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), q, 1);
        break;
      }
      case "half-year": {
        const h = Math.floor(now.getMonth() / 6) * 6;
        start = new Date(now.getFullYear(), h, 1);
        break;
      }
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }
    return { start: localDateStr(start!), end: localDateStr(now) };
  }, [dashboardPeriod]);

  const prevDashboardRange = useMemo(() => {
    const dur =
      new Date(dashboardRange.end).getTime() -
      new Date(dashboardRange.start).getTime();
    const prevEnd = new Date(
      new Date(dashboardRange.start).getTime() - 86400000,
    );
    const prevStart = new Date(prevEnd.getTime() - dur);
    return {
      start: localDateStr(prevStart),
      end: localDateStr(prevEnd),
    };
  }, [dashboardRange]);

  const prevPeriodTxns = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.date >= prevDashboardRange.start &&
          t.date <= prevDashboardRange.end,
      ),
    [transactions, prevDashboardRange],
  );

  const prevPeriodIncome = prevPeriodTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const prevPeriodExpenses = prevPeriodTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const periodTxns = useMemo(() => {
    if (!dashboardRange) return [];
    return transactions.filter(
      (t) => t.date >= dashboardRange.start && t.date <= dashboardRange.end,
    );
  }, [transactions, dashboardRange]);

  const periodIncome = periodTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const periodExpenses = periodTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const periodObligations = periodTxns
    .filter(
      (t) =>
        t.type === "expense" &&
        (t.categoryId === "fin-cat-3" || t.categoryId === "fin-cat-6"),
    )
    .reduce((s, t) => s + t.amount, 0);
  const freeMoney = periodIncome - periodExpenses;

  const incomeDelta =
    prevPeriodIncome > 0
      ? Math.round(((periodIncome - prevPeriodIncome) / prevPeriodIncome) * 100)
      : periodIncome > 0
        ? 100
        : 0;
  const expenseDelta =
    prevPeriodExpenses > 0
      ? Math.round(
          ((periodExpenses - prevPeriodExpenses) / prevPeriodExpenses) * 100,
        )
      : periodExpenses > 0
        ? 100
        : 0;
  const freeMoneyPrev = prevPeriodIncome - prevPeriodExpenses;
  const freeMoneyDelta =
    freeMoneyPrev !== 0
      ? Math.round(
          ((freeMoney - freeMoneyPrev) / Math.abs(freeMoneyPrev)) * 100,
        )
      : freeMoney > 0
        ? 100
        : 0;

  const totalLoanDebt = loans.reduce((s, l) => s + l.remainingAmount, 0);
  const totalLoanMonthly = loans.reduce(
    (s, l) => (l.repaymentType === "monthly" ? s + l.monthlyPayment : s),
    0,
  );
  const overdueLoans = loans.filter(
    (l) => (l.overdueMonths || 0) > 0 && l.remainingAmount > 0,
  ).length;

  const hasData = periodIncome > 0 || periodExpenses > 0;
  const healthRatio = hasData
    ? periodIncome > 0
      ? periodExpenses / periodIncome
      : 1
    : 0;
  const healthColor = !hasData
    ? "text-muted-foreground"
    : healthRatio <= 0.5
      ? "text-emerald-500"
      : healthRatio <= 0.8
        ? "text-amber-500"
        : "text-rose-500";
  const healthBg = !hasData
    ? "bg-muted/50"
    : healthRatio <= 0.5
      ? "bg-emerald-500/10"
      : healthRatio <= 0.8
        ? "bg-amber-500/10"
        : "bg-rose-500/10";
  const healthLabel = !hasData
    ? "Нет данных"
    : healthRatio <= 0.5
      ? "Отлично"
      : healthRatio <= 0.8
        ? "Нормально"
        : "Тревожно";

  const catRange = useMemo(() => {
    const now = new Date();
    const today = localDateStr(now);
    let start: Date;
    switch (catPeriod) {
      case "week": {
        const day = now.getDay();
        const d = new Date(now);
        d.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        start = d;
        break;
      }
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter": {
        const q = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), q, 1);
        break;
      }
      case "half-year": {
        const h = Math.floor(now.getMonth() / 6) * 6;
        start = new Date(now.getFullYear(), h, 1);
        break;
      }
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }
    return { start: localDateStr(start!), end: today };
  }, [catPeriod]);

  const catTxns = useMemo(
    () =>
      transactions.filter(
        (t) => t.date >= catRange.start && t.date <= catRange.end,
      ),
    [transactions, catRange],
  );

  const sortedCategories = useMemo(() => {
    const typeTxns = catTxns.filter((t) => t.type === catType);
    const byCategory = new Map<string, { amount: number; count: number }>();
    for (const tx of typeTxns) {
      const cat = categoryMap.get(tx.categoryId);
      if (!cat || cat.isArchived) continue;
      const e = byCategory.get(tx.categoryId) || { amount: 0, count: 0 };
      e.amount += tx.amount;
      e.count += 1;
      byCategory.set(tx.categoryId, e);
    }
    const total = typeTxns.reduce((s, t) => {
      const cat = categoryMap.get(t.categoryId);
      if (!cat || cat.isArchived) return s;
      return s + t.amount;
    }, 0);
    return Array.from(byCategory.entries())
      .map(([id, { amount, count }]) => {
        const cat = categoryMap.get(id);
        return {
          id,
          name: cat?.name || "Без категории",
          color: CATEGORY_COLORS_HEX[cat?.color || ""] || "#6b7280",
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          count,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [catTxns, catType, categoryMap]);

  const chartCategories = useMemo(
    () => sortedCategories.slice(0, 8),
    [sortedCategories],
  );
  const chartOtherTotal = useMemo(
    () => sortedCategories.slice(8).reduce((s, c) => s + c.amount, 0),
    [sortedCategories],
  );
  const chartOtherPct = useMemo(
    () =>
      chartOtherTotal > 0 && sortedCategories.length > 0
        ? (chartOtherTotal /
            sortedCategories.reduce((s, c) => s + c.amount, 0)) *
          100
        : 0,
    [chartOtherTotal, sortedCategories],
  );

  const CAT_PERIOD_LABELS: Record<string, string> = {
    week: "Неделя",
    month: "Месяц",
    quarter: "Квартал",
    "half-year": "Полгода",
    year: "Год",
  };

  const daysInPeriod = dashboardRange
    ? Math.round(
        (parseLocalDate(dashboardRange.end).getTime() -
          parseLocalDate(dashboardRange.start).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1
    : 30;
  const dailyAvgExpense = daysInPeriod > 0 ? periodExpenses / daysInPeriod : 0;
  const dailyAvgIncome = daysInPeriod > 0 ? periodIncome / daysInPeriod : 0;
  const projectedRemaining = periodIncome - periodExpenses;

  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const dailyChartData = useMemo(() => {
    if (!transactions.length || !dashboardRange) return null;
    const startDate = parseLocalDate(dashboardRange.start);
    const endDate = parseLocalDate(dashboardRange.end);
    const daysDiff =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const data: { label: string; income: number; expense: number }[] = [];
    let maxVal = 0;
    const isLongPeriod =
      dashboardPeriod === "quarter" ||
      dashboardPeriod === "half-year" ||
      dashboardPeriod === "year";
    if (isLongPeriod) {
      const monthly = new Map<string, { income: number; expense: number }>();
      for (const tx of transactions) {
        const monthKey = tx.date.slice(0, 7);
        const e = monthly.get(monthKey) || { income: 0, expense: 0 };
        if (tx.type === "income") e.income += tx.amount;
        else e.expense += tx.amount;
        monthly.set(monthKey, e);
      }
      const sorted = Array.from(monthly.entries()).sort(([a], [b]) =>
        a < b ? -1 : 1,
      );
      for (const [monthKey, vals] of sorted) {
        data.push({ label: monthKey, ...vals });
        if (vals.income > maxVal) maxVal = vals.income;
        if (vals.expense > maxVal) maxVal = vals.expense;
      }
    } else {
      for (let d = 0; d < daysDiff; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + d);
        const prefix = localDateStr(date);
        const income = transactions
          .filter((t) => t.type === "income" && t.date.startsWith(prefix))
          .reduce((s, t) => s + t.amount, 0);
        const expense = transactions
          .filter((t) => t.type === "expense" && t.date.startsWith(prefix))
          .reduce((s, t) => s + t.amount, 0);
        const label =
          dashboardPeriod === "week"
            ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][date.getDay()]
            : String(date.getDate());
        data.push({ label, income, expense });
        if (income > maxVal) maxVal = income;
        if (expense > maxVal) maxVal = expense;
      }
    }
    return { days: data.length, data, maxVal: maxVal || 1 };
  }, [transactions, dashboardRange, dashboardPeriod]);

  const MONTH_NAMES = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const budgetLoad = useMemo(() => {
    if (!budget || !budget.categoryBudgets.length) return null;
    const activeCatBudgets = budget.categoryBudgets.filter((cb) => {
      const cat = categoryMap.get(cb.categoryId);
      return cat && !cat.isArchived;
    });
    if (!activeCatBudgets.length) return null;
    const totalLimit = activeCatBudgets.reduce((s, cb) => s + cb.limit, 0);
    const categories = activeCatBudgets.map((cb) => {
      const spent = periodTxns
        .filter((t) => t.type === "expense" && t.categoryId === cb.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const cat = categoryMap.get(cb.categoryId)!;
      return {
        id: cb.categoryId,
        name: cat.name,
        color: CATEGORY_COLORS_HEX[cat.color] || "#6b7280",
        limit: cb.limit,
        spent,
        pct:
          cb.limit > 0
            ? Math.min(Math.round((spent / cb.limit) * 100), 100)
            : 0,
      };
    });
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const totalPct =
      totalLimit > 0
        ? Math.min(Math.round((totalSpent / totalLimit) * 100), 100)
        : 0;
    return { totalLimit, totalSpent, totalPct, categories };
  }, [budget, periodTxns, categoryMap]);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalAccounts = accounts.length;
  const cryptoAccounts = accounts.filter((a) => a.type === "crypto").length;
  const fiatAccounts = totalAccounts - cryptoAccounts;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Общий баланс</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">
                {ratesLoaded ? Math.round(totalBalance).toLocaleString() : <span className="inline-block h-10 w-48 bg-muted animate-pulse rounded-lg" />} ₽
              </p>
              <p className="text-xs text-muted-foreground">
                {getDisplayCurrency()} · {usdtRate > 0 ? `${usdtRate.toFixed(2)} ₽/$` : "—"}
                {totalAccounts > 0 && ` · ${totalAccounts} ${totalAccounts === 1 ? "счёт" : "счетов"}`}
              </p>
            </div>
            <div className="flex gap-3">
              {["week", "month", "quarter", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setDashboardPeriod(p as typeof dashboardPeriod)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    dashboardPeriod === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {p === "week" ? "Нед" : p === "month" ? "Мес" : p === "quarter" ? "Кв" : "Год"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Доходы</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{periodIncome.toLocaleString()} ₽</p>
          <div className="flex items-center gap-2">
            <DeltaBadge value={incomeDelta} invert={false} />
            {dailyChartData && dailyChartData.data.length > 1 && (
              <MiniSparkline data={dailyChartData.data.map((d) => d.income)} color="#22c55e" />
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Расходы</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{periodExpenses.toLocaleString()} ₽</p>
          <div className="flex items-center gap-2">
            <DeltaBadge value={expenseDelta} invert={true} />
            {dailyChartData && dailyChartData.data.length > 1 && (
              <MiniSparkline data={dailyChartData.data.map((d) => d.expense)} color="#f43f5e" />
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
              <PiggyBank className="h-4 w-4 text-sky-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Свободные</span>
          </div>
          <p className={cn("text-xl font-bold tabular-nums", freeMoney >= 0 ? "text-foreground" : "text-rose-500")}>
            {freeMoney >= 0 ? "+" : ""}{freeMoney.toLocaleString()} ₽
          </p>
          <DeltaBadge value={freeMoneyDelta} invert={false} />
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Здоровье</span>
          </div>
          <p className={cn("text-xl font-bold tabular-nums", healthColor)}>
            {hasData ? `${Math.round(healthRatio * 100)}%` : "—"}
          </p>
          {hasData && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  healthRatio <= 0.5 ? "bg-emerald-500" : healthRatio <= 0.8 ? "bg-amber-500" : "bg-rose-500",
                )}
                style={{ width: `${Math.min(healthRatio * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="space-y-4">
        {/* Row 1: Динамика / Транзакции / Подушка */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Динамика */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Динамика</h3>
              <span className="text-[10px] text-muted-foreground">
                {dashboardPeriod === "week" ? "Неделя" : dashboardPeriod === "month" ? "Месяц" : dashboardPeriod === "quarter" ? "Квартал" : "Год"}
              </span>
            </div>
            {dailyChartData && dailyChartData.data.length > 1 ? (
              <>
                <div className="relative h-32">
                  <svg width="100%" height="100%" viewBox={`0 0 ${dailyChartData.days * 30} 140`} preserveAspectRatio="none">
                    {[0, 25, 50, 75, 100].map((pct) => (
                      <line key={pct} x1="0" y1={140 - pct * 1.4} x2="100%" y2={140 - pct * 1.4} stroke="currentColor" strokeOpacity="0.06" strokeDasharray="4 4" />
                    ))}
                    {dailyChartData.data.map((d, i) => {
                      const h = (d.income / dailyChartData.maxVal) * 120;
                      return <rect key={`i${i}`} x={i * 30 + 3} y={140 - h} width="10" height={h} rx="2" fill="#22c55e" opacity="0.7" />;
                    })}
                    {dailyChartData.data.map((d, i) => {
                      const h = (d.expense / dailyChartData.maxVal) * 120;
                      return <rect key={`e${i}`} x={i * 30 + 16} y={140 - h} width="10" height={h} rx="2" fill="#f43f5e" opacity="0.7" />;
                    })}
                    {dailyChartData.data.map((d, i) => (
                      <text key={`l${i}`} x={i * 30 + 13} y="138" textAnchor="middle" fill="currentColor" opacity="0.4" fontSize="8">
                        {d.label}
                      </text>
                    ))}
                  </svg>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-sm bg-emerald-500" />Доходы
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-sm bg-rose-500" />Расходы
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                Нет данных
              </div>
            )}
          </div>

          {/* Транзакции */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">6 последних операций</h3>
            </div>
            <div className="space-y-1">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Нет операций</p>
              ) : (
                transactions
                  .filter((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    return cat && !cat.isArchived;
                  })
                  .sort((a, b) => (a.date < b.date ? 1 : -1))
                  .slice(0, 6)
                  .map((tx) => {
                    const cat = categoryMap.get(tx.categoryId);
                    const isIncome = tx.type === "income";
                    const CatIcon = cat?.icon ? getFinanceIcon(cat.icon) : isIncome ? TrendingUp : TrendingDown;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer px-1.5 -mx-1.5"
                        onClick={onNavigateToTransactions}
                      >
                        <div className={cn("flex h-6 w-6 items-center justify-center rounded-md shrink-0", isIncome ? "bg-emerald-500/10" : "bg-rose-500/10")}>
                          <CatIcon className={cn("h-3 w-3", isIncome ? "text-emerald-500" : "text-rose-500")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{tx.description || cat?.name || "—"}</p>
                          <p className="text-[9px] text-muted-foreground">{formatDate(tx.date)}</p>
                        </div>
                        <span className={cn("text-xs font-semibold tabular-nums shrink-0", isIncome ? "text-emerald-500" : "text-foreground")}>
                          {isIncome ? "+" : "-"}{tx.amount.toLocaleString()} ₽
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Подушка безопасности */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Подушка</h3>
            </div>
            {emergencyFund && emergencyFund.targetAmount > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Накоплено</span>
                  <span className="font-semibold tabular-nums">{emergencyFund.currentAmount.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Цель</span>
                  <span className="tabular-nums">{emergencyFund.targetAmount.toLocaleString()} ₽</span>
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                Не настроено
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Категории / Прогноз */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Категории */}
          <div className="rounded-xl border bg-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold">Категории</h3>
              <div className="flex items-center gap-1.5">
                <Select value={catPeriod} onValueChange={(v) => setCatPeriod(v as typeof catPeriod)}>
                  <SelectTrigger className="w-[110px] h-7 text-[11px]">
                    {CAT_PERIOD_LABELS[catPeriod]}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Неделя</SelectItem>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">Квартал</SelectItem>
                    <SelectItem value="half-year">Полгода</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex rounded-lg bg-muted p-0.5">
                  <button
                    onClick={() => setCatType("expense")}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-md transition-all",
                      catType === "expense" ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Расходы
                  </button>
                  <button
                    onClick={() => setCatType("income")}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium rounded-md transition-all",
                      catType === "income" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Доходы
                  </button>
                </div>
              </div>
            </div>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Нет данных за период</p>
            ) : (
              <div className="space-y-2.5">
                {chartCategories.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="truncate font-medium text-xs">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="tabular-nums font-medium text-xs">{cat.amount.toLocaleString()} ₽</span>
                        <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{cat.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${cat.percentage}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}cc)` }}
                      />
                    </div>
                  </div>
                ))}
                {chartOtherTotal > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
                        <span>Прочее</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="tabular-nums">{chartOtherTotal.toLocaleString()} ₽</span>
                        <span className="text-[10px] w-8 text-right tabular-nums">{chartOtherPct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                      <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${chartOtherPct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Прогноз + Бюджет */}
          <div className="space-y-4">
            {/* Прогноз */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarArrowUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Прогноз</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Расходы/день</p>
                  <p className="text-sm font-bold tabular-nums">{Math.round(dailyAvgExpense).toLocaleString()} ₽</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Доходы/день</p>
                  <p className="text-sm font-bold tabular-nums">{Math.round(dailyAvgIncome).toLocaleString()} ₽</p>
                </div>
              </div>
              <div className={cn("mt-3 p-3 rounded-lg text-center", projectedRemaining >= 0 ? "bg-sky-500/10" : "bg-rose-500/10")}>
                <p className="text-[10px] text-muted-foreground mb-1">Прогноз остатка</p>
                <p className={cn("text-lg font-bold tabular-nums", projectedRemaining >= 0 ? "text-sky-600" : "text-rose-600")}>
                  {projectedRemaining.toLocaleString()} ₽
                </p>
              </div>
            </div>

            {/* Бюджет */}
            {budgetLoad && (
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Бюджет</h3>
                  <span className={cn("text-xs font-medium", budgetLoad.totalPct <= 50 ? "text-emerald-500" : budgetLoad.totalPct <= 80 ? "text-amber-500" : "text-rose-500")}>
                    {budgetLoad.totalPct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", budgetLoad.totalPct <= 50 ? "bg-emerald-500" : budgetLoad.totalPct <= 80 ? "bg-amber-500" : "bg-rose-500")}
                    style={{ width: `${Math.min(budgetLoad.totalPct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{budgetLoad.totalSpent.toLocaleString()} ₽</span>
                  <span>{budgetLoad.totalLimit.toLocaleString()} ₽</span>
                </div>
                {budgetLoad.categories.slice(0, 3).map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs mt-1.5">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <span className="tabular-nums ml-1 text-muted-foreground">{cat.pct}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Обязательства */}
            {loans.length > 0 && (
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Обязательства</h3>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Долг</span>
                  <span className="font-semibold tabular-nums">{totalLoanDebt.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Платёж/мес</span>
                  <span className="tabular-nums">{totalLoanMonthly.toLocaleString()} ₽</span>
                </div>
                {overdueLoans > 0 && (
                  <p className="text-xs text-rose-500 font-medium mt-1">{overdueLoans} просрочено</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
