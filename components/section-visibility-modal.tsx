"use client";

import { Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSectionVisibility } from "@/lib/section-visibility-context";
import { useState } from "react";

interface SectionVisibilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTIONS = [
  {
    id: "planner",
    label: "Планнер",
    subs: null,
  },
  {
    id: "ideas",
    label: "Идея",
    subs: null,
  },
  {
    id: "finance",
    label: "Финансы",
    subs: [
      { id: "dashboard", label: "Дашборд" },
      { id: "accounts", label: "Счета" },
      { id: "planning", label: "Планирование" },
      { id: "goals", label: "Цели" },
      { id: "loans", label: "Обязательства" },
      { id: "emergency", label: "Подушка" },
      { id: "shopping", label: "Список покупок" },
      { id: "recurring", label: "Регулярные" },
      { id: "settings", label: "Настройки" },
    ],
  },
  {
    id: "work",
    label: "Работа",
    subs: null,
  },
  {
    id: "habits",
    label: "Привычки",
    subs: null,
  },
  {
    id: "family",
    label: "Семья",
    subs: [
      { id: "calendar", label: "Intimacy Log & Schedule" },
      { id: "cycle", label: "Cycle & Baby Planner" },
      { id: "men", label: "Men's Calendar" },
      { id: "stats", label: "Statistics" },
    ],
  },
  {
    id: "sport",
    label: "Спорт и Питание",
    subs: null,
  },
  {
    id: "sleep",
    label: "Сон",
    subs: [
      { id: "planning", label: "Планирование" },
      { id: "diary", label: "Дневник" },
      { id: "stats", label: "Статистика" },
    ],
  },
  {
    id: "focusing",
    label: "Фокусирование",
    subs: [
      { id: "pomodoro", label: "Pomodoro" },
      { id: "ultradian", label: "Ultradian" },
      { id: "timeboxing", label: "Timeboxing" },
      { id: "1-3-5", label: "1-3-5" },
      { id: "farm", label: "Ферма" },
      { id: "forest", label: "Лес" },
    ],
  },
];

export function SectionVisibilityModal({ open, onOpenChange }: SectionVisibilityModalProps) {
  const { isSectionVisible, isSubVisible, toggleSection, toggleSub } = useSectionVisibility();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Видимость разделов
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          {SECTIONS.map((section) => {
            const visible = isSectionVisible(section.id);
            const hasSubs = section.subs && section.subs.length > 0;
            const isExpanded = expanded[section.id];

            return (
              <div key={section.id}>
                {/* Section row */}
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 transition-colors",
                    visible ? "bg-muted/30" : "bg-muted/10 opacity-60",
                  )}
                >
                  {hasSubs && (
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
                      className="flex h-5 w-5 items-center justify-center text-muted-foreground/50 hover:text-muted-foreground"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  {!hasSubs && <div className="w-5" />}

                  <span className="flex-1 text-sm font-medium">{section.label}</span>

                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "flex h-7 w-12 items-center rounded-full transition-colors relative",
                      visible ? "bg-primary/30" : "bg-muted-foreground/20",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all",
                        visible ? "left-5.5" : "left-0.5",
                      )}
                    />
                  </button>
                </div>

                {/* Sub items */}
                {hasSubs && isExpanded && (
                  <div className="ml-8 space-y-0.5 mt-1 mb-2">
                    {section.subs!.map((sub) => {
                      const subVisible = isSubVisible(section.id, sub.id);
                      return (
                        <div
                          key={sub.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                            subVisible ? "bg-muted/20" : "bg-muted/5 opacity-50",
                          )}
                        >
                          <div className="w-5" />
                          <span className="flex-1 text-xs text-muted-foreground">{sub.label}</span>
                          <button
                            onClick={() => toggleSub(section.id, sub.id)}
                            className={cn(
                              "flex h-6 w-10 items-center rounded-full transition-colors relative",
                              subVisible ? "bg-primary/30" : "bg-muted-foreground/20",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                                subVisible ? "left-4.5" : "left-0.5",
                              )}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
