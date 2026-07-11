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

  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of periodTxns) {
      if (tx.type !== "expense") continue;
      map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
    }
    const sorted = Object.entries(map)
      .map(([id, amount]) => {
        const cat = categoryMap.get(id);
        return {
          id,
          name: cat?.name || "Без категории",
          amount,
          color: CATEGORY_COLORS_HEX[cat?.color || ""] || "#6b7280",
        };
      })
      .sort((a, b) => b.amount - a.amount);
    return sorted;
  }, [periodTxns, categoryMap]);

  const topCategories = expenseCategories.slice(0, 6);
  const otherAmount = expenseCategories
    .slice(6)
    .reduce((s, c) => s + c.amount, 0);
  const totalExpenses = periodExpenses;

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
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Расходы по категориям
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalExpenses === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Нет расходов за период
              </p>
            ) : (
              <>
                {topCategories.map((cat) => {
                  const pct = (cat.amount / totalExpenses) * 100;
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium tabular-nums ml-2">
                          {cat.amount.toLocaleString()} ₽
                        </span>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: cat.color,
                          }}
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
                      <span className="tabular-nums ml-2">
                        {otherAmount.toLocaleString()} ₽
                      </span>
                      <span className="text-xs w-10 text-right">
                        {Math.round((otherAmount / totalExpenses) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-muted-foreground/40"
                        style={{
                          width: `${(otherAmount / totalExpenses) * 100}%`,
                        }}
                      />
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
