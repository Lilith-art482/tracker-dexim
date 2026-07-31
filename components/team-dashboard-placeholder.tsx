"use client";

import { LayoutDashboard, Construction, ArrowRight } from "lucide-react";

export function TeamDashboardPlaceholder() {
  return (
    <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 ring-1 ring-violet-500/10">
            <LayoutDashboard className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Дашборд команды</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Обзор задач команды</p>
          </div>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-8 sm:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative flex flex-col items-center text-center max-w-md mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 ring-1 ring-amber-500/10 mb-6">
            <Construction className="h-8 w-8 text-amber-600" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            В разработке
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Дашборд для командных задач находится в стадии разработки.
            Скоро здесь будут доступны детальная аналитика по задачам команды,
            прогресс по проектам и статистика участников.
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <span>Следите за обновлениями</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>

          {/* Preview Grid */}
          <div className="mt-8 w-full grid grid-cols-3 gap-3 opacity-40">
            {[
              { label: "Задачи", value: "—" },
              { label: "Прогресс", value: "—" },
              { label: "Участники", value: "—" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/30 bg-muted/20 p-3"
              >
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
