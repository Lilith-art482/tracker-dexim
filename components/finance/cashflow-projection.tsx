"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  FinanceAccount,
  RecurringTransaction,
} from "@/lib/finance-types";

interface CashflowProjectionProps {
  accounts: FinanceAccount[];
  recurringTransactions: RecurringTransaction[];
}

const CHART_LEFT = 45;
const CHART_RIGHT = 770;
const CHART_TOP = 10;
const CHART_BOTTOM = 135;
const CHART_W = CHART_RIGHT - CHART_LEFT;
const CHART_H = CHART_BOTTOM - CHART_TOP;

export function CashflowProjection({
  accounts,
  recurringTransactions,
}: CashflowProjectionProps) {
  const { dataPoints, startingBalance, minBalance, endingBalance } =
    useMemo(() => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const totalBalance = accounts.reduce(
        (sum, a) => sum + (a.balance ?? 0),
        0,
      );

      const activeRecurring = recurringTransactions.filter(
        (r) => r.isActive && r.interval === "monthly",
      );

      const monthlyExpenses = activeRecurring
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

      const dailyNonRecurring = (monthlyExpenses / 30) * 0.3;

      const points: { day: number; balance: number }[] = [];
      let minBal = totalBalance;
      let current = totalBalance;

      for (let offset = 0; offset < 30; offset++) {
        const date = new Date(today);
        date.setUTCDate(date.getUTCDate() + offset);
        const dayOfMonth = date.getUTCDate();

        for (const rt of activeRecurring) {
          const lastDay = new Date(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
          ).getUTCDate();
          const effectiveDay = Math.min(rt.dayOfMonth, lastDay);

          if (dayOfMonth === effectiveDay) {
            current += rt.type === "income" ? rt.amount : -rt.amount;
          }
        }

        if (offset > 0) {
          current -= dailyNonRecurring;
        }

        current = Math.round(current * 100) / 100;
        points.push({ day: offset, balance: current });
        if (current < minBal) minBal = current;
      }

      return {
        dataPoints: points,
        startingBalance: totalBalance,
        minBalance: minBal,
        endingBalance: current,
      };
    }, [accounts, recurringTransactions]);

  const minVal = Math.min(0, ...dataPoints.map((d) => d.balance));
  const maxVal = Math.max(...dataPoints.map((d) => d.balance));
  const range = maxVal - minVal || 1;

  const yForVal = (val: number) =>
    CHART_TOP + CHART_H - ((val - minVal) / range) * CHART_H;
  const zeroY = yForVal(0);

  const pointsStr = dataPoints
    .map(
      (d, i) =>
        `${CHART_LEFT + (i / 29) * CHART_W},${yForVal(d.balance)}`,
    )
    .join(" ");

  const areaPath = `${pointsStr} L${CHART_LEFT + CHART_W},${zeroY} L${CHART_LEFT},${zeroY}`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = minVal + ratio * range;
    const y = CHART_TOP + ratio * CHART_H;
    return { y, val: Math.round(val) };
  });

  const xLabels = [1, 5, 10, 15, 20, 25, 30];

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4" />
          Прогноз движения денег (30 дней)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <svg viewBox="0 0 800 155" className="w-full h-auto">
            {gridLines.map(({ y, val }) => (
              <g key={y}>
                <line
                  x1={CHART_LEFT}
                  y1={y}
                  x2={CHART_RIGHT}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                />
                <text
                  x={CHART_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  {val.toLocaleString()}
                </text>
              </g>
            ))}

            <line
              x1={CHART_LEFT}
              y1={zeroY}
              x2={CHART_RIGHT}
              y2={zeroY}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1"
              strokeDasharray="4"
            />

            {dataPoints.length > 1 && (
              <path
                d={areaPath}
                fill={
                  endingBalance >= 0
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(239,68,68,0.15)"
                }
              />
            )}

            <polyline
              points={pointsStr}
              fill="none"
              stroke={endingBalance >= 0 ? "#22c55e" : "#ef4444"}
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {xLabels.map((day) => {
              const x = CHART_LEFT + ((day - 1) / 29) * CHART_W;
              return (
                <text
                  key={day}
                  x={x}
                  y={CHART_BOTTOM + 13}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  fontSize="10"
                >
                  {day}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
          <span className="text-muted-foreground">
            Начальный баланс:{" "}
            <span className="font-semibold text-foreground">
              {Math.round(startingBalance).toLocaleString()} ₽
            </span>
          </span>
          <span className="text-muted-foreground">
            Прогноз через 30 дней:{" "}
            <span
              className={cn(
                "font-semibold",
                endingBalance >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {Math.round(endingBalance).toLocaleString()} ₽
            </span>
          </span>
          <span className="text-muted-foreground">
            Минимальный баланс:{" "}
            <span className="font-semibold text-foreground">
              {Math.round(minBalance).toLocaleString()} ₽
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
