"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { CURRENCIES } from "@/lib/finance-types";
import { getAssetIcon } from "@/lib/finance-assets";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function CurrencySelect({
  value,
  onChange,
  fiatOnly,
  cryptoOnly,
  triggerClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  fiatOnly?: boolean;
  cryptoOnly?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      CURRENCIES.filter((c) => {
        if (fiatOnly && c.type !== "fiat") return false;
        if (cryptoOnly && c.type !== "crypto") return false;
        return (
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.label.toLowerCase().includes(search.toLowerCase())
        );
      }),
    [search, fiatOnly, cryptoOnly],
  );

  const selected = CURRENCIES.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-8 data-placeholder:text-muted-foreground dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          triggerClassName,
        )}
      >
        {selected ? (
          <span className="flex items-center gap-1.5">
            {getAssetIcon(selected.code) ? (
              <span className="flex h-5 w-5 items-center justify-center rounded border bg-background shrink-0 overflow-hidden">
                <img
                  src={getAssetIcon(selected.code)}
                  alt={selected.code}
                  width={18}
                  height={18}
                  className="object-contain"
                />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded border bg-background text-[10px] font-medium shrink-0">
                {selected.symbol}
              </span>
            )}
            <span className="font-medium text-xs">{selected.code}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Выберите валюту</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск валюты..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Ничего не найдено
          </p>
        ) : (
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
            {filtered
              .reduce<
                {
                  type: string;
                  label: string;
                  items: (typeof CURRENCIES)[number][];
                }[]
              >((groups, c) => {
                const last = groups[groups.length - 1];
                if (last && last.type === c.type) {
                  last.items.push(c);
                } else {
                  groups.push({
                    type: c.type,
                    label: c.type === "fiat" ? "Фиат" : "Криптовалюта",
                    items: [c],
                  });
                }
                return groups;
              }, [])
              .map((group) => (
                <div key={group.type}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {group.label}
                  </p>
                  {group.items.map((c) => (
                    <button
                      key={c.code}
                      className={cn(
                        "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors",
                        value === c.code
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground",
                      )}
                      onClick={() => {
                        onChange(c.code);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      {getAssetIcon(c.code) ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded overflow-hidden shrink-0">
                          <img
                            src={getAssetIcon(c.code)}
                            alt={c.code}
                            width={20}
                            height={20}
                            className="object-contain"
                          />
                        </span>
                      ) : (
                        <span className="text-base w-5 text-center">
                          {c.symbol}
                        </span>
                      )}
                      <span className="font-medium">{c.code}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {c.label}
                      </span>
                      {value === c.code && (
                        <Check className="h-3.5 w-3.5 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
