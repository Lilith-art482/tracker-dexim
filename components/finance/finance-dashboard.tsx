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
import { auth } from "@/lib/firebase";
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

  const uid = auth.currentUser?.uid || "user-1";

  const fetchAll = useCallback(
    async (isInitial = false) => {
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
    return accounts.reduce((sum, a) => {
      const rates = getCachedRates();
      const effectiveBalance =
        a.type === "crypto" && a.cryptoCoin && a.cryptoAmount != null && rates
          ? convert(a.cryptoAmount, a.cryptoCoin, a.currency, rates)
          : a.balance;
      return sum + convertToRUB(effectiveBalance, a.currency, usdtRate);
    }, 0);
  }, [accounts, usdtRate]);

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

  return (
    <div className="lg:flex lg:gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          style={{ animationDelay: "0ms" }}
        >
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Общий баланс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {Math.round(totalBalance).toLocaleString()} ₽
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {getDisplayCurrency()} — {usdtRate.toFixed(2)} ₽
              </p>
            </CardContent>
          </Card>
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "80ms" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Доходы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {periodIncome.toLocaleString()} ₽
              </p>
              <div className="flex items-center gap-2 mt-1">
                <DeltaBadge value={incomeDelta} invert={false} />
                {dailyChartData && dailyChartData.data.length > 1 && (
                  <MiniSparkline
                    data={dailyChartData.data.map((d) => d.income)}
                    color="#22c55e"
                  />
                )}
              </div>
            </CardContent>
          </Card>
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "160ms" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingDown className="h-4 w-4" />
                Расходы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {periodExpenses.toLocaleString()} ₽
              </p>
              <div className="flex items-center gap-2 mt-1">
                <DeltaBadge value={expenseDelta} invert={true} />
                {dailyChartData && dailyChartData.data.length > 1 && (
                  <MiniSparkline
                    data={dailyChartData.data.map((d) => d.expense)}
                    color="#f43f5e"
                  />
                )}
              </div>
            </CardContent>
          </Card>
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "240ms" }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <PiggyBank className="h-4 w-4" />
                Свободные деньги
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {freeMoney.toLocaleString()} ₽
              </p>
              <div className="flex items-center mt-1">
                <DeltaBadge value={freeMoneyDelta} invert={false} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "180ms" }}
          >
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                Категории
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={catPeriod}
                  onValueChange={(v) => setCatPeriod(v as typeof catPeriod)}
                >
                  <SelectTrigger className="w-[130px] h-8">
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
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      catType === "expense"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Расходы
                  </button>
                  <button
                    onClick={() => setCatType("income")}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                      catType === "income"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Доходы
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sortedCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Нет {catType === "expense" ? "расходов" : "доходов"} за период
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    {chartCategories.map((cat) => (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1"
                              style={
                                {
                                  backgroundColor: cat.color,
                                  "--tw-ring-color": cat.color,
                                } as React.CSSProperties
                              }
                            />
                            <span className="truncate font-medium">
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="tabular-nums font-medium">
                              {cat.amount.toLocaleString()} ₽
                            </span>
                            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                              {cat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${cat.percentage}%`,
                              background: `linear-gradient(90deg, ${cat.color}, ${cat.color}dd)`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {chartOtherTotal > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-offset-1 ring-muted-foreground/30 bg-muted-foreground/40" />
                            <span>Прочее</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="tabular-nums">
                              {chartOtherTotal.toLocaleString()} ₽
                            </span>
                            <span className="text-xs w-10 text-right tabular-nums">
                              {chartOtherPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-muted-foreground/40 transition-all duration-700 ease-out"
                            style={{ width: `${chartOtherPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left px-3 py-2.5 font-medium w-8" />
                          <th className="text-left px-3 py-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                            Категория
                          </th>
                          <th className="text-right px-3 py-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                            Сумма
                          </th>
                          <th className="text-right px-3 py-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                            %
                          </th>
                          <th className="text-right px-3 py-2.5 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                            Операций
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCategories.map((cat, i) => (
                          <tr
                            key={cat.id}
                            className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-3 py-2.5">
                              <div
                                className="h-2.5 w-2.5 rounded-full ring-2 ring-offset-1"
                                style={
                                  {
                                    backgroundColor: cat.color,
                                    "--tw-ring-color": cat.color,
                                  } as React.CSSProperties
                                }
                              />
                            </td>
                            <td className="px-3 py-2.5 font-medium">
                              <div className="flex items-center gap-2">
                                <span>{cat.name}</span>
                                <span className="text-[10px] text-muted-foreground/50">
                                  #{i + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                              {cat.amount.toLocaleString()} ₽
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">
                              <div className="inline-flex items-center gap-1.5">
                                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${cat.percentage}%`,
                                      backgroundColor: cat.color,
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8 text-right">
                                  {cat.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right text-muted-foreground tabular-nums">
                              {cat.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "260ms" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Последние операции
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center px-6">
                  Нет операций
                </p>
              ) : (
                <div>
                  {transactions
                    .filter((tx) => {
                      const cat = categoryMap.get(tx.categoryId);
                      return cat && !cat.isArchived;
                    })
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .slice(0, 10)
                    .map((tx, i) => {
                      const cat = categoryMap.get(tx.categoryId);
                      const isIncome = tx.type === "income";
                      const CatIcon = cat?.icon
                        ? getFinanceIcon(cat.icon)
                        : isIncome
                          ? TrendingUp
                          : TrendingDown;
                      return (
                        <div
                          key={tx.id}
                          className={cn(
                            "flex items-center justify-between px-6 py-3 text-sm transition-colors hover:bg-muted/20",
                            onNavigateToTransactions && "cursor-pointer",
                            i !== 0 && "border-t",
                          )}
                          onClick={onNavigateToTransactions}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                                isIncome
                                  ? "bg-emerald-500/10"
                                  : "bg-rose-500/10",
                              )}
                            >
                              <CatIcon
                                className={cn(
                                  "h-4 w-4",
                                  isIncome
                                    ? "text-emerald-500"
                                    : "text-rose-500",
                                )}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">
                                {tx.description || cat?.name || "Без категории"}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {cat?.name && tx.description
                                  ? `${cat.name} · `
                                  : ""}
                                {formatDate(tx.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span
                              className={cn(
                                "font-semibold tabular-nums",
                                isIncome
                                  ? "text-emerald-500"
                                  : "text-foreground",
                              )}
                            >
                              {isIncome ? "+" : "-"}
                              {(() => {
                                const accCurrency =
                                  accountMap.get(tx.accountId)?.currency ||
                                  "RUB";
                                const dc = getDisplayCurrency();
                                const rates = getCachedRates();
                                if (rates && accCurrency !== dc) {
                                  const converted = convert(
                                    tx.amount,
                                    accCurrency,
                                    dc,
                                    rates,
                                  );
                                  return (
                                    <>
                                      {converted.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      {getCurrencySymbol(dc)}
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    {tx.amount.toLocaleString()}{" "}
                                    {getCurrencySymbol(accCurrency)}
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "320ms" }}
          >
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
                    {hasData
                      ? `${Math.round(healthRatio * 100)}% расходов от доходов`
                      : "Нет операций за период"}
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
              )}
            </CardContent>
          </Card>

          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <CalendarArrowUp className="h-4 w-4" />
                Прогноз
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Средний расход в день
                </span>
                <span className="font-medium">
                  {Math.round(dailyAvgExpense).toLocaleString()} ₽
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Средний доход в день
                </span>
                <span className="font-medium">
                  {Math.round(dailyAvgIncome).toLocaleString()} ₽
                </span>
              </div>
              <div
                className={cn(
                  "flex justify-between text-sm font-medium pt-2 border-t",
                  projectedRemaining >= 0 ? "text-sky-600" : "text-rose-600",
                )}
              >
                <span>Прогноз остатка</span>
                <span>{projectedRemaining.toLocaleString()} ₽</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Если траты сохранятся на текущем уровне
              </p>
            </CardContent>
          </Card>

          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "480ms" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <PiggyBank className="h-4 w-4" />
                Подушка безопасности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencyFund && emergencyFund.targetAmount > 0 ? (
                <>
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
                      (emergencyFund.currentAmount /
                        emergencyFund.targetAmount) *
                        100,
                    )}
                    % от цели
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <PiggyBank className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Не настроено
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Установите цель в разделе Подушка
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
            style={{ animationDelay: "560ms" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Landmark className="h-4 w-4" />
                Обязательства
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loans.length > 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Долг</span>
                    <span className="font-semibold tabular-nums">
                      {totalLoanDebt.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Платёж/мес</span>
                    <span className="font-semibold tabular-nums">
                      {totalLoanMonthly.toLocaleString()} ₽
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Кол-во</span>
                    <span className="tabular-nums">
                      {loans.length}
                      {overdueLoans > 0 && (
                        <span className="text-rose-600 ml-1 text-xs font-medium">
                          · {overdueLoans} просрочено
                        </span>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Landmark className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Нет обязательств
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Кредиты, штрафы и коммунальные платежи
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="lg:w-[340px] shrink-0">
        <Card
          className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              Нагрузка на бюджет
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgetLoad ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Всего расходов</span>
                  <span className="font-semibold">
                    {budgetLoad.totalSpent.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Лимит бюджета</span>
                  <span>{budgetLoad.totalLimit.toLocaleString()} ₽</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      budgetLoad.totalPct <= 50
                        ? "bg-emerald-500"
                        : budgetLoad.totalPct <= 80
                          ? "bg-amber-500"
                          : "bg-rose-500",
                    )}
                    style={{ width: `${budgetLoad.totalPct}%` }}
                  />
                </div>
                <p
                  className={cn(
                    "text-xs text-center font-medium",
                    budgetLoad.totalPct <= 50
                      ? "text-emerald-600"
                      : budgetLoad.totalPct <= 80
                        ? "text-amber-600"
                        : "text-rose-600",
                  )}
                >
                  Использовано {budgetLoad.totalPct}% бюджета
                </p>
                <div className="space-y-2 pt-1">
                  {budgetLoad.categories.slice(0, 5).map((cat) => (
                    <div key={cat.id} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="tabular-nums ml-1">
                          {cat.spent.toLocaleString()} /{" "}
                          {cat.limit.toLocaleString()} ₽
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            cat.pct > 100
                              ? "bg-rose-500"
                              : cat.pct > 80
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                          )}
                          style={{ width: `${Math.min(cat.pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Target className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Бюджет не настроен
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Установите лимиты по категориям в бюджете
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
