"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  CalendarDays,
  BarChart3,
  FlaskConical,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Block {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  desc: string;
  gradient: string;
  shadow: string;
}

const blocks: Block[] = [
  {
    id: "today",
    icon: ClipboardCheck,
    title: "Сегодня",
    subtitle: "Быстрый чекап",
    desc: "Дашборд за последние 8 дней",
    gradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
    shadow: "rgba(59,130,246,0.25)",
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "Календарь",
    subtitle: "Все отметки",
    desc: "Визуальное отображение по дням",
    gradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    shadow: "rgba(139,92,246,0.25)",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Аналитика",
    subtitle: "Графики и экспорт",
    desc: "Все графики, аналитика и экспорт данных",
    gradient: "linear-gradient(135deg, #10b981, #14b8a6)",
    shadow: "rgba(16,185,129,0.25)",
  },
  {
    id: "tests",
    icon: FlaskConical,
    title: "Анализы",
    subtitle: "Результаты и гормоны",
    desc: "Внесение результатов + график гормонов",
    gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
    shadow: "rgba(245,158,11,0.25)",
  },
  {
    id: "biohacking",
    icon: BookOpen,
    title: "Биохакинг",
    subtitle: "Полезные статьи",
    desc: "Подборки, советы и исследования",
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    shadow: "rgba(236,72,153,0.25)",
  },
];

export default function DuoDaysMenCalendar() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "6px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(59,130,246,0.25)",
            }}
          >
            <CalendarDays className="w-5 h-5" style={{ color: "white" }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
              }}
            >
              Men&apos;s Calendar
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Персональный трекинг для мужчин
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        {blocks.map((block) => {
          const Icon = block.icon;
          const isHovered = hovered === block.id;
          return (
            <div
              key={block.id}
              onMouseEnter={() => setHovered(block.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "20px",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                transform: isHovered
                  ? "translateY(-4px)"
                  : "translateY(0)",
                boxShadow: isHovered
                  ? `0 16px 40px ${block.shadow}`
                  : "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "4px",
                  background: block.gradient,
                  opacity: isHovered ? 1 : 0.6,
                  transition: "opacity 0.3s",
                }}
              />

              <div style={{ padding: "20px 22px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "13px",
                      background: block.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 4px 14px ${block.shadow}`,
                      flexShrink: 0,
                      transition: "transform 0.3s",
                      transform: isHovered
                        ? "scale(1.08)"
                        : "scale(1)",
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "white" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        marginBottom: "2px",
                        color: "var(--text)",
                      }}
                    >
                      {block.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {block.subtitle}
                    </div>
                  </div>
                  <ArrowRight
                    className="w-4 h-4"
                    style={{
                      color: "var(--text-muted)",
                      transition: "all 0.3s",
                      transform: isHovered
                        ? "translateX(2px)"
                        : "translateX(0)",
                      opacity: isHovered ? 1 : 0.4,
                      flexShrink: 0,
                      marginTop: "2px",
                    }}
                  />
                </div>

                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                    marginTop: "14px",
                  }}
                >
                  {block.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
