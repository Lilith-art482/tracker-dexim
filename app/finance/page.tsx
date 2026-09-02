"use client";

import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  Wallet,
  Target,
  PiggyBank,
  Landmark,
  Shield,
  ShoppingCart,
  Repeat,
  Settings,
} from "lucide-react";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { FinanceAccounts } from "@/components/finance/finance-accounts";
import { FinancePlanning } from "@/components/finance/finance-planning";
import { FinanceGoals } from "@/components/finance/finance-goals";
import { FinanceLoans } from "@/components/finance/finance-loans";
import { FinanceEmergencyFund } from "@/components/finance/finance-emergency-fund";
import { FinanceSettings } from "@/components/finance/finance-settings";
import { FinanceShopping } from "@/components/finance/finance-shopping";
import { FinanceRecurring } from "@/components/finance/finance-recurring";
import { cn } from "@/lib/utils";
import { useSectionVisibility } from "@/lib/section-visibility-context";

const ALL_MODULES = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "accounts", label: "Счета", icon: Wallet },
  { id: "planning", label: "Планирование", icon: Target },
  { id: "goals", label: "Цели", icon: PiggyBank },
  { id: "loans", label: "Обязательства", icon: Landmark },
  { id: "emergency", label: "Подушка", icon: Shield },
  { id: "shopping", label: "Список покупок", icon: ShoppingCart },
  { id: "recurring", label: "Регулярные", icon: Repeat },
  { id: "settings", label: "Настройки", icon: Settings },
] as const;

type ModuleId = (typeof ALL_MODULES)[number]["id"];

export default function FinancePage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const { isSubVisible } = useSectionVisibility();

  const visibleModules = ALL_MODULES.filter(
    (m) => m.id === "settings" || isSubVisible("finance", m.id),
  );

  const handleSave = useCallback(() => {
    if (!isSubVisible("finance", activeModule)) {
      setActiveModule("settings");
    }
  }, [activeModule, isSubVisible]);

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return (
          <FinanceDashboard
            onNavigateToTransactions={() => setActiveModule("accounts")}
          />
        );
      case "accounts":
        return <FinanceAccounts />;
      case "planning":
        return <FinancePlanning />;
      case "goals":
        return <FinanceGoals />;
      case "loans":
        return <FinanceLoans />;
      case "emergency":
        return <FinanceEmergencyFund />;
      case "shopping":
        return <FinanceShopping />;
      case "recurring":
        return <FinanceRecurring />;
      case "settings":
        return <FinanceSettings onVisibilityChange={handleSave} />;
      default:
        return <FinanceDashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-14 z-40 bg-background border-b border-border/40">
        <div className="flex overflow-x-auto scrollbar-none gap-0 px-2 sm:px-4">
          {visibleModules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                activeModule === mod.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <mod.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{mod.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-2 sm:p-4 max-w-[2000px] mx-auto">{renderModule()}</div>
    </div>
  );
}
