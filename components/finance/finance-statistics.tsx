"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  ArrowUpDown,
  Loader2,
  Activity,
} from "lucide-react";
import type { Transaction, TransactionCategory } from "@/lib/finance-types";
import {
  getTransactionsByUser,
  getCategoriesByUser,
} from "@/lib/finance-client";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Period = "month" | "quarter" | "year";

const PERIOD_PREV_LABELS: Record<Period, string> = {
  month: "месяцем",
  quarter: "кварталом",
  year: "годом",
};

function getPeriodRange(period: Period) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  let start: Date;

  if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), q, 1);
  } else {
    start = new Date(now.getFullYear(), 0, 1);
  }

  return { start: start.toISOString().split("T")[0], end: today };
}

function getPreviousPeriodRange(period: Period) {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (period === "month") {
    end = new Date(now.getFullYear(), now.getMonth(), 0);
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  } else if (period === "quarter") {
    const q = Math.floor(now.getMonth() / 3) * 3;
    end = new Date(now.getFullYear(), q, 0);
    start = new Date(now.getFullYear(), q - 3, 1);
  } else {
    end = new Date(now.getFullYear() - 1, 11, 31);
    start = new Date(now.getFullYear() - 1, 0, 1);
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function getTrendDates(period: Period): string[] {
  const now = new Date();
  const count = period === "year" ? 30 : 7;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function CategoryBarChart({
  data,
}: {
  data: { label: string; color: string; percentage: number }[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const barHeight = 22;
    const gap = 10;
    const totalHeight = data.length * (barHeight + gap);
    const startY = Math.max(8, (h - totalHeight) / 2);

    const labelX = 8;
    const labelW = 80;
    const barX = labelX + labelW;
    const percentX = w - 8;
    const barW = percentX - barX - 40;

    data.forEach((item, i) => {
      const y = startY + i * (barHeight + gap);

      ctx.fillStyle = "#374151";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(item.label, labelX, y + barHeight / 2);

      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(barX, y, barW, barHeight);

      ctx.fillStyle = item.color;
      const fillW = barW * (item.percentage / 100);
      ctx.fillRect(barX, y, fillW, barHeight);

      ctx.fillStyle = "#6b7280";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(
        `${Math.round(item.percentage)}%`,
        percentX,
        y + barHeight / 2,
      );
    });
  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-[220px]" />;
}

function TrendLineChart({
  data,
}: {
  data: { date: string; income: number; expense: number }[];
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

    const allValues = data.flatMap((d) => [d.income, d.expense]);
    const min = Math.min(...allValues) * 0.95;
    const max = Math.max(...allValues) * 1.05;
    const range = max - min || 1;

    const padding = { top: 16, right: 16, bottom: 24, left: 52 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    const getPoint = (value: number, i: number) => ({
      x: padding.left + (i / (data.length - 1)) * plotW,
      y: padding.top + plotH - ((value - min) / range) * plotH,
    });

    const expensePoints = data.map((d, i) => getPoint(d.expense, i));

    ctx.beginPath();
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.moveTo(expensePoints[0].x, expensePoints[0].y);
    for (let i = 1; i < expensePoints.length; i++) {
      ctx.lineTo(expensePoints[i].x, expensePoints[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = "#ef444415";
    ctx.beginPath();
    ctx.moveTo(expensePoints[0].x, padding.top + plotH);
    for (const p of expensePoints) ctx.lineTo(p.x, p.y);
    ctx.lineTo(expensePoints[expensePoints.length - 1].x, padding.top + plotH);
    ctx.closePath();
    ctx.fill();

    const incomePoints = data.map((d, i) => getPoint(d.income, i));

    ctx.beginPath();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.moveTo(incomePoints[0].x, incomePoints[0].y);
    for (let i = 1; i < incomePoints.length; i++) {
      ctx.lineTo(incomePoints[i].x, incomePoints[i].y);
    }
    ctx.stroke();

    ctx.fillStyle = "#10b98115";
    ctx.beginPath();
    ctx.moveTo(incomePoints[0].x, padding.top + plotH);
    for (const p of incomePoints) ctx.lineTo(p.x, p.y);
    ctx.lineTo(incomePoints[incomePoints.length - 1].x, padding.top + plotH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#888";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= 4; i++) {
      const val = min + (range / 4) * (4 - i);
      const y = padding.top + (plotH / 4) * i;
      ctx.fillText(Math.round(val).toLocaleString(), padding.left - 6, y);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#999";
    ctx.font = "10px sans-serif";
    const step = Math.max(1, Math.floor(data.length / 5));
    for (let i = 0; i < data.length; i += step) {
      const d = new Date(data[i].date + "T00:00:00Z");
      const x = padding.left + (i / (data.length - 1)) * plotW;
      ctx.fillText(`${d.getDate()}.${d.getMonth() + 1}`, x, h - 22);
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "11px sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillRect(w - 120, 4, 10, 10);
    ctx.fillStyle = "#374151";
    ctx.fillText("Доходы", w - 106, 3);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(w - 56, 4, 10, 10);
    ctx.fillStyle = "#374151";
    ctx.fillText("Расходы", w - 42, 3);
  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-[220px]" />;
}

export function FinanceStatistics() {
  const [period, setPeriod] = useState<Period>("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortDesc, setSortDesc] = useState(true);

  const uid = auth.currentUser?.uid || "user-1";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([
        getTransactionsByUser(uid),
        getCategoriesByUser(uid),
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch {
      setTransactions([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>();
    for (const cat of categories.filter((c) => !c.isArchived)) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const range = useMemo(() => getPeriodRange(period), [period]);
  const prevRange = useMemo(() => getPreviousPeriodRange(period), [period]);

  const periodTxns = useMemo(
    () =>
      transactions.filter((t) => t.date >= range.start && t.date <= range.end),
    [transactions, range],
  );

  const prevPeriodTxns = useMemo(
    () =>
      transactions.filter(
        (t) => t.date >= prevRange.start && t.date <= prevRange.end,
      ),
    [transactions, prevRange],
  );

  const incomeTotal = useMemo(
    () =>
      periodTxns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [periodTxns],
  );

  const expenseTotal = useMemo(
    () =>
      periodTxns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [periodTxns],
  );

  const netTotal = incomeTotal - expenseTotal;

  const prevIncomeTotal = useMemo(
    () =>
      prevPeriodTxns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [prevPeriodTxns],
  );

  const prevExpenseTotal = useMemo(
    () =>
      prevPeriodTxns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [prevPeriodTxns],
  );

  const categoryStats = useMemo(() => {
    const expenseTxns = periodTxns.filter((t) => t.type === "expense");
    const byCategory = new Map<string, { amount: number; count: number }>();

    for (const tx of expenseTxns) {
      const cat = categoryMap.get(tx.categoryId);
      if (!cat) continue;
      const existing = byCategory.get(tx.categoryId) || {
        amount: 0,
        count: 0,
      };
      existing.amount += tx.amount;
      existing.count += 1;
      byCategory.set(tx.categoryId, existing);
    }

    return Array.from(byCategory.entries())
      .map(([categoryId, { amount, count }]) => {
        const cat = categoryMap.get(categoryId);
        return {
          categoryId,
          name: cat?.name || "Без категории",
          color: cat?.color || "#6b7280",
          amount,
          percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
          count,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodTxns, expenseTotal, categoryMap]);

  const barChartData = useMemo(() => {
    const top5 = categoryStats.slice(0, 5);
    const other = categoryStats.slice(5);
    const otherAmount = other.reduce((s, c) => s + c.amount, 0);

    if (otherAmount > 0) {
      top5.push({
        categoryId: "other",
        name: "Прочее",
        color: "#6b7280",
        amount: otherAmount,
        percentage: expenseTotal > 0 ? (otherAmount / expenseTotal) * 100 : 0,
        count: other.reduce((s, c) => s + c.count, 0),
      });
    }

    return top5.map((c) => ({
      label: c.name,
      color: c.color,
      percentage: c.percentage,
    }));
  }, [categoryStats, expenseTotal]);

  const trendData = useMemo(() => {
    const dates = getTrendDates(period);
    return dates.map((date) => {
      const dayTxns = transactions.filter((t) => t.date === date);
      return {
        date,
        income: dayTxns
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: dayTxns
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, period]);

  const expenseChange = useMemo(() => {
    if (prevExpenseTotal === 0) return null;
    return ((expenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100;
  }, [expenseTotal, prevExpenseTotal]);

  const incomeChange = useMemo(() => {
    if (prevIncomeTotal === 0) return null;
    return ((incomeTotal - prevIncomeTotal) / prevIncomeTotal) * 100;
  }, [incomeTotal, prevIncomeTotal]);

  const sortedStats = useMemo(() => {
    return [...categoryStats].sort((a, b) =>
      sortDesc ? b.amount - a.amount : a.amount - b.amount,
    );
  }, [categoryStats, sortDesc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const periodLabel = PERIOD_PREV_LABELS[period];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Месяц</SelectItem>
            <SelectItem value="quarter">Квартал</SelectItem>
            <SelectItem value="year">Год</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Доходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              +{incomeTotal.toLocaleString()} ₽
            </p>
            {incomeChange !== null && (
              <p
                className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  incomeChange >= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {incomeChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(incomeChange).toFixed(1)}% к прошлому {periodLabel}
              </p>
            )}
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
            <p className="text-2xl font-bold text-rose-600">
              -{expenseTotal.toLocaleString()} ₽
            </p>
            {expenseChange !== null && (
              <p
                className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  expenseChange <= 0 ? "text-emerald-600" : "text-rose-600",
                )}
              >
                {expenseChange <= 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                {Math.abs(expenseChange).toFixed(1)}% к прошлому {periodLabel}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-sky-600">
              <Activity className="h-4 w-4" />
              Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                netTotal >= 0 ? "text-sky-600" : "text-rose-600",
              )}
            >
              {netTotal >= 0 ? "+" : ""}
              {netTotal.toLocaleString()} ₽
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4" />
              Категории расходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <CategoryBarChart data={barChartData} />
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                Нет данных за период
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" />
              Динамика доходов и расходов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length >= 2 ? (
              <TrendLineChart data={trendData} />
            ) : (
              <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
                Недостаточно данных
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {expenseChange !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Сравнение с прошлым {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-sm text-muted-foreground">Расходы </span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    expenseChange > 0 ? "text-rose-600" : "text-emerald-600",
                  )}
                >
                  {expenseChange > 0
                    ? `выросли на ${Math.abs(expenseChange).toFixed(1)}%`
                    : expenseChange < 0
                      ? `снизились на ${Math.abs(expenseChange).toFixed(1)}%`
                      : "не изменились"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {" "}
                  по сравнению с прошлым {periodLabel}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Было: {prevExpenseTotal.toLocaleString()} ₽
                </span>
                <span className="text-muted-foreground">
                  Стало: {expenseTotal.toLocaleString()} ₽
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Категории расходов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет расходов за выбранный период
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left pb-2 font-medium w-8" />
                    <th className="text-left pb-2 font-medium">Категория</th>
                    <th
                      className="text-right pb-2 font-medium cursor-pointer select-none"
                      onClick={() => setSortDesc(!sortDesc)}
                    >
                      <span className="inline-flex items-center gap-1">
                        Сумма
                        <ArrowUpDown className="h-3 w-3" />
                      </span>
                    </th>
                    <th className="text-right pb-2 font-medium">%</th>
                    <th className="text-right pb-2 font-medium">
                      Кол-во операций
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStats.map((stat) => (
                    <tr
                      key={stat.categoryId}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-2.5">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: stat.color }}
                        />
                      </td>
                      <td className="py-2.5">{stat.name}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums">
                        {stat.amount.toLocaleString()} ₽
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                        {stat.percentage.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground tabular-nums">
                        {stat.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
