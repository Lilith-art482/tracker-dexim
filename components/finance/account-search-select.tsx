"use client";

import { Search, Check, ChevronsUpDown } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import type { FinanceAccount } from "@/lib/finance-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCachedRates, convert } from "@/lib/exchange-rates";
import {
  Coins,
  CreditCard,
  Bitcoin,
  TrendingUp,
  PiggyBank,
} from "lucide-react";

const ACCOUNT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  cash: {
    label: "Наличные",
    icon: Coins,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  card: {
    label: "Карта",
    icon: CreditCard,
    color: "text-blue-600 bg-blue-500/10",
  },
  crypto: {
    label: "Криптовалюта",
    icon: Bitcoin,
    color: "text-orange-600 bg-orange-500/10",
  },
  investment: {
    label: "Инвестиции",
    icon: TrendingUp,
    color: "text-purple-600 bg-purple-500/10",
  },
  savings: {
    label: "Сбережения",
    icon: PiggyBank,
    color: "text-sky-600 bg-sky-500/10",
  },
};

function accountBalance(acc: FinanceAccount): number {
  if (acc.type === "crypto" && acc.cryptoCoin && acc.cryptoAmount != null) {
    const rates = getCachedRates();
    if (rates)
      return convert(acc.cryptoAmount, acc.cryptoCoin, acc.currency, rates);
  }
  return acc.balance;
}

type Props = {
  accounts: FinanceAccount[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AccountSearchSelect({
  accounts,
  value,
  onChange,
  placeholder = "Выберите счёт",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => accounts.find((a) => a.id === value),
    [accounts, value],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.currency.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const handleSelect = useCallback(
    (id: string) => {
      onChange(id);
      setOpen(false);
      setSearch("");
    },
    [onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-placeholder:text-muted-foreground h-9 dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            {(() => {
              const cfg =
                ACCOUNT_TYPE_CONFIG[selected.type] || ACCOUNT_TYPE_CONFIG.cash;
              const Icon = cfg.icon;
              return (
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded",
                    cfg.color,
                  )}
                >
                  <Icon className="h-3 w-3" />
                </div>
              );
            })()}
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-1" />
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--anchor-width]"
        align="start"
        sideOffset={4}
      >
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Поиск счёта..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm bg-transparent"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {search ? "Ничего не найдено" : "Нет счетов"}
            </p>
          ) : (
            filtered.map((a) => {
              const cfg =
                ACCOUNT_TYPE_CONFIG[a.type] || ACCOUNT_TYPE_CONFIG.cash;
              const Icon = cfg.icon;
              const isSelected = a.id === value;
              const bal = accountBalance(a);
              return (
                <button
                  key={a.id}
                  onClick={() => handleSelect(a.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all",
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      cfg.color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium truncate leading-tight block">
                      {a.name}
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                      {cfg.label} · {a.currency}
                    </p>
                    <p className="text-xs font-medium text-foreground/80 leading-tight mt-0.5 tabular-nums">
                      {bal.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      {a.currency}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
