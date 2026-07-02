"use client";

import { useMemo } from "react";
import type { PersonalTask, Priority } from "@/lib/models";

const COLORS: Record<Priority, string> = {
  high: "#f43f5e",
  medium: "#f59e0b",
  low: "#0ea5e9",
};

const STATUS_COLORS = {
  completed: "#10b981",
  pending: "#6b7280",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

function DonutChart({
  segments,
  size = 120,
  strokeWidth = 20,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const paths = useMemo(() => {
    if (total === 0) return [];
    let cumulativePercent = 0;
    return segments
      .filter((s) => s.value > 0)
      .map((seg) => {
        const percent = seg.value / total;
        const offset = cumulativePercent * circumference;
        const length = percent * circumference;
        cumulativePercent += percent;
        return { ...seg, offset, length };
      });
  }, [segments, total, circumference]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Segments */}
        {paths.map((seg) => (
          <circle
            key={seg.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference - seg.length}`}
            strokeDashoffset={-seg.offset}
            className="transition-all duration-500"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <span className="text-lg font-bold tabular-nums">{total}</span>
    </div>
  );
}

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  title: string;
}

function BarChart({ data, title }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <div className="flex flex-col gap-1.5">
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
    const counts: Record<Priority, number> = { high: 0, medium: 0, low: 0 };
    tasks.forEach((t) => {
      counts[t.priority]++;
    });
    return (["high", "medium", "low"] as Priority[]).map((p) => ({
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

  const total = tasks.length;

  return (
    <div className="rounded-lg border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Дашборд</h3>
        <span className="text-xs text-muted-foreground">Всего: {total}</span>
      </div>

      {/* Donut charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1">
          <DonutChart segments={priorityData} size={100} strokeWidth={18} />
          <span className="text-[11px] font-medium text-muted-foreground">
            По приоритетам
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <DonutChart segments={statusData} size={100} strokeWidth={18} />
          <span className="text-[11px] font-medium text-muted-foreground">
            По статусам
          </span>
        </div>
      </div>

      {/* Legend for donuts */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {priorityData.map((d) => (
          <span key={d.label} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label} — {d.value}
          </span>
        ))}
        {statusData.map((d) => (
          <span key={d.label} className="flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label} — {d.value}
          </span>
        ))}
      </div>

      <div className="border-t pt-4">
        <BarChart data={priorityData} title="Бары по приоритетам" />
      </div>
    </div>
  );
}
