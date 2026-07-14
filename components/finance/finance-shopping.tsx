"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Check,
  Trash2,
  Loader2,
  DollarSign,
  X,
  Calendar,
  Archive,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  amount?: number;
  accountId?: string;
  transactionId?: string;
}

interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  date: string;
  items: ShoppingItem[];
  completed: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const UNITS = ["шт", "кг", "г", "л", "мл", "уп", "пачка", "банка", "бутылка"];

export function FinanceShopping() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemUnit, setNewItemUnit] = useState("шт");

  // Complete item dialog
  const [completeItem, setCompleteItem] = useState<{
    listId: string;
    itemId: string;
  } | null>(null);
  const [itemAmount, setItemAmount] = useState("");
  const [itemAccountId, setItemAccountId] = useState("");
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<
    { id: string; name: string; currency: string }[]
  >([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid || "user-1";

    const loadMock = () => {
      const {
        mockShoppingLists,
        mockFinanceAccounts,
      } = require("@/lib/finance-mock");
      setLists(mockShoppingLists);
      setAccounts(
        mockFinanceAccounts.map(
          (a: { id: string; name: string; currency: string }) => ({
            id: a.id,
            name: a.name,
            currency: a.currency,
          }),
        ),
      );
      setInitialLoading(false);
    };
    loadMock();
  }, []);

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const uid = auth.currentUser?.uid || "user-1";
    const now = new Date().toISOString();
    const list: ShoppingList = {
      id: genId(),
      userId: uid,
      name: newListName.trim(),
      date: now.split("T")[0],
      items: [],
      completed: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    setLists((prev) => [list, ...prev]);
    setNewListName("");
    setExpandedId(list.id);
    toast.success("Список создан");
  };

  const handleAddItem = (listId: string) => {
    if (!newItemName.trim()) return;
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: [
                ...list.items,
                {
                  id: genId(),
                  name: newItemName.trim(),
                  quantity: parseFloat(newItemQty) || 1,
                  unit: newItemUnit,
                  checked: false,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );
    setNewItemName("");
    setNewItemQty("1");
    setNewItemUnit("шт");
  };

  const handleCheckItem = (listId: string, itemId: string) => {
    setCompleteItem({ listId, itemId });
    setItemAmount("");
    setItemAccountId("");
  };

  const handleConfirmComplete = () => {
    if (!completeItem) return;
    const { listId, itemId } = completeItem;
    const amount = parseFloat(itemAmount);

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      checked: true,
                      amount: amount || undefined,
                      accountId: itemAccountId || undefined,
                      transactionId: amount ? `tx-${genId()}` : undefined,
                    }
                  : item,
              ),
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );

    if (amount > 0 && itemAccountId) {
      toast.success(`Транзакция на ${amount} ₽ создана`);
    }

    setCompleteItem(null);
    setItemAmount("");
    setItemAccountId("");
  };

  const handleDeleteItem = (listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );
  };

  const handleDeleteList = (listId: string) => {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    toast.success("Список удалён");
  };

  const handleToggleComplete = (listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              completed: !list.completed,
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );
  };

  const handleToggleArchive = (listId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              archived: !list.archived,
              updatedAt: new Date().toISOString(),
            }
          : list,
      ),
    );
  };

  const activeLists = lists.filter((l) => !l.archived && !l.completed);
  const completedLists = lists.filter((l) => l.completed && !l.archived);
  const archivedLists = lists.filter((l) => l.archived);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderList = (list: ShoppingList) => {
    const expanded = expandedId === list.id;
    const checkedCount = list.items.filter((i) => i.checked).length;

    return (
      <Card key={list.id}>
        <CardHeader
          className={cn(
            "flex flex-row items-center justify-between cursor-pointer",
            list.completed && "opacity-60",
          )}
          onClick={() => setExpandedId(expanded ? null : list.id)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(list.id);
              }}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all shrink-0",
                list.completed
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-muted-foreground/30 hover:border-primary/50",
              )}
            >
              {list.completed && <Check className="h-3 w-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm truncate">{list.name}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-muted-foreground/60">
                  {list.date}
                </span>
                <span className="text-[11px] text-muted-foreground/40">
                  {checkedCount}/{list.items.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleArchive(list.id);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-all"
              title="Архивировать"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteList(list.id);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
              title="Удалить список"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            )}
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="border-t pt-3 space-y-3">
            {list.items.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-4">
                Список пуст. Добавьте товары.
              </p>
            ) : (
              <div className="space-y-1">
                {list.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                      item.checked
                        ? "bg-muted/30 opacity-60"
                        : "hover:bg-muted/20",
                    )}
                  >
                    <button
                      onClick={() => {
                        if (!item.checked) handleCheckItem(list.id, item.id);
                      }}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 transition-all",
                        item.checked
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-muted-foreground/30 hover:border-primary/50",
                      )}
                    >
                      {item.checked && <Check className="h-2.5 w-2.5" />}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.checked && "line-through text-muted-foreground/50",
                      )}
                    >
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground/60 shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                    {item.amount && (
                      <span className="text-xs font-medium text-muted-foreground/70 shrink-0">
                        {item.amount} ₽
                      </span>
                    )}
                    {!item.checked && (
                      <button
                        onClick={() => handleDeleteItem(list.id, item.id)}
                        className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground/30 hover:text-rose-500 transition-all shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                value={addingToList === list.id ? newItemName : ""}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Название товара"
                className="flex-1 h-8 text-sm"
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
                className="w-14 h-8 text-sm text-center"
                onFocus={() => setAddingToList(list.id)}
              />
              <Select
                value={newItemUnit}
                onValueChange={(v) => v && setNewItemUnit(v)}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
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
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => handleAddItem(list.id)}
                disabled={!newItemName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Create new list */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Новый список покупок..."
                className="pl-9 h-9 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateList();
                }}
              />
            </div>
            <Button
              onClick={handleCreateList}
              disabled={!newListName.trim()}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Создать
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active lists */}
      {activeLists.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-1">
            Активные — {activeLists.length}
          </h3>
          {activeLists.map(renderList)}
        </div>
      )}

      {/* Completed lists */}
      {completedLists.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-1">
            Завершённые — {completedLists.length}
          </h3>
          {completedLists.map(renderList)}
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 mb-4">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Списков покупок нет
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Создайте список продуктов или необходимых вещей
          </p>
        </div>
      )}

      {/* Complete item dialog */}
      <Dialog
        open={!!completeItem}
        onOpenChange={(open) => {
          if (!open) setCompleteItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Завершить товар
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Укажите сумму и счёт для автоматического создания транзакции.
              Можно пропустить — товар просто отметится как купленный.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/80">
                Сумма (₽)
              </label>
              <Input
                value={itemAmount}
                onChange={(e) =>
                  setItemAmount(e.target.value.replace(/\D/g, ""))
                }
                placeholder="0"
                type="text"
                inputMode="numeric"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground/80">
                Счёт списания
              </label>
              <Select
                value={itemAccountId}
                onValueChange={(v) => v && setItemAccountId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не выбран" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCompleteItem(null)}
              >
                Пропустить
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleConfirmComplete}
              >
                <Check className="h-4 w-4" />
                {itemAmount && itemAccountId
                  ? "Создать транзакцию"
                  : "Отметить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
