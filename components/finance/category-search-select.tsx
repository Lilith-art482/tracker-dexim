"use client";

import { Search, Check, ChevronsUpDown, type LucideIcon } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import {
  CATEGORY_GROUPS,
  getCategoryGroup,
} from "@/lib/finance-category-groups";
import type { TransactionCategory, TransactionType } from "@/lib/finance-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { getFinanceIcon } from "@/lib/finance-icons";
import { cn } from "@/lib/utils";

function CatIcon({ name, className }: { name: string; className?: string }) {
  const Comp: LucideIcon = getFinanceIcon(name);
  return <Comp className={className} />;
}

type Props = {
  categories: TransactionCategory[];
  type: TransactionType;
  value: string;
  onChange: (value: string) => void;
};

export function CategorySearchSelect({
  categories,
  type,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => categories.find((c) => c.id === value),
    [categories, value],
  );

  const filtered = useMemo(() => {
    const filteredByType = categories.filter(
      (c) => c.type === type && !c.isArchived,
    );
    if (!search.trim()) return filteredByType;
    const q = search.toLowerCase();
    return filteredByType.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, type, search]);

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { group: (typeof CATEGORY_GROUPS)[0]; cats: TransactionCategory[] }
    >();
    for (const cat of filtered) {
      const g = getCategoryGroup(cat.name, cat.type);
      if (!map.has(g.id)) {
        map.set(g.id, { group: g, cats: [] });
      }
      map.get(g.id)!.cats.push(cat);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        CATEGORY_GROUPS.indexOf(a.group) - CATEGORY_GROUPS.indexOf(b.group),
    );
  }, [filtered]);

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
      <PopoverTrigger className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-placeholder:text-muted-foreground h-8 dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <CatIcon name={selected.icon} className="h-3.5 w-3.5 shrink-0" />
              {selected.name}
            </>
          ) : (
            <span className="text-muted-foreground">Выберите категорию</span>
          )}
        </span>
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
            placeholder="Поиск категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm bg-transparent"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {grouped.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              {search ? "Ничего не найдено" : "Нет категорий"}
            </p>
          ) : (
            grouped.map(({ group, cats }) => (
              <div key={group.id}>
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <div
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: group.accent }}
                  />
                  {group.name}
                </div>
                {cats.map((cat) => {
                  const isSelected = cat.id === value;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelect(cat.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted",
                      )}
                    >
                      <div
                        className="h-5 w-5 rounded flex items-center justify-center shrink-0 text-white"
                        style={{ backgroundColor: group.accent }}
                      >
                        <CatIcon name={cat.icon} className="h-3 w-3" />
                      </div>
                      <span className="flex-1 truncate">{cat.name}</span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
