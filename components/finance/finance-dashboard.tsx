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
} from "lucide-react";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
  EmergencyFund,
  BudgetPlan,
} from "@/lib/finance-types";
import { auth } from "@/lib/firebase";
import {
  getAccountsByUser,
  getTransactionsByUser,
  getCategoriesByUser,
  getBudgetPlansByUser,
  getEmergencyFund,
} from "@/lib/finance-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

export function FinanceDashboard() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [budget, setBudget] = useState<BudgetPlan | null>(null);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(
    null,
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [catPeriod, setCatPeriod] = useState<"week" | "month" | "quarter" | "half-year" | "year">("month");
  const [catType, setCatType] = useState<"expense" | "income">("expense");

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const uid = auth.currentUser?.uid || "user-1";

  const fetchAll = useCallback(
    async (isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      try {
        const [accs, txs, cats, buds, em] = await Promise.all([
          getAccountsByUser(uid),
          getTransactionsByUser(uid),
          getCategoriesByUser(uid),
          getBudgetPlansByUser(uid),
          getEmergencyFund(uid),
        ]);
        setAccounts(accs);
        setTransactions(txs);
        setCategories(cats);
        setBudget(buds.length > 0 ? buds[0] : null);
        setEmergencyFund(em);
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

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const periodTxns = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const end = now.toISOString().split("T")[0];
    return transactions.filter((t) => t.date >= start && t.date <= end);
  }, [transactions]);

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
  const freeMoney = periodIncome - periodExpenses - periodObligations;

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
    const today = now.toISOString().split("T")[0];
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
    return { start: start!.toISOString().split("T")[0], end: today };
  }, [catPeriod]);

  const catTxns = useMemo(
    () => transactions.filter((t) => t.date >= catRange.start && t.date <= catRange.end),
    [transactions, catRange],
  );

  const sortedCategories = useMemo(() => {
    const typeTxns = catTxns.filter((t) => t.type === catType);
    const byCategory = new Map<string, { amount: number; count: number }>();
    for (const tx of typeTxns) {
      const e = byCategory.get(tx.categoryId) || { amount: 0, count: 0 };
      e.amount += tx.amount;
      e.count += 1;
      byCategory.set(tx.categoryId, e);
    }
    const total = typeTxns.reduce((s, t) => s + t.amount, 0);
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

  const chartCategories = useMemo(() => sortedCategories.slice(0, 8), [sortedCategories]);
  const chartOtherTotal = useMemo(() => sortedCategories.slice(8).reduce((s, c) => s + c.amount, 0), [sortedCategories]);
  const chartOtherPct = useMemo(
    () => (chartOtherTotal > 0 && sortedCategories.length > 0
      ? (chartOtherTotal / sortedCategories.reduce((s, c) => s + c.amount, 0)) * 100
      : 0),
    [chartOtherTotal, sortedCategories],
  );

  const CAT_PERIOD_LABELS: Record<string, string> = {
    week: "Неделя",
    month: "Месяц",
    quarter: "Квартал",
    "half-year": "Полгода",
    year: "Год",
  };

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyAvgExpense = daysInMonth > 0 ? periodExpenses / daysInMonth : 0;
  const dailyAvgIncome = daysInMonth > 0 ? periodIncome / daysInMonth : 0;
  const projectedRemaining = periodIncome - periodExpenses;

  const budgetLoad = useMemo(() => {
    if (!budget || !budget.categoryBudgets.length) return null;
    const totalLimit = budget.categoryBudgets.reduce(
      (s, cb) => s + cb.limit,
      0,
    );
    const categories = budget.categoryBudgets.map((cb) => {
      const spent = periodTxns
        .filter((t) => t.type === "expense" && t.categoryId === cb.categoryId)
        .reduce((s, t) => s + t.amount, 0);
      const cat = categoryMap.get(cb.categoryId);
      return {
        id: cb.categoryId,
        name: cat?.name || "Без категории",
        color: CATEGORY_COLORS_HEX[cat?.color || ""] || "#6b7280",
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
  }, [budget, periodTxns]);

  if (initialLoading) {
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
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Доходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {periodIncome.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
        <Card>
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
          </CardContent>
        </Card>
        <Card>
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="quarter">Квартал</SelectItem>
                  <SelectItem value="half-year">Полгода</SelectItem>
                  <SelectItem value="year">Год</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border p-0.5">
                <button
                  onClick={() => setCatType("expense")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    catType === "expense"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Расходы
                </button>
                <button
                  onClick={() => setCatType("income")}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    catType === "income"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
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
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate font-medium">
                            {cat.name}
                          </span>
                        </div>
                        <span className="tabular-nums font-medium ml-2">
                          {cat.amount.toLocaleString()} ₽
                        </span>
                        <span className="text-xs text-muted-foreground w-12 text-right tabular-nums">
                          {cat.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {chartOtherTotal > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="h-3 w-3 rounded-full shrink-0 bg-muted-foreground/40" />
                          <span>Прочее</span>
                        </div>
                        <span className="tabular-nums ml-2">
                          {chartOtherTotal.toLocaleString()} ₽
                        </span>
                        <span className="text-xs w-12 text-right tabular-nums">
                          {chartOtherPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                          style={{ width: `${chartOtherPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-3 py-2 font-medium w-8" />
                        <th className="text-left px-3 py-2 font-medium">
                          Категория
                        </th>
                        <th className="text-right px-3 py-2 font-medium">
                          Сумма
                        </th>
                        <th className="text-right px-3 py-2 font-medium">%</th>
                        <th className="text-right px-3 py-2 font-medium">
                          Операций
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCategories.map((cat) => (
                        <tr
                          key={cat.id}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {cat.name}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">
                            {cat.amount.toLocaleString()} ₽
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                            {cat.percentage.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
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

          <Card>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Последние операции
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Нет операций
                </p>
              ) : (
                <div className="space-y-2">
                  {transactions
                    .sort((a, b) => (a.date < b.date ? 1 : -1))
                    .slice(0, 5)
                    .map((tx) => {
                      const cat = categoryMap.get(tx.categoryId);
                      const color =
                        CATEGORY_COLORS_HEX[cat?.color || ""] || "#6b7280";
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="truncate">
                              {cat?.name || "Без категории"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-medium tabular-nums">
                              {tx.type === "income" ? "+" : "-"}
                              {tx.amount.toLocaleString()} ₽
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {tx.date.includes("T")
                                ? tx.date.slice(5, 16).replace("T", " ")
                                : tx.date.slice(5)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
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
                {emergencyFund.targetAmount > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Накоплено</span>
                      <span className="font-semibold">
                        {emergencyFund.currentAmount.toLocaleString()} ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Цель</span>
                      <span>
                        {emergencyFund.targetAmount.toLocaleString()} ₽
                      </span>
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
          )}
        </div>
      </div>
    </div>
  );
}
