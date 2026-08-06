"use client";

import { useMemo } from "react";
import type { PersonalTask, Priority } from "@/lib/models";

const COLORS: Record<Priority, string> = {
  high: "#f43f5e",
  medium: "#f59e0b",
  low: "#0ea5e9",
  none: "#6b7280",
};

const STATUS_COLORS = {
  completed: "#10b981",
  pending: "#6b7280",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
  none: "Без приоритета",
};

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
  maxValue: number;
}

function BarChart({ data, title, maxValue }: BarChartProps) {
  if (maxValue === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
        <div className="flex h-[100px] items-center justify-center rounded-md bg-muted/20">
          <span className="text-xs text-muted-foreground">Нет данных</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="w-16 text-[11px] text-muted-foreground shrink-0 text-right">
              {d.label}
            </span>
            <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((d.value / maxValue) * 100, d.value > 0 ? 8 : 0)}%`,
                  backgroundColor: d.color,
                }}
              />
            </div>
            <span className="w-6 text-[11px] font-medium tabular-nums text-right shrink-0">
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PersonalDashboardProps {
  tasks: PersonalTask[];
}

export function PersonalDashboard({ tasks }: PersonalDashboardProps) {
  const priorityData = useMemo(() => {
    const counts: Record<Priority, number> = {
      high: 0,
      medium: 0,
      low: 0,
      none: 0,
    };
    tasks.forEach((t) => {
      counts[t.priority]++;
    });
    return (["high", "medium", "low", "none"] as Priority[]).map((p) => ({
      label: PRIORITY_LABELS[p],
      value: counts[p],
      color: COLORS[p],
    }));
  }, [tasks]);

  const statusData = useMemo(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const pending = tasks.length - completed;
    return [
      { label: "Выполнено", value: completed, color: STATUS_COLORS.completed },
      { label: "В работе", value: pending, color: STATUS_COLORS.pending },
    ];
  }, [tasks]);

  const maxPriority = Math.max(...priorityData.map((d) => d.value), 1);
  const maxStatus = Math.max(...statusData.map((d) => d.value), 1);

  const total = tasks.length;

  return (
    <div className="rounded-lg border p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Дашборд</h3>
        <span className="text-xs text-muted-foreground">Всего: {total}</span>
      </div>
      <BarChart
        data={priorityData}
        title="По приоритетам"
        maxValue={maxPriority}
      />
      <BarChart data={statusData} title="По статусам" maxValue={maxStatus} />
    </div>
  );
}
