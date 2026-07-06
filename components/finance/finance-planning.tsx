"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Copy,
  Save,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import type {
  BudgetPlan,
  TransactionCategory,
  Transaction,
} from "@/lib/finance-types";

import {
  getBudgetPlansByUser,
  createBudgetPlan,
  updateBudgetPlan,
  deleteBudgetPlan,
  getTransactionsByUser,
  getCategoriesByUser,
} from "@/lib/finance-client";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getPeriodRange(period: BudgetPlan["period"]): {
  periodStart: string;
  periodEnd: string;
} {
  const todayStr = new Date().toISOString().split("T")[0];
  if (period === "day") return { periodStart: todayStr, periodEnd: todayStr };

  const today = new Date(todayStr + "T00:00:00Z");
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const d = today.getUTCDate();
  const dow = today.getUTCDay();

  switch (period) {
    case "week": {
      const monOff = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(todayStr + "T00:00:00Z");
      mon.setUTCDate(d + monOff);
      const sun = new Date(mon);
      sun.setUTCDate(mon.getUTCDate() + 6);
      return {
        periodStart: mon.toISOString().split("T")[0],
        periodEnd: sun.toISOString().split("T")[0],
      };
    }
    case "month": {
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0));
      return {
        periodStart: start.toISOString().split("T")[0],
        periodEnd: end.toISOString().split("T")[0],
      };
    }
    case "year": {
      return { periodStart: `${y}-01-01`, periodEnd: `${y}-12-31` };
    }
  }
}

function getDaysInRange(start: string, end: string): number {
  const s = new Date(start + "T00:00:00Z").getTime();
  const e = new Date(end + "T00:00:00Z").getTime();
  return Math.floor((e - s) / 86400000) + 1;
}

function getDaysElapsed(start: string): number {
  const s = new Date(start + "T00:00:00Z").getTime();
  return Math.max(1, Math.ceil((Date.now() - s) / 86400000));
}

const PERIOD_LABELS: Record<string, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
  year: "Год",
};

export function FinancePlanning() {
  const uid = auth.currentUser?.uid || "user-1";
  const [period, setPeriod] = useState<BudgetPlan["period"]>("month");
  const [budgetPlan, setBudgetPlan] = useState<BudgetPlan | null>(null);
  const [allBudgets, setAllBudgets] = useState<BudgetPlan[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expectedIncome, setExpectedIncome] = useState("");
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>(
    {},
  );

  const { periodStart, periodEnd } = useMemo(
    () => getPeriodRange(period),
    [period],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgets, cats, txs] = await Promise.all([
        getBudgetPlansByUser(uid),
        getCategoriesByUser(uid),
        getTransactionsByUser(uid),
      ]);
      setAllBudgets(budgets);
      const current = budgets.find(
        (b) => b.period === period && b.periodStart === periodStart,
      );
      setBudgetPlan(current || null);
      if (current) {
        setExpectedIncome(String(current.expectedIncome));
        const limits: Record<string, string> = {};
        for (const cb of current.categoryBudgets) {
          limits[cb.categoryId] = String(cb.limit);
        }
        setCategoryLimits(limits);
      } else {
        setExpectedIncome("");
        setCategoryLimits({});
      }
      setCategories(cats);
      setTransactions(txs);
    } catch {
      setCategories([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [uid, period, periodStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of transactions) {
      if (
        tx.type === "expense" &&
        tx.date >= periodStart &&
        tx.date <= periodEnd
      ) {
        map[tx.categoryId] = (map[tx.categoryId] || 0) + tx.amount;
      }
    }
    return map;
  }, [transactions, periodStart, periodEnd]);

  const totalPlanned = useMemo(
    () =>
      expenseCategories.reduce((sum, cat) => {
        const limit = categoryLimits[cat.id];
        return sum + (limit ? parseFloat(limit) : 0);
      }, 0),
    [expenseCategories, categoryLimits],
  );

  const totalSpent = useMemo(
    () =>
      expenseCategories.reduce(
        (sum, cat) => sum + (spentByCategory[cat.id] || 0),
        0,
      ),
    [expenseCategories, spentByCategory],
  );

  const periodDays = getDaysInRange(periodStart, periodEnd);
  const elapsedDays = getDaysElapsed(periodStart);
  const dailyAvg = elapsedDays > 0 ? totalSpent / elapsedDays : 0;
  const projectedTotal = dailyAvg * periodDays;
  const income = parseFloat(expectedIncome) || 0;
  const projectedRemaining = income - projectedTotal;

  const handleLimitChange = (categoryId: string, value: string) => {
    setCategoryLimits((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleSave = async () => {
    if (!expectedIncome.trim()) {
      toast.error("Укажите ожидаемый доход");
      return;
    }
    setSaving(true);
    const categoryBudgets = expenseCategories.map((cat) => ({
      categoryId: cat.id,
      limit: parseFloat(categoryLimits[cat.id] || "0") || 0,
    }));
    const body = {
      ...(budgetPlan ? { id: budgetPlan.id } : {}),
      userId: uid,
      period,
      periodStart,
      periodEnd,
      expectedIncome: parseFloat(expectedIncome) || 0,
      categoryBudgets,
    };
    try {
      if (budgetPlan) {
        const saved = await updateBudgetPlan(budgetPlan.id, {
          expectedIncome: parseFloat(expectedIncome) || 0,
          categoryBudgets,
        });
        setBudgetPlan(saved);
        setAllBudgets((prev) =>
          prev.map((b) => (b.id === saved.id ? saved : b)),
        );
      } else {
        const id = crypto.randomUUID();
        const saved = await createBudgetPlan({
          id,
          userId: uid,
          period,
          periodStart,
          periodEnd,
          expectedIncome: parseFloat(expectedIncome) || 0,
          categoryBudgets,
        });
        setBudgetPlan(saved);
        setAllBudgets((prev) => [...prev, saved]);
      }
      toast.success("Бюджет сохранён");
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromLastMonth = async () => {
    if (period !== "month") return;
    const today = new Date();
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth();
    const prevMonth = m - 1;
    const prevYear = prevMonth < 0 ? y - 1 : y;
    const pm = prevMonth < 0 ? 11 : prevMonth;
    const prevStart = new Date(Date.UTC(prevYear, pm, 1));
    const prevEnd = new Date(Date.UTC(prevYear, pm + 1, 0));
    const prevStartStr = prevStart.toISOString().split("T")[0];
    const prevEndStr = prevEnd.toISOString().split("T")[0];

    const prevBudget = allBudgets.find(
      (b) => b.periodStart === prevStartStr && b.periodEnd === prevEndStr,
    );

    if (prevBudget) {
      setExpectedIncome(String(prevBudget.expectedIncome));
      const limits: Record<string, string> = {};
      for (const cb of prevBudget.categoryBudgets) {
        limits[cb.categoryId] = String(cb.limit);
      }
      setCategoryLimits(limits);
      toast.success("Бюджет скопирован из прошлого месяца");
      return;
    }

    toast.error("Бюджет за прошлый месяц не найден");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select
            value={period}
            onValueChange={(v) => v && setPeriod(v as BudgetPlan["period"])}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["day", "week", "month", "year"] as const).map((p) => (
                <SelectItem key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {periodStart} — {periodEnd}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Бюджет</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Ожидаемый доход
              </label>
              <Input
                type="number"
                value={expectedIncome}
                onChange={(e) => setExpectedIncome(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Запланировано
              </label>
              <p className="text-2xl font-bold">
                {totalPlanned.toLocaleString()} ₽
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Остаток бюджета
              </label>
              <p
                className={cn(
                  "text-2xl font-bold",
                  totalPlanned - totalSpent >= 0
                    ? "text-emerald-600"
                    : "text-rose-600",
                )}
              >
                {(totalPlanned - totalSpent).toLocaleString()} ₽
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              <Save className="h-4 w-4 mr-1" />
              Сохранить план
            </Button>
            <Button
              variant="outline"
              onClick={handleCopyFromLastMonth}
              disabled={period !== "month"}
            >
              <Copy className="h-4 w-4 mr-1" />
              Из прошлого месяца
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Бюджет по категориям
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseCategories.map((cat) => {
              const limit = parseFloat(categoryLimits[cat.id] || "0") || 0;
              const spent = spentByCategory[cat.id] || 0;
              const remaining = limit - spent;
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const isWarning = pct > 80 && pct <= 100;
              const isDanger = pct > 100;
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium truncate">
                        {cat.name}
                      </span>
                      {isDanger && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1 py-0 h-5"
                        >
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          Перерасход
                        </Badge>
                      )}
                      {isWarning && !isDanger && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1 py-0 h-5 bg-amber-500/10 text-amber-600 border-amber-500/20"
                        >
                          <AlertTriangle className="h-3 w-3 mr-0.5" />
                          {Math.round(pct)}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-[120px]">
                        <Input
                          type="number"
                          value={categoryLimits[cat.id] || ""}
                          onChange={(e) =>
                            handleLimitChange(cat.id, e.target.value)
                          }
                          placeholder="0"
                          className="h-8 text-xs"
                        />
                      </div>
                      <span className="text-sm font-medium w-[100px] text-right tabular-nums text-muted-foreground">
                        {spent.toLocaleString()} ₽
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold w-[100px] text-right tabular-nums",
                          remaining >= 0 ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {remaining >= 0 ? "+" : ""}
                        {remaining.toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isDanger
                          ? "bg-rose-500"
                          : isWarning
                            ? "bg-amber-500"
                            : "bg-emerald-500",
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Прогноз</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Средний расход в день:{" "}
              <strong>
                {dailyAvg.toLocaleString("ru-RU", { maximumFractionDigits: 0 })}{" "}
                ₽
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Прогнозируемый расход за период:{" "}
              <strong>
                {projectedTotal.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}{" "}
                ₽
              </strong>
            </span>
          </div>
          <div
            className={cn(
              "rounded-lg p-4",
              projectedRemaining >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10",
            )}
          >
            <p
              className={cn(
                "text-sm font-semibold",
                projectedRemaining >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {projectedRemaining >= 0
                ? `Если ничего не изменится, у вас останется ${projectedRemaining.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`
                : `Если ничего не изменится, у вас будет перерасход ${Math.abs(projectedRemaining).toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Дней прошло: {elapsedDays} из {periodDays} · Дневной средний:{" "}
              {dailyAvg.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
