"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Loader2,
  DollarSign,
  X,
  Archive,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  CircleCheck,
  Info,
  XCircle,
  Receipt,
  Wallet,
  CreditCard,
  Coins,
  Bitcoin,
  TrendingUp,
  PiggyBank,
  Flag,
} from "lucide-react";
import type {
  ShoppingList,
  ShoppingItem,
  FinanceAccount,
  TransactionCategory,
} from "@/lib/finance-types";
import {
  getShoppingListsByUser,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  getAccountsByUser,
  getCategoriesByUser,
  createTransaction,
} from "@/lib/finance-client";
import {
  getCurrencySymbol,
  convert,
  getCachedRates,
  getDisplayCurrency,
} from "@/lib/exchange-rates";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getFinanceIcon } from "@/lib/finance-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

function genId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const UNITS = ["шт", "кг", "г", "л", "мл", "уп", "пачка", "банка", "бутылка"];

type AccountType = FinanceAccount["type"];

const TYPE_CONFIG: Record<
  AccountType,
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

const CATEGORY_COLORS_HEX: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  pink: "#ec4899",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  indigo: "#6366f1",
  cyan: "#06b6d4",
  lime: "#84cc16",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  fuchsia: "#d946ef",
  slate: "#6b7280",
};

export function FinanceShopping() {
  const uid = auth.currentUser?.uid || "";
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("шт");
  const [saving, setSaving] = useState(false);

  // Per-item amount editor
  const [editingAmount, setEditingAmount] = useState<{
    listId: string;
    itemId: string;
  } | null>(null);
  const [editAmountValue, setEditAmountValue] = useState("");

  // Bulk purchase
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkListId, setBulkListId] = useState("");
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkAccountId, setBulkAccountId] = useState("");
  const [bulkCurrency, setBulkCurrency] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");

  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("shopping_hint_closed") !== "true";
    }
    return true;
  });

  const closeHint = () => {
    setShowHint(false);
    localStorage.setItem("shopping_hint_closed", "true");
  };

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" && !c.isArchived,
  );

  const fetchData = useCallback(async () => {
    if (!uid) return;
    setInitialLoading(true);
    try {
      const [shoppingLists, accs, cats] = await Promise.all([
        getShoppingListsByUser(uid),
        getAccountsByUser(uid),
        getCategoriesByUser(uid),
      ]);
      setLists(shoppingLists);
      setAccounts(accs);
      setCategories(cats);
    } catch (e) {
      console.error("Failed to load shopping lists:", e);
    } finally {
      setInitialLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateList = async () => {
    if (!newListName.trim() || saving) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const list = await createShoppingList({
        id: genId(),
        userId: uid,
        name: newListName.trim(),
        date: now.split("T")[0],
        items: [],
        completed: false,
        archived: false,
      });
      setLists((prev) => [list, ...prev]);
      setNewListName("");
      setExpandedId(list.id);
      toast.success("Список создан");
    } catch {
      toast.error("Ошибка создания списка");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (listId: string) => {
    if (!newItemName.trim()) return;
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const newItem: ShoppingItem = {
      id: genId(),
      name: newItemName.trim(),
      quantity: parseFloat(newItemQty) || 1,
      unit: newItemUnit,
      checked: false,
    };

    const updatedItems = [...list.items, newItem];
    try {
      const updated = await updateShoppingList(listId, { items: updatedItems });
      setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
      setNewItemName("");
      setNewItemQty("1");
      setNewItemUnit("шт");
    } catch {
      toast.error("Ошибка добавления товара");
    }
  };

  // Simple check toggle — auto-opens bulk modal when all items checked
  const handleQuickCheck = async (listId: string, itemId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item,
    );
    try {
      const updated = await updateShoppingList(listId, { items: updatedItems });
      setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));

      const allCheckedNow =
        updatedItems.length > 0 && updatedItems.every((i) => i.checked);
      if (allCheckedNow) {
        openBulkPurchase(listId);
      }
    } catch {
      toast.error("Ошибка");
    }
  };

  // Per-item amount editor
  const openAmountEditor = (
    listId: string,
    itemId: string,
    current?: number,
  ) => {
    setEditingAmount({ listId, itemId });
    setEditAmountValue(current ? String(current) : "");
  };

  const saveItemAmount = async () => {
    if (!editingAmount) return;
    const { listId, itemId } = editingAmount;
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const amount = parseFloat(editAmountValue);
    const updatedItems = list.items.map((item) =>
      item.id === itemId
        ? { ...item, amount: amount > 0 ? amount : undefined }
        : item,
    );
    try {
      const updated = await updateShoppingList(listId, { items: updatedItems });
      setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
    } catch {
      toast.error("Ошибка");
    }
    setEditingAmount(null);
    setEditAmountValue("");
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    const updatedItems = list.items.filter((item) => item.id !== itemId);
    try {
      const updated = await updateShoppingList(listId, { items: updatedItems });
      setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
    } catch {
      toast.error("Ошибка удаления товара");
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteShoppingList(listId);
      setLists((prev) => prev.filter((l) => l.id !== listId));
      setDeleteConfirmId(null);
      toast.success("Список удалён");
    } catch {
      toast.error("Ошибка удаления списка");
    }
  };

  const handleToggleComplete = async (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    try {
      const updated = await updateShoppingList(listId, {
        completed: !list.completed,
      });
      setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleToggleArchive = async (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    try {
      const updated = await updateShoppingList(listId, {
        archived: !list.archived,
      });
      setLists((prev) => prev.map((l) => (l.id === listId ? updated : l)));
    } catch {
      toast.error("Ошибка");
    }
  };

  // Bulk purchase
  const openBulkPurchase = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    setBulkListId(listId);
    setBulkAccountId("");
    setBulkCurrency(getDisplayCurrency());
    setBulkCategoryId("");

    if (list) {
      const itemsWithAmount = list.items.filter(
        (i) => i.amount != null && i.amount > 0,
      );
      if (itemsWithAmount.length > 0) {
        const total = itemsWithAmount.reduce((s, i) => s + i.amount!, 0);
        setBulkAmount(String(Math.round(total * 100) / 100));
      } else {
        setBulkAmount("");
      }
    } else {
      setBulkAmount("");
    }

    setBulkOpen(true);
  };

  const handleBulkPurchase = async () => {
    if (!bulkListId || !bulkAmount.trim() || !bulkAccountId || saving) return;
    const list = lists.find((l) => l.id === bulkListId);
    if (!list) return;

    const amount = parseFloat(bulkAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSaving(true);
    const cur = bulkCurrency || getDisplayCurrency();

    try {
      const tx = await createTransaction({
        id: genId(),
        userId: uid,
        accountId: bulkAccountId,
        type: "expense",
        categoryId: bulkCategoryId || expenseCategories[0]?.id || "",
        amount,
        currency: cur,
        description: `Покупки: ${list.name}`,
        tags: ["shopping", list.name],
        date: new Date().toISOString(),
      });

      // Mark all unchecked items as checked and attach transactionId
      const updatedItems = list.items.map((item) =>
        !item.checked ? { ...item, checked: true, transactionId: tx.id } : item,
      );

      const updated = await updateShoppingList(bulkListId, {
        items: updatedItems,
        completed: true,
      });
      setLists((prev) => prev.map((l) => (l.id === bulkListId ? updated : l)));

      toast.success(
        `Транзакция на ${amount} ${getCurrencySymbol(cur)} создана`,
      );
      setBulkOpen(false);
      setBulkListId("");
      setBulkAmount("");
      setBulkAccountId("");
    } catch {
      toast.error("Ошибка создания транзакции");
    } finally {
      setSaving(false);
    }
  };

  const activeLists = lists.filter((l) => !l.archived && !l.completed);
  const completedLists = lists.filter((l) => l.completed && !l.archived);
  const archivedLists = lists.filter((l) => l.archived);

  const totalSpent = lists.reduce(
    (sum, l) => sum + l.items.reduce((s, i) => s + (i.amount || 0), 0),
    0,
  );
  const totalItems = lists.reduce((sum, l) => sum + l.items.length, 0);
  const checkedItems = lists.reduce(
    (sum, l) => sum + l.items.filter((i) => i.checked).length,
    0,
  );

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground/60">Загрузка списков...</p>
      </div>
    );
  }

  const renderList = (list: ShoppingList) => {
    const expanded = expandedId === list.id;
    const checkedCount = list.items.filter((i) => i.checked).length;
    const totalItemsCount = list.items.length;
    const progress =
      totalItemsCount > 0 ? (checkedCount / totalItemsCount) * 100 : 0;
    const listTotal = list.items.reduce((s, i) => s + (i.amount || 0), 0);
    const uncheckedCount = totalItemsCount - checkedCount;

    return (
      <div
        key={list.id}
        className={cn(
          "group relative rounded-2xl border transition-all duration-300",
          list.completed
            ? "border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10"
            : "border-border/40 bg-card hover:border-border/70 hover:shadow-sm",
        )}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-4 cursor-pointer"
          onClick={() => setExpandedId(expanded ? null : list.id)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (list.completed) {
                handleToggleComplete(list.id);
              } else {
                openBulkPurchase(list.id);
              }
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-xl border-2 transition-all shrink-0",
              list.completed
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5",
            )}
          >
            {list.completed && <Check className="h-3.5 w-3.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "text-sm font-semibold truncate",
                  list.completed && "text-emerald-600 dark:text-emerald-400",
                )}
              >
                {list.name}
              </h3>
              {list.completed && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0"
                >
                  Готово
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] text-muted-foreground/50">
                {new Date(list.date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              {totalItemsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-16 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                    {checkedCount}/{totalItemsCount}
                  </span>
                </div>
              )}
              {listTotal > 0 && (
                <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums">
                  {listTotal.toLocaleString()} ₽
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleArchive(list.id);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
              title={list.archived ? "Разархивировать" : "Архивировать"}
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(list.id);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
              title="Удалить список"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <div className="ml-1">
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground/30" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
            {/* Items */}
            {list.items.length > 0 && (
              <div className="space-y-0.5">
                {list.items.map((item) => {
                  const itemHasAmount = item.amount != null && item.amount > 0;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group/item flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                        item.checked ? "bg-muted/20" : "hover:bg-muted/30",
                      )}
                    >
                      {/* Check button — simple toggle */}
                      <button
                        onClick={() => handleQuickCheck(list.id, item.id)}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-lg border-2 shrink-0 transition-all",
                          item.checked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5",
                        )}
                      >
                        {item.checked && <Check className="h-2.5 w-2.5" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          className={cn(
                            "text-sm",
                            item.checked &&
                              "line-through text-muted-foreground/40",
                          )}
                        >
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                          {item.quantity} {item.unit}
                        </span>

                        {/* Optional per-item amount badge */}
                        {itemHasAmount && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 h-5 tabular-nums font-medium bg-primary/10 text-primary border-0 cursor-pointer hover:bg-primary/20"
                            onClick={() =>
                              openAmountEditor(list.id, item.id, item.amount)
                            }
                          >
                            {item.amount!.toLocaleString()} ₽
                          </Badge>
                        )}

                        {/* Add/set amount button */}
                        {!item.checked && !itemHasAmount && (
                          <button
                            onClick={() => openAmountEditor(list.id, item.id)}
                            className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground/0 group-hover/item:text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                            title="Указать сумму"
                          >
                            <DollarSign className="h-3 w-3" />
                          </button>
                        )}

                        {/* Delete button */}
                        {!item.checked && (
                          <button
                            onClick={() => handleDeleteItem(list.id, item.id)}
                            className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground/0 group-hover/item:text-muted-foreground/40 hover:text-rose-500 transition-all shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bulk purchase button */}
            {uncheckedCount > 0 && (
              <div className="pt-1">
                <Button
                  onClick={() => openBulkPurchase(list.id)}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-sm shadow-emerald-500/20"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Оформить покупку
                  {uncheckedCount > 0 && (
                    <span className="ml-1.5 text-emerald-200/80">
                      · {uncheckedCount}{" "}
                      {uncheckedCount === 1
                        ? "товар"
                        : uncheckedCount < 5
                          ? "товара"
                          : "товаров"}
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Add item input — always visible */}
            <div className="flex items-center gap-2 pt-1">
              <Input
                value={addingToList === list.id ? newItemName : ""}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Товар..."
                className="flex-1 h-9 text-sm rounded-xl"
                onFocus={() => setAddingToList(list.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && addingToList === list.id) {
                    handleAddItem(list.id);
                  }
                }}
              />
              <Input
                value={addingToList === list.id ? newItemQty : "1"}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="1"
                className="w-14 h-9 text-sm text-center rounded-xl"
                onFocus={() => setAddingToList(list.id)}
              />
              <Select
                value={newItemUnit}
                onValueChange={(v) => v && setNewItemUnit(v)}
              >
                <SelectTrigger className="w-20 h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u} className="text-xs">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-9 w-9 p-0 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
                onClick={() => handleAddItem(list.id)}
                disabled={!newItemName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Списки покупок</h2>
            {lists.length > 0 && (
              <p className="text-[11px] text-muted-foreground/50">
                {lists.length} списков · {checkedItems}/{totalItems} товаров
                {totalSpent > 0 && <> · {totalSpent.toLocaleString()} ₽</>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Hint */}
      {showHint && (
        <div className="relative rounded-xl bg-gradient-to-r from-primary/5 to-primary/[0.02] border border-primary/10 px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <button
            onClick={closeHint}
            className="absolute top-2 right-2 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <Info className="h-3 w-3 text-primary" />
            </div>
            <div className="text-[11px] text-muted-foreground/70 leading-relaxed space-y-1 pr-4">
              <p>
                <span className="font-medium text-foreground/80">Галочка</span>{" "}
                — просто отмечает товар как купленный.
              </p>
              <p>
                <span className="font-medium text-foreground/80">Иконка $</span>{" "}
                — указать стоимость отдельного товара (необязательно).
              </p>
              <p>
                <span className="font-medium text-foreground/80">
                  «Оформить покупку»
                </span>{" "}
                — внести итоговую сумму чека и создать одну транзакцию на весь
                список.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New list input */}
      <div className="relative">
        <ShoppingCart className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
        <Input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="Новый список покупок..."
          className="pl-10 h-11 rounded-xl bg-muted/30 border-border/40"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateList();
          }}
        />
      </div>

      {/* Lists */}
      {activeLists.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider px-1 flex items-center gap-2">
            <CircleCheck className="h-3 w-3" />
            Активные
            <span className="text-muted-foreground/30">
              · {activeLists.length}
            </span>
          </h3>
          {activeLists.map(renderList)}
        </div>
      )}

      {completedLists.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider px-1 flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Завершённые
            <span className="text-muted-foreground/30">
              · {completedLists.length}
            </span>
          </h3>
          {completedLists.map(renderList)}
        </div>
      )}

      {archivedLists.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider px-1 flex items-center gap-2">
            <Archive className="h-3 w-3" />
            Архив
            <span className="text-muted-foreground/30">
              · {archivedLists.length}
            </span>
          </h3>
          {archivedLists.map(renderList)}
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-xl" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/30">
              <ShoppingCart className="h-7 w-7 text-muted-foreground/30" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Списков покупок пока нет
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1.5 max-w-[240px]">
            Создайте список продуктов или вещей — отмечайте купленные товары и
            создавайте транзакции
          </p>
        </div>
      )}

      {/* Per-item amount editor dialog */}
      <Dialog
        open={!!editingAmount}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAmount(null);
            setEditAmountValue("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              Сумма товара
            </DialogTitle>
            <DialogDescription>
              Укажите стоимость товара (необязательно).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="relative">
              <Input
                value={editAmountValue}
                onChange={(e) => setEditAmountValue(e.target.value)}
                placeholder="0"
                type="number"
                className="h-11 rounded-xl text-lg font-bold tabular-nums"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveItemAmount();
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/50">
                {getDisplayCurrency()}
              </span>
            </div>
            <DialogFooter className="gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  setEditingAmount(null);
                  setEditAmountValue("");
                }}
              >
                Отмена
              </Button>
              <Button className="rounded-xl" onClick={saveItemAmount}>
                <Check className="h-4 w-4 mr-1" />
                Сохранить
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk purchase dialog */}
      <Dialog
        open={bulkOpen}
        onOpenChange={(open) => {
          if (!open) setBulkOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
                <Receipt className="h-4 w-4 text-emerald-600" />
              </div>
              Оформить покупку
            </DialogTitle>
            <DialogDescription>
              Внесите итоговую сумму чека — создастся одна транзакция на весь
              список.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Summary */}
            {bulkListId &&
              (() => {
                const list = lists.find((l) => l.id === bulkListId);
                if (!list) return null;
                const itemsWithAmount = list.items.filter(
                  (i) => i.amount != null && i.amount > 0,
                );
                const itemsWithoutAmount = list.items.filter(
                  (i) => i.amount == null || i.amount <= 0,
                );
                const totalFromItems = itemsWithAmount.reduce(
                  (s, i) => s + i.amount!,
                  0,
                );
                const allHaveAmount =
                  itemsWithoutAmount.length === 0 && itemsWithAmount.length > 0;
                const someHaveAmount =
                  itemsWithAmount.length > 0 && itemsWithoutAmount.length > 0;

                return (
                  <div className="rounded-xl bg-muted/30 border border-border/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground/70">
                      {list.name}
                    </p>

                    {/* Items with amounts */}
                    {itemsWithAmount.length > 0 && (
                      <div className="space-y-1">
                        {itemsWithAmount.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-[11px]"
                          >
                            <span className="text-muted-foreground/60 truncate">
                              {item.name}
                            </span>
                            <span className="font-medium text-muted-foreground/80 tabular-nums ml-2">
                              {item.amount!.toLocaleString()} ₽
                            </span>
                          </div>
                        ))}
                        {allHaveAmount && (
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/30">
                            <span className="font-medium text-foreground/70">
                              Итого по товарам
                            </span>
                            <span className="font-bold text-foreground tabular-nums">
                              {totalFromItems.toLocaleString()} ₽
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hint for partial amounts */}
                    {someHaveAmount && (
                      <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                        У {itemsWithAmount.length} товаров указана сумма (
                        {totalFromItems.toLocaleString()} ₽). У{" "}
                        {itemsWithoutAmount.length} товаров сумма не указана —
                        отредактируйте итог или укажите стоимость по товарам.
                      </p>
                    )}

                    {itemsWithAmount.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/50">
                        Суммы по товарам не указаны. Внесите итоговую сумму
                        чека.
                      </p>
                    )}
                  </div>
                );
              })()}

            {/* Amount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground/70">
                Сумма чека
              </Label>
              <div className="relative">
                <Input
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  placeholder="0"
                  type="number"
                  className="h-11 pr-24 rounded-xl text-lg font-bold tabular-nums"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Select
                    value={bulkCurrency || getDisplayCurrency()}
                    onValueChange={(v) => v && setBulkCurrency(v)}
                  >
                    <SelectTrigger className="h-7 w-[80px] text-[11px] font-medium rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        getDisplayCurrency(),
                        ...new Set(accounts.map((a) => a.currency)),
                      ].map((c) => (
                        <SelectItem key={c} value={c}>
                          {getCurrencySymbol(c)} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {bulkAccountId &&
                (() => {
                  const selAcc = accounts.find((a) => a.id === bulkAccountId);
                  if (!selAcc) return null;
                  const cur = bulkCurrency || getDisplayCurrency();
                  if (selAcc.currency === cur) return null;
                  const amt = parseFloat(bulkAmount);
                  if (isNaN(amt) || amt <= 0) return null;
                  const rates = getCachedRates();
                  if (!rates) return null;
                  const converted = convert(amt, cur, selAcc.currency, rates);
                  return (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 mt-1">
                      <span className="tabular-nums font-medium">
                        ≈{" "}
                        {converted.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })}{" "}
                        {getCurrencySymbol(selAcc.currency)} {selAcc.currency}
                      </span>
                    </div>
                  );
                })()}
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Счёт списания
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {accounts.map((a) => {
                  const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.cash;
                  const Icon = cfg.icon;
                  const selected = bulkAccountId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        setBulkAccountId(a.id);
                        setBulkCurrency(a.currency);
                      }}
                      className={cn(
                        "flex items-start gap-2 rounded-xl border p-2.5 text-left transition-all",
                        selected
                          ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-800"
                          : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30",
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
                        <span className="text-xs font-medium truncate leading-tight block">
                          {a.name}
                        </span>
                        <p className="text-[10px] text-muted-foreground/50 leading-tight mt-0.5">
                          {cfg.label} · {a.currency}
                        </p>
                        <p className="text-[11px] font-medium text-foreground/80 leading-tight mt-0.5 tabular-nums">
                          {accountBalance(a).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {getCurrencySymbol(a.currency)}
                        </p>
                      </div>
                      {selected && (
                        <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Категория
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                {expenseCategories.map((cat) => {
                  const CatIcon = cat.icon ? getFinanceIcon(cat.icon) : Receipt;
                  const selected = bulkCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setBulkCategoryId(cat.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all",
                        selected
                          ? "border-blue-300 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-700 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800"
                          : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30",
                      )}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: cat.color
                            ? `${CATEGORY_COLORS_HEX[cat.color] || cat.color}15`
                            : undefined,
                        }}
                      >
                        <CatIcon
                          className="h-4 w-4"
                          style={{
                            color: cat.color
                              ? CATEGORY_COLORS_HEX[cat.color] || cat.color
                              : undefined,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium truncate">
                        {cat.name}
                      </span>
                      {selected && (
                        <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0 ml-auto">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {expenseCategories.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 col-span-2 text-center py-3">
                    Нет категорий расходов
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setBulkOpen(false)}
              >
                Отмена
              </Button>
              <Button
                className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={handleBulkPurchase}
                disabled={
                  saving ||
                  !bulkAmount.trim() ||
                  !bulkAccountId ||
                  parseFloat(bulkAmount) <= 0
                }
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                Создать транзакцию
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Удалить список?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Список и все его товары будут
              удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteConfirmId(null)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() =>
                deleteConfirmId && handleDeleteList(deleteConfirmId)
              }
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
