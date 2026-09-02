"use client";

import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Pencil,
  History,
  Loader2,
  Wallet,
  X,
  Construction,
} from "lucide-react";
import type {
  FinanceAccount,
  Transaction,
  TransactionCategory,
} from "@/lib/finance-types";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit as firestoreLimit,
} from "firebase/firestore";
import {
  getCachedRates,
  convert,
  getDisplayCurrency,
  getCurrencySymbol,
} from "@/lib/exchange-rates";
import { updateTransaction } from "@/lib/finance-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CategorySearchSelect } from "@/components/finance/category-search-select";

interface AccountEditLog {
  id: string;
  accountId: string;
  accountName: string;
  changes: {
    field: string;
    oldValue?: string;
    newValue?: string;
  }[];
  createdAt: string;
}

interface HistoryEntry {
  id: string;
  type: "income" | "expense" | "transfer" | "edit";
  date: string;
  createdAt: string;
  amount?: number;
  currency?: string;
  accountId?: string;
  accountName?: string;
  toAccountId?: string;
  toAccountName?: string;
  toAccountNewBalance?: number;
  accountNewBalance?: number;
  description?: string;
  tags?: string[];
  categoryName?: string;
  categoryColor?: string;
  changes?: AccountEditLog["changes"];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  income: TrendingUp,
  expense: TrendingDown,
  transfer: ArrowRightLeft,
  edit: Pencil,
};

const TYPE_COLORS: Record<string, string> = {
  income: "text-emerald-600 bg-emerald-500/10",
  expense: "text-rose-600 bg-rose-500/10",
  transfer: "text-indigo-600 bg-indigo-500/10",
  edit: "text-amber-600 bg-amber-500/10",
};

const TYPE_LABELS: Record<string, string> = {
  income: "Пополнение",
  expense: "Списание",
  transfer: "Перевод",
  edit: "Редактирование",
};

export function FinanceAccountsHistory({
  accounts,
  transactions,
  categories,
}: {
  accounts: FinanceAccount[];
  transactions: Transaction[];
  categories: TransactionCategory[];
}) {
  const [editLogs, setEditLogs] = useState<AccountEditLog[]>([]);
  const [loadingEdits, setLoadingEdits] = useState(true);

  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const accountMap = useMemo(() => {
    const map = new Map<string, FinanceAccount>();
    for (const a of accounts) map.set(a.id, a);
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  useEffect(() => {
    const loadEdits = async () => {
      try {
        const q = query(
          collection(db, "FINANCE_ACCOUNT_EDITS"),
          orderBy("createdAt", "desc"),
          firestoreLimit(50),
        );
        const snap = await getDocs(q);
        const logs: AccountEditLog[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          const accountName =
            accountMap.get(data.accountId)?.name || data.accountName || "";
          logs.push({
            id: doc.id,
            accountId: data.accountId,
            accountName,
            changes: data.changes || [],
            createdAt: data.createdAt,
          });
        });
        setEditLogs(logs);
      } catch (e) {
        console.error("Failed to load account edit logs:", e);
      } finally {
        setLoadingEdits(false);
      }
    };
    loadEdits();
  }, [accountMap]);

  const allEntries = useMemo((): HistoryEntry[] => {
    const entries: HistoryEntry[] = [];

    for (const tx of transactions) {
      const acc = accountMap.get(tx.accountId);
      const toAcc = tx.toAccountId
        ? accountMap.get(tx.toAccountId)
        : undefined;
      const cat = categoryMap.get(tx.categoryId);

      const entry: HistoryEntry = {
        id: tx.id,
        type: tx.type,
        date: tx.date,
        createdAt: tx.createdAt || "",
        amount: tx.amount,
        currency: acc?.currency || "RUB",
        accountId: tx.accountId,
        accountName: acc?.name || "Неизвестный",
        toAccountId: tx.toAccountId,
        toAccountName: toAcc?.name,
        description: tx.description,
        tags: tx.tags?.slice(0, 3),
        categoryName: cat?.name,
        categoryColor: cat?.color,
      };

      if (tx.type === "income" || tx.type === "expense") {
        entry.accountNewBalance = acc?.balance;
      }
      if (tx.type === "transfer") {
        entry.accountNewBalance = acc?.balance;
        entry.toAccountNewBalance = toAcc?.balance;
      }

      entries.push(entry);
    }

    for (const log of editLogs) {
      entries.push({
        id: log.id,
        type: "edit",
        date: log.createdAt?.split("T")[0] || "",
        createdAt: log.createdAt || "",
        accountId: log.accountId,
        accountName: log.accountName,
        changes: log.changes,
      });
    }

    entries.sort((a, b) => {
      const ca = a.createdAt || "";
      const cb = b.createdAt || "";
      return cb.localeCompare(ca);
    });

    return entries.slice(0, 30);
  }, [transactions, editLogs, accountMap, categoryMap]);

  const displayCurrency = getDisplayCurrency();
  const rates = getCachedRates();

  function formatAmount(amount: number, currency?: string): string {
    const cur = currency || "RUB";
    if (rates && cur !== displayCurrency) {
      const converted = convert(amount, cur, displayCurrency, rates);
      return `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${getCurrencySymbol(displayCurrency)}`;
    }
    return `${amount.toLocaleString()} ${getCurrencySymbol(cur)}`;
  }

  function openEditTx(tx: Transaction) {
    setEditTx(tx);
    setEditAmount(String(tx.amount));
    setEditCategoryId(tx.categoryId);
    setEditDescription(tx.description);
    setEditTags(tx.tags.join(", "));
  }

  async function handleSaveEditTx() {
    if (!editTx) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    setEditSaving(true);
    try {
      await updateTransaction(editTx.id, {
        amount,
        categoryId: editCategoryId,
        description: editDescription,
        tags: editTags.split(",").map((s) => s.trim()).filter(Boolean),
      });
      toast.success("Транзакция обновлена");
      setEditTx(null);
    } catch (e) {
      console.error("Failed to update transaction:", e);
      toast.error("Ошибка обновления");
    } finally {
      setEditSaving(false);
    }
  }

  function renderEntry(entry: HistoryEntry) {
    const Icon = TYPE_ICONS[entry.type] || Wallet;
    const colorClass = TYPE_COLORS[entry.type] || "text-muted-foreground bg-muted/50";

    return (
      <div
        key={entry.id}
        className="flex gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/40 last:border-0"
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5",
            colorClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium truncate">
              {TYPE_LABELS[entry.type]}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-muted-foreground">
                {entry.date?.slice(5) || ""}
              </span>
              {entry.type !== "edit" && (
                <button
                  onClick={() => {
                    const tx = transactions.find((t) => t.id === entry.id);
                    if (tx) openEditTx(tx);
                  }}
                  className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground/50 hover:text-foreground transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {entry.type === "income" || entry.type === "expense" ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold",
                    entry.type === "income"
                      ? "text-emerald-600"
                      : "text-rose-600",
                  )}
                >
                  {entry.type === "income" ? "+" : "-"}
                  {formatAmount(entry.amount || 0, entry.currency)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {entry.accountName}
              </p>
              {entry.categoryName && (
                <p className="text-[10px] text-muted-foreground/70">
                  {entry.categoryName}
                </p>
              )}
              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {entry.accountNewBalance != null && (
                <p className="text-[10px] text-muted-foreground/60">
                  Баланс: {entry.accountNewBalance.toLocaleString()}{" "}
                  {getCurrencySymbol(entry.currency || "RUB")}
                </p>
              )}
            </div>
          ) : entry.type === "transfer" ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="truncate font-medium">{entry.accountName}</span>
                <ArrowRightLeft className="h-3 w-3 shrink-0 text-indigo-500" />
                <span className="truncate font-medium">
                  {entry.toAccountName}
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-600">
                {formatAmount(entry.amount || 0, entry.currency)}
              </span>
              <div className="flex gap-4 text-[10px] text-muted-foreground/60">
                {entry.accountNewBalance != null && (
                  <span>
                    {entry.accountName}:{" "}
                    {entry.accountNewBalance.toLocaleString()}
                  </span>
                )}
                {entry.toAccountNewBalance != null && (
                  <span>
                    {entry.toAccountName}:{" "}
                    {entry.toAccountNewBalance.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ) : entry.type === "edit" ? (
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground truncate">
                {entry.accountName}
              </p>
              {entry.changes?.map((change, i) => (
                <div key={i} className="text-[10px]">
                  {change.field === "name" ? (
                    <span className="text-muted-foreground">
                      Название:{" "}
                      <span className="line-through text-muted-foreground/60">
                        {change.oldValue}
                      </span>{" "}
                      → <span className="text-foreground">{change.newValue}</span>
                    </span>
                  ) : change.field === "balance" ? (
                    <span className="text-muted-foreground">
                      Баланс:{" "}
                      <span className="line-through text-muted-foreground/60">
                        {change.oldValue}
                      </span>{" "}
                      → <span className="text-foreground">{change.newValue}</span>
                    </span>
                  ) : change.field === "currency" ? (
                    <span className="text-muted-foreground">
                      Валюта:{" "}
                      <span className="line-through text-muted-foreground/60">
                        {change.oldValue}
                      </span>{" "}
                      → <span className="text-foreground">{change.newValue}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {change.field}: {change.oldValue} → {change.newValue}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
          <History className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">История</p>
          <p className="text-[10px] text-muted-foreground">
            Последние операции и изменения
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {allEntries.length === 0 && !loadingEdits && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
              <Construction className="h-5 w-5 text-amber-500/60" />
            </div>
            <p className="text-xs text-muted-foreground mb-1.5">
              В разработке
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Скоро здесь появится история операций
            </p>
          </div>
        )}

        {(loadingEdits && allEntries.length === 0) && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {allEntries.map(renderEntry)}

      </div>

      {/* Edit transaction dialog */}
      <Dialog open={!!editTx} onOpenChange={(o) => { if (!o) setEditTx(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Редактировать транзакцию
            </DialogTitle>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Сумма</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="h-9"
                  min="0"
                  step="any"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Категория</Label>
                <CategorySearchSelect
                  value={editCategoryId}
                  onChange={setEditCategoryId}
                  type={editTx.type}
                  categories={categories}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Описание</Label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Теги (через запятую)</Label>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="h-9"
                  placeholder="tag1, tag2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTx(null)}>
              Отмена
            </Button>
            <Button onClick={handleSaveEditTx} disabled={editSaving || !editAmount}>
              {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
