"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Target,
  PiggyBank,
  Landmark,
  Briefcase,
  Shield,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getHiddenModules, setHiddenModules } from "@/lib/finance-visibility";

const MODULES = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "accounts", label: "Счета", icon: Wallet },
  { id: "transactions", label: "Транзакции", icon: Receipt },
  { id: "planning", label: "Планирование", icon: Target },
  { id: "goals", label: "Цели", icon: PiggyBank },
  { id: "loans", label: "Кредиты", icon: Landmark },
  { id: "projects", label: "Проекты", icon: Briefcase },
  { id: "emergency", label: "Подушка", icon: Shield },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function HideModulesDialog({ open, onOpenChange, onSave }: Props) {
  const [hidden, setHidden] = useState<string[]>(() => getHiddenModules());

  const toggle = (id: string) => {
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    setHiddenModules(hidden);
    onOpenChange(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Скрыть пункты</DialogTitle>
          <DialogDescription>
            Отключите ненужные разделы, чтобы они не отображались в навигации.
            Настройки всегда видны.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          {MODULES.map((mod) => {
            const isHidden = hidden.includes(mod.id);
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => toggle(mod.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isHidden
                    ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
                    : "text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{mod.label}</span>
                <div
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    isHidden ? "bg-input" : "bg-emerald-500",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      isHidden ? "left-0.5" : "translate-x-4",
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm text-muted-foreground">
            Настройки
          </span>
          <span className="text-xs text-muted-foreground/60">всегда видно</span>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
