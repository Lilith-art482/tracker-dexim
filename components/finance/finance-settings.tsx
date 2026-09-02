"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CATEGORY_GROUPS,
  getCategoryGroup,
} from "@/lib/finance-category-groups";
import {
  AlertTriangle,
  Archive,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  EyeOff,
  Globe,
  GripVertical,
  Loader2,
  MoreVertical,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { getAssetIcon } from "@/lib/finance-assets";
import { getFinanceIcon } from "@/lib/finance-icons";
import {
  CATEGORY_COLORS,
  CATEGORY_ICON_GROUPS,
} from "@/lib/finance-category-constants";
import type {
  TransactionCategory,
  FinanceAccount,
  Transaction,
} from "@/lib/finance-types";
import { CURRENCIES } from "@/lib/finance-types";
import {
  getCategoriesByUser,
  createCategory,
  deleteCategory,
  getAccountsByUser,
  getTransactionsByUser,
} from "@/lib/finance-client";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthUid } from "@/lib/use-auth-uid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HideModulesDialog } from "@/components/finance/hide-modules-dialog";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLORS = CATEGORY_COLORS;
const ICON_GROUPS = CATEGORY_ICON_GROUPS;
const ICON_OPTIONS = ICON_GROUPS.flatMap((g) => g.items);

const ALLOWED_CURRENCIES = CURRENCIES.filter((c) =>
  [
    "RUB",
    "USD",
    "EUR",
    "USDT",
    "USDC",
    "PUSD",
    "BTC",
    "SOL",
    "GRAM",
    "TON",
    "ETH",
    "BNB",
    "TRX",
  ].includes(c.code),
);

const CURRENCY_ORDER = [
  "RUB",
  "USD",
  "EUR",
  "USDT",
  "USDC",
  "PUSD",
  "BTC",
  "SOL",
  "GRAM",
  "TON",
  "ETH",
  "BNB",
  "TRX",
];

const COUNTRY_FLAGS: Record<string, string> = {
  RUB: "🇷🇺",
  USD: "🇺🇸",
  EUR: "🇪🇺",
};

function CurrencyPickerDialog({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const [search, setSearch] = useState("");
  const sorted = useMemo(() => {
    const orderMap = new Map(CURRENCY_ORDER.map((code, i) => [code, i]));
    return ALLOWED_CURRENCIES.filter(
      (c) =>
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.label.toLowerCase().includes(search.toLowerCase()),
    ).sort((a, b) => {
      const ai = orderMap.get(a.code);
      const bi = orderMap.get(b.code);
      if (ai !== undefined && bi !== undefined) return ai - bi;
      if (ai !== undefined) return -1;
      if (bi !== undefined) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [search]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof sorted }[] = [];
    const fiat = sorted.filter((c) => c.type === "fiat");
    const crypto = sorted.filter((c) => c.type === "crypto");
    if (fiat.length) groups.push({ label: "Фиат", items: fiat });
    if (crypto.length) groups.push({ label: "Криптовалюта", items: crypto });
    return groups;
  }, [sorted]);

  const renderCurrency = (c: (typeof ALLOWED_CURRENCIES)[number]) => {
    const isSelected = value === c.code;
    return (
      <button
        key={c.code}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-muted/50",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-transparent bg-muted/30",
        )}
        onClick={() => {
          onChange(c.code);
          onOpenChange(false);
        }}
      >
        <span className="text-3xl leading-none shrink-0 w-8 text-center">
          {getAssetIcon(c.code) ? (
            <img
              src={getAssetIcon(c.code)}
              alt={c.code}
              width={32}
              height={32}
              className="inline-block rounded"
            />
          ) : (
            COUNTRY_FLAGS[c.code] || "🏳️"
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{c.code}</span>
            {c.type === "fiat" && c.symbol && (
              <span className="text-sm text-muted-foreground">{c.symbol}</span>
            )}
            {isSelected && (
              <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {c.label}
          </p>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Выберите валюту</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск валюты..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[520px] overflow-y-auto pr-1 space-y-4">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Ничего не найдено
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.items.map(renderCurrency)}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const renderIcon = (iconName: string, className = "h-4 w-4") => {
  const Icon = getFinanceIcon(iconName);
  return <Icon className={className} />;
};

function SortableCategoryItem({
  cat,
  colorInfo,
  categoryCounts,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
}: {
  cat: TransactionCategory;
  colorInfo?: { value: string; bg: string; label: string };
  categoryCounts: Record<string, number>;
  onEdit: (cat: TransactionCategory) => void;
  onDelete: (id: string) => void;
  onTogglePin: (cat: TransactionCategory) => void;
  onToggleArchive: (cat: TransactionCategory) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between rounded-lg px-2.5 py-2 hover:bg-muted/40 transition-colors",
        isDragging && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="h-6 w-6 flex items-center justify-center cursor-grab text-muted-foreground hover:text-foreground shrink-0"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div
          className={cn(
            "h-6 w-6 rounded flex items-center justify-center shrink-0 text-white",
            colorInfo?.bg || "bg-gray-500",
          )}
        >
          {renderIcon(cat.icon, "h-3 w-3")}
        </div>
        <span className="text-sm truncate">{cat.name}</span>
        {cat.isPinned && (
          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
        )}
        {cat.type === "income" && (
          <Badge
            variant="default"
            className="text-[9px] px-1 py-0 h-3.5 leading-none bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10"
          >
            доход
          </Badge>
        )}
        {categoryCounts[cat.id] > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-0.5 tabular-nums">
            <BarChart3 className="h-3 w-3" />
            {categoryCounts[cat.id]}
          </span>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors outline-none shrink-0">
          <MoreVertical className="h-3.5 w-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onEdit(cat)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onTogglePin(cat)}>
            <Star
              className={cn(
                "h-3.5 w-3.5 mr-2",
                cat.isPinned && "fill-amber-400 text-amber-400",
              )}
            />
            {cat.isPinned ? "Открепить" : "Закрепить"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onToggleArchive(cat)}>
            <Archive className="h-3.5 w-3.5 mr-2" />
            {cat.isArchived ? "Восстановить" : "В архив"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(cat.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface Props {
  onVisibilityChange?: () => void;
}

export function FinanceSettings({ onVisibilityChange }: Props) {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUserId, setShareUserId] = useState("");
  const [editingCat, setEditingCat] = useState<TransactionCategory | null>(
    null,
  );
  const [currency, setCurrency] = useState("RUB");
  useEffect(() => {
    setCurrency(localStorage.getItem("finance_currency") || "RUB");
  }, []);
  const [name, setName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("MoreHorizontal");
  const [showInBudget, setShowInBudget] = useState(true);
  const { uid } = useAuthUid();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.categoryId)
        counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1;
    }
    return counts;
  }, [transactions]);

  useEffect(() => {
    if (!uid) return;
    Promise.all([
      getCategoriesByUser(uid),
      getAccountsByUser(uid),
      getTransactionsByUser(uid),
    ]).then(([cats, accts, txs]) => {
      setCategories(cats);
      setAccounts(accts);
      setTransactions(txs);
      setLoading(false);
    });
  }, [uid]);

  const saveCurrency = useCallback((val: string) => {
    setCurrency(val);
    localStorage.setItem("finance_currency", val);
    toast.success("Валюта сохранена");
  }, []);

  const handleSaveCategory = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Введите название категории");
      return;
    }
    const body = {
      userId: uid,
      name: name.trim(),
      type: catType,
      color,
      icon,
      showInBudget,
    };
    if (editingCat) {
      try {
        const ref = doc(db, "FINANCE_CATEGORIES", editingCat.id);
        await updateDoc(ref, {
          ...body,
          updatedAt: new Date().toISOString(),
        });
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCat.id ? { ...c, ...body } : c)),
        );
        toast.success("Категория обновлена");
      } catch {
        toast.error("Ошибка при обновлении");
      }
    } else {
      try {
        const created = await createCategory(body);
        setCategories((prev) => [...prev, created]);
        toast.success("Категория создана");
      } catch {
        toast.error("Ошибка при создании");
      }
    }
    setShowDialog(false);
    setEditingCat(null);
    setName("");
    setCatType("expense");
    setColor("blue");
    setIcon("MoreHorizontal");
    setShowInBudget(true);
  }, [name, catType, color, icon, editingCat, uid, showInBudget]);

  const handleTogglePin = useCallback(async (cat: TransactionCategory) => {
    const next = !cat.isPinned;
    try {
      const ref = doc(db, "FINANCE_CATEGORIES", cat.id);
      await updateDoc(ref, {
        isPinned: next,
        updatedAt: new Date().toISOString(),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isPinned: next } : c)),
      );
      toast.success(next ? "Категория закреплена" : "Категория откреплена");
    } catch {
      toast.error("Ошибка при обновлении");
    }
  }, []);

  const handleToggleArchive = useCallback(async (cat: TransactionCategory) => {
    const next = !cat.isArchived;
    try {
      const ref = doc(db, "FINANCE_CATEGORIES", cat.id);
      await updateDoc(ref, {
        isArchived: next,
        updatedAt: new Date().toISOString(),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, isArchived: next } : c)),
      );
      toast.success(
        next ? "Категория архивирована" : "Категория восстановлена",
      );
    } catch {
      toast.error("Ошибка при обновлении");
    }
  }, []);

  const handleBudgetChange = useCallback(
    async (catId: string, value: number) => {
      const budget = isNaN(value) ? 0 : Math.max(0, value);
      try {
        const ref = doc(db, "FINANCE_CATEGORIES", catId);
        await updateDoc(ref, {
          monthlyBudget: budget,
          updatedAt: new Date().toISOString(),
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === catId ? { ...c, monthlyBudget: budget } : c,
          ),
        );
      } catch {
        toast.error("Ошибка при обновлении бюджета");
      }
    },
    [],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const findGroupId = (catId: string) => {
        const cat = categories.find((c) => c.id === catId);
        if (!cat) return null;
        return getCategoryGroup(cat.name, cat.type).id;
      };

      const groupId = findGroupId(active.id as string);
      if (!groupId) return;

      const groupCats = categories
        .filter((c) => {
          const g = getCategoryGroup(c.name, c.type);
          return g.id === groupId && !c.isArchived;
        })
        .sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

      const oldIndex = groupCats.findIndex((c) => c.id === active.id);
      const newIndex = groupCats.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(groupCats, oldIndex, newIndex);

      reordered.forEach((cat, idx) => {
        const ref = doc(db, "FINANCE_CATEGORIES", cat.id);
        updateDoc(ref, {
          sortOrder: idx,
          updatedAt: new Date().toISOString(),
        });
      });

      setCategories((prev) =>
        prev.map((c) => {
          const updated = reordered.find((u) => u.id === c.id);
          return updated ? { ...c, sortOrder: reordered.indexOf(updated) } : c;
        }),
      );
    },
    [categories],
  );

  const toggleGroupCollapse = useCallback((groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const handleDeleteCategory = useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Категория удалена");
    } catch {
      toast.error("Ошибка при удалении");
    }
  }, []);

  const handleDeleteAllCategories = useCallback(async () => {
    toast("Удалить все категории?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          const loading = toast.loading("Удаляем категории...");
          try {
            await Promise.all(categories.map((c) => deleteCategory(c.id)));
            setCategories([]);
            toast.success("Все категории удалены", { id: loading });
          } catch {
            toast.error("Ошибка при удалении", { id: loading });
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  }, [categories]);

  const openEdit = useCallback((cat: TransactionCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setCatType(cat.type as "income" | "expense");
    setColor(cat.color);
    setIcon(cat.icon);
    setShowInBudget(cat.showInBudget ?? true);
    setShowDialog(true);
  }, []);

  const openAdd = useCallback(() => {
    setEditingCat(null);
    setName("");
    setCatType("expense");
    setColor("blue");
    setIcon("MoreHorizontal");
    setShowInBudget(true);
    setShowDialog(true);
  }, []);

  const exportAll = useCallback(() => {
    const data = JSON.stringify({ categories, accounts, currency }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспорт завершён");
  }, [categories, accounts, currency]);

  const importAll = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.categories) setCategories(data.categories);
        if (data.currency) saveCurrency(data.currency);
        toast.success("Данные импортированы");
      } catch {
        toast.error("Ошибка при импорте");
      }
    };
    input.click();
  }, [saveCurrency]);

  const resetAll = useCallback(() => {
    toast("Сбросить все данные?", {
      action: {
        label: "Сбросить",
        onClick: () => {
          localStorage.removeItem("finance_currency");
          setCategories([]);
          setCurrency("RUB");
          toast.success("Данные сброшены");
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Основные настройки */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Основные настройки</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Валюта по умолчанию
                </p>
              </div>
            </div>
            <button
              className="flex items-center gap-2.5 rounded-xl border border-input bg-background px-3.5 py-2 text-left transition-all hover:bg-muted/50 hover:border-muted-foreground/30 shrink-0"
              onClick={() => setShowCurrencyDialog(true)}
            >
              <span className="text-lg leading-none w-6 text-center">
                {getAssetIcon(currency) ? (
                  <img
                    src={getAssetIcon(currency)}
                    alt={currency}
                    width={24}
                    height={24}
                    className="inline-block rounded"
                  />
                ) : (
                  COUNTRY_FLAGS[currency] || "🏳️"
                )}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs">{currency}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {
                      ALLOWED_CURRENCIES.find((c) => c.code === currency)
                        ?.symbol
                    }
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">
                  {ALLOWED_CURRENCIES.find((c) => c.code === currency)?.label}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Категории */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Категории
          </CardTitle>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Добавить
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет категорий. Создайте первую.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-5">
                {CATEGORY_GROUPS.map((group) => {
                  const groupCats = categories
                    .filter((c) => {
                      const g = getCategoryGroup(c.name, c.type);
                      return g.id === group.id && !c.isArchived;
                    })
                    .sort((a, b) => {
                      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                      return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
                    });
                  if (groupCats.length === 0) return null;
                  const isCollapsed = collapsedGroups.has(group.id);
                  return (
                    <div key={group.id}>
                      <button
                        onClick={() => toggleGroupCollapse(group.id)}
                        className="flex items-center gap-2 mb-2 pb-1.5 border-b w-full text-left"
                        style={{ borderColor: group.accent + "40" }}
                      >
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                            !isCollapsed && "rotate-90",
                          )}
                        />
                        <div
                          className="h-6 w-6 rounded-md flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: group.accent }}
                        >
                          {renderIcon(group.icon, "h-3.5 w-3.5")}
                        </div>
                        <span className="text-sm font-semibold">
                          {group.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                          {groupCats.length}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <SortableContext
                          items={groupCats.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-0.5">
                            {groupCats.map((cat) => {
                              const colorInfo = COLORS.find(
                                (c) => c.value === cat.color,
                              );
                              return (
                                <SortableCategoryItem
                                  key={cat.id}
                                  cat={cat}
                                  colorInfo={colorInfo}
                                  categoryCounts={categoryCounts}
                                  onEdit={openEdit}
                                  onDelete={handleDeleteCategory}
                                  onTogglePin={handleTogglePin}
                                  onToggleArchive={handleToggleArchive}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      )}
                    </div>
                  );
                })}

                {/* Archive section */}
                {categories.some((c) => c.isArchived) && (
                  <div>
                    <button
                      onClick={() => toggleGroupCollapse("__archive")}
                      className="flex items-center gap-2 mb-2 pb-1.5 border-b w-full text-left"
                      style={{ borderColor: "#a1a1aa40" }}
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                          !collapsedGroups.has("__archive") && "rotate-90",
                        )}
                      />
                      <div className="h-6 w-6 rounded-md flex items-center justify-center text-white shrink-0 bg-muted-foreground/50">
                        <Archive className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm font-semibold">Архив</span>
                      <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                        {categories.filter((c) => c.isArchived).length}
                      </span>
                    </button>
                    {!collapsedGroups.has("__archive") && (
                      <div className="space-y-0.5">
                        {categories
                          .filter((c) => c.isArchived)
                          .map((cat) => {
                            const colorInfo = COLORS.find(
                              (c) => c.value === cat.color,
                            );
                            return (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between rounded-lg px-2.5 py-1.5 hover:bg-muted/40 transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div
                                    className={cn(
                                      "h-6 w-6 rounded flex items-center justify-center shrink-0 text-white opacity-60",
                                      colorInfo?.bg || "bg-gray-500",
                                    )}
                                  >
                                    {renderIcon(cat.icon, "h-3 w-3")}
                                  </div>
                                  <span className="text-sm truncate text-muted-foreground">
                                    {cat.name}
                                  </span>
                                  {categoryCounts[cat.id] > 0 && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-0.5 tabular-nums">
                                      <BarChart3 className="h-3 w-3" />
                                      {categoryCounts[cat.id]}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleToggleArchive(cat)}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => handleDeleteCategory(cat.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {categories.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleDeleteAllCategories}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Удалить все категории
                  </Button>
                )}
              </div>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Скрыть пункты */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <EyeOff className="h-4 w-4" />
            Скрыть пункты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Отключите ненужные разделы, чтобы они не отображались в навигации.
            Настройки всегда видны.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHideDialog(true)}
          >
            <EyeOff className="h-3.5 w-3.5 mr-1.5" />
            Настроить видимость
          </Button>
        </CardContent>
      </Card>

      {/* Быстрые действия по данным */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Быстрые действия по данным
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 text-left transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
              onClick={exportAll}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
                <Download className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Экспорт</p>
                <p className="text-[11px] text-muted-foreground">
                  Скачать все данные JSON
                </p>
              </div>
            </button>
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4 text-left transition-all hover:bg-blue-500/10 hover:border-blue-500/40"
              onClick={importAll}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Импорт</p>
                <p className="text-[11px] text-muted-foreground">
                  Загрузить данные из JSON
                </p>
              </div>
            </button>
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-rose-500/20 bg-rose-500/5 p-4 text-left transition-all hover:bg-rose-500/10 hover:border-rose-500/40 sm:col-span-1 col-span-full"
              onClick={resetAll}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Сброс</p>
                <p className="text-[11px] text-muted-foreground">
                  Очистить все настройки
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Диалог выбора валюты */}
      <CurrencyPickerDialog
        open={showCurrencyDialog}
        onOpenChange={setShowCurrencyDialog}
        value={currency}
        onChange={saveCurrency}
      />

      {/* Диалог скрытия пунктов */}
      <HideModulesDialog
        open={showHideDialog}
        onOpenChange={setShowHideDialog}
        onSave={() => onVisibilityChange?.()}
      />

      {/* Диалог категории */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Редактировать категорию" : "Новая категория"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Название
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Продукты"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Тип</label>
                <div className="flex rounded-lg bg-muted p-0.5">
                  <button
                    onClick={() => setCatType("expense")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      catType === "expense"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Расход
                  </button>
                  <button
                    onClick={() => setCatType("income")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      catType === "income"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Доход
                  </button>
                </div>
              </div>
            </div>
            {editingCat && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Месячный бюджет
                </label>
                <Input
                  type="number"
                  value={editingCat.monthlyBudget ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCategories((prev) =>
                      prev.map((c) =>
                        c.id === editingCat.id
                          ? { ...c, monthlyBudget: v ? Number(v) : undefined }
                          : c,
                      ),
                    );
                    handleBudgetChange(editingCat.id, v ? Number(v) : 0);
                  }}
                  placeholder="0"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Цвет</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      c.bg,
                      color === c.value
                        ? "ring-2 ring-offset-2 ring-foreground scale-110"
                        : "ring-1 ring-offset-1 ring-transparent hover:scale-105",
                    )}
                    onClick={() => setColor(c.value)}
                  />
                ))}
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                showInBudget
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-border hover:border-muted-foreground/30 bg-background",
              )}
              onClick={() => setShowInBudget(!showInBudget)}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                  showInBudget
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Target className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    showInBudget ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  В планировании бюджета
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {showInBudget
                    ? "Категория видна в плане расходов"
                    : "Не учитывается в бюджете"}
                </p>
              </div>
              <div
                className={cn(
                  "h-5 w-9 rounded-full flex items-center px-0.5 transition-all duration-200 shrink-0",
                  showInBudget
                    ? "bg-primary justify-end"
                    : "bg-muted justify-start",
                )}
              >
                <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Иконка</label>
              <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                {ICON_GROUPS.filter(
                  (grp) => grp.type === "both" || grp.type === catType,
                ).map((grp) => (
                  <div key={grp.name}>
                    <div className="flex items-center gap-2 mb-1.5 px-0.5">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          grp.color,
                        )}
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {grp.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                      {grp.items.map((opt) => {
                        const Icon = getFinanceIcon(opt.value);
                        return (
                          <button
                            key={opt.value}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                              icon === opt.value
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-input hover:bg-muted hover:border-muted-foreground/30",
                            )}
                            onClick={() => setIcon(opt.value)}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5",
                                icon === opt.value
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            />
                            <span
                              className={cn(
                                "text-[8px] text-center leading-tight",
                                icon === opt.value
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground",
                              )}
                            >
                            {opt.label}
                          </span>
                        </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCat ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
