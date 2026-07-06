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
  BarChart3,
  Shield,
  Settings,
} from "lucide-react";
import { FinanceDashboard } from "@/components/finance/finance-dashboard";
import { FinanceAccounts } from "@/components/finance/finance-accounts";
import { FinanceTransactions } from "@/components/finance/finance-transactions";
import { FinancePlanning } from "@/components/finance/finance-planning";
import { FinanceGoals } from "@/components/finance/finance-goals";
import { FinanceLoans } from "@/components/finance/finance-loans";
import { FinanceProjects } from "@/components/finance/finance-projects";
import { FinanceStatistics } from "@/components/finance/finance-statistics";
import { FinanceEmergencyFund } from "@/components/finance/finance-emergency-fund";
import { FinanceSettings } from "@/components/finance/finance-settings";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { id: "accounts", label: "Счета", icon: Wallet },
  { id: "transactions", label: "Транзакции", icon: Receipt },
  { id: "planning", label: "Планирование", icon: Target },
  { id: "goals", label: "Цели", icon: PiggyBank },
  { id: "loans", label: "Кредиты", icon: Landmark },
  { id: "projects", label: "Проекты", icon: Briefcase },
  { id: "statistics", label: "Статистика", icon: BarChart3 },
  { id: "emergency", label: "Подушка", icon: Shield },
  { id: "settings", label: "Настройки", icon: Settings },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

export default function FinancePage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <FinanceDashboard />;
      case "accounts":
        return <FinanceAccounts />;
      case "transactions":
        return <FinanceTransactions />;
      case "planning":
        return <FinancePlanning />;
      case "goals":
        return <FinanceGoals />;
      case "loans":
        return <FinanceLoans />;
      case "projects":
        return <FinanceProjects />;
      case "statistics":
        return <FinanceStatistics />;
      case "emergency":
        return <FinanceEmergencyFund />;
      case "settings":
        return <FinanceSettings />;
      default:
        return <FinanceDashboard />;
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Финансы</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Управляйте своими финансами
        </p>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => setActiveModule(mod.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors shrink-0",
              activeModule === mod.id
                ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <mod.icon className="h-4 w-4" />
            {mod.label}
          </button>
        ))}
      </div>

      {renderModule()}
    </div>
  );
}
