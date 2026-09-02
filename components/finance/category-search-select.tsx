"use client";

import {
  Search,
  Check,
  ChevronsUpDown,
  Plus,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import {
  CATEGORY_GROUPS,
  getCategoryGroup,
} from "@/lib/finance-category-groups";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_GROUPS,
} from "@/lib/finance-category-constants";
import type { TransactionCategory, TransactionType } from "@/lib/finance-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFinanceIcon } from "@/lib/finance-icons";
import { createCategory } from "@/lib/finance-client";
import { useAuthUid } from "@/lib/use-auth-uid";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function CatIcon({ name, className }: { name: string; className?: string }) {
  const Comp: LucideIcon = getFinanceIcon(name);
  return <Comp className={className} />;
}

type Props = {
  categories: TransactionCategory[];
  type: TransactionType;
  value: string;
  onChange: (value: string) => void;
  onCategoryCreated?: (cat: TransactionCategory) => void;
};

export function CategorySearchSelect({
  categories,
  type,
  value,
  onChange,
  onCategoryCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [newIcon, setNewIcon] = useState("MoreHorizontal");
  const [creating, setCreating] = useState(false);

  const { uid } = useAuthUid();

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
      setShowCreate(false);
    },
    [onChange],
  );

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !uid) return;
    setCreating(true);
    try {
      const cat = await createCategory({
        userId: uid,
        name: newName.trim(),
        type,
        color: newColor,
        icon: newIcon,
        showInBudget: true,
      });
      onCategoryCreated?.(cat);
      onChange(cat.id);
      toast.success("Категория создана");
      setShowCreate(false);
      setNewName("");
      setNewColor("blue");
      setNewIcon("MoreHorizontal");
      setOpen(false);
      setSearch("");
    } catch {
      toast.error("Ошибка создания категории");
    } finally {
      setCreating(false);
    }
  }, [newName, uid, type, newColor, newIcon, onCategoryCreated, onChange]);

  const iconGroups = useMemo(
    () =>
      CATEGORY_ICON_GROUPS.filter(
        (g) => g.type === "both" || g.type === type,
      ),
    [type],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-placeholder:text-muted-foreground h-9 dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
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
        {showCreate ? (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Новая категория</span>
              <button
                onClick={() => setShowCreate(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Назад
              </button>
            </div>
            <Input
              placeholder="Название"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) handleCreate();
              }}
            />

            <div className="flex gap-1 flex-wrap">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setNewColor(c.value)}
                  className={cn(
                    "h-5 w-5 rounded-full shrink-0 border-2 transition-all",
                    c.bg,
                    newColor === c.value
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  title={c.label}
                />
              ))}
            </div>

            <div className="max-h-[180px] overflow-y-auto space-y-2">
              {iconGroups.map((grp) => (
                <div key={grp.name}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className={cn("h-1.5 w-1.5 rounded-full", grp.color)}
                    />
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase">
                      {grp.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {grp.items.map((opt) => {
                      const Icon = getFinanceIcon(opt.value);
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setNewIcon(opt.value)}
                          className={cn(
                            "flex items-center justify-center rounded p-1.5 transition-colors",
                            newIcon === opt.value
                              ? "bg-primary/15 text-primary"
                              : "hover:bg-muted text-muted-foreground",
                          )}
                          title={opt.label}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="w-full h-8"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1" />
              )}
              Создать
            </Button>
          </div>
        ) : (
          <>
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
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t"
            >
              <Plus className="h-3.5 w-3.5" />
              Создать категорию
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
