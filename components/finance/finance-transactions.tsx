"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Filter,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Wallet,
  X,
  Search,
  Tags,
  Calendar,
  AlertTriangle,
  RefreshCcw,
  Layers,
} from "lucide-react";
import type {
  Transaction,
  TransactionCategory,
  FinanceAccount,
  TransactionType,
} from "@/lib/finance-types";

import {
  getTransactionsByUser,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  updateAccount,
  getAccountsByUser,
  getCategoriesByUser,
  createCategory,
} from "@/lib/finance-client";
import { useAuthUid } from "@/lib/use-auth-uid";
import { getFinanceIcon } from "@/lib/finance-icons";
import {
  getDisplayCurrency,
  convert,
  getCachedRates,
  getCurrencySymbol,
} from "@/lib/exchange-rates";
import { AccountSearchSelect } from "@/components/finance/account-search-select";
import { CurrencySelect } from "@/components/finance/currency-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { localDateStr } from "@/lib/date-utils";
import { CategorySearchSelect } from "@/components/finance/category-search-select";
import { Checkbox } from "@/components/ui/checkbox";

type DateFilter = "all" | "today" | "week" | "month" | "custom";

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Доход",
  expense: "Списание",
  transfer: "Перевод",
};

const TAG_LABELS: Record<string, string> = {
  transfer: "Перевод",
  shopping: "Покупки",
  emergency: "Резерв",
  goal: "Цель",
  "obligation-payment": "Платёж",
};

function formatTag(tag: string): string {
  return TAG_LABELS[tag] ?? tag;
}

const FILTER_TYPE_OPTIONS = [
  { value: "all", label: "Все" },
  { value: "income", label: "Доход" },
  { value: "expense", label: "Расход" },
  { value: "transfer", label: "Перевод" },
] as const;

const TYPE_ICONS: Record<TransactionType, React.ElementType> = {
  income: TrendingUp,
  expense: TrendingDown,
  transfer: ArrowRightLeft,
};

const TYPE_COLORS: Record<TransactionType, string> = {
  income: "text-emerald-600",
  expense: "text-rose-600",
  transfer: "text-sky-600",
};

const TYPE_BGS: Record<TransactionType, string> = {
  income: "bg-emerald-500/10",
  expense: "bg-rose-500/10",
  transfer: "bg-sky-500/10",
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const today = new Date();
  const todayStr = localDateStr(today);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);
  const datePart = dateStr.split("T")[0];
  if (datePart === todayStr) return "Сегодня";
  if (datePart === yesterdayStr) return "Вчера";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = getDateGroup(tx.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return groups;
}

export function FinanceTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [tagsFilter, setTagsFilter] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null);
  const [deleteRestore, setDeleteRestore] = useState(true);
  const [deleteCategoryAll, setDeleteCategoryAll] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [txType, setTxType] = useState<TransactionType>("expense");
  const [txAccountId, setTxAccountId] = useState("");
  const [txToAccountId, setTxToAccountId] = useState("");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCurrency, setTxCurrency] = useState("");
  const [txDate, setTxDate] = useState("");
  useEffect(() => {
    const n = new Date();
    setTxDate(
      `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`,
    );
  }, []);
  const [txDescription, setTxDescription] = useState("");
  const [txTags, setTxTags] = useState("");
  const [saving, setSaving] = useState(false);

  const { uid } = useAuthUid();

  const fetchAll = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    const [txs, accs, cats] = await Promise.allSettled([
      getTransactionsByUser(uid),
      getAccountsByUser(uid),
      getCategoriesByUser(uid),
    ]);
    if (txs.status === "fulfilled") setTransactions(txs.value);
    else console.error("Failed to load transactions:", txs.reason);
    if (accs.status === "fulfilled") setAccounts(accs.value || []);
    else console.error("Failed to load accounts:", accs.reason);
    if (cats.status === "fulfilled") setCategories(cats.value || []);
    else console.error("Failed to load categories:", cats.reason);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = localDateStr();

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (dateFilter === "today") {
      result = result.filter((t) => t.date.startsWith(today));
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStart = localDateStr(weekAgo);
      result = result.filter((t) => t.date >= weekStart);
    } else if (dateFilter === "month") {
      const monthStart = new Date();
      monthStart.setDate(1);
      const ms = localDateStr(monthStart);
      result = result.filter((t) => t.date >= ms);
    } else if (dateFilter === "custom") {
      if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
      if (dateTo) result = result.filter((t) => t.date <= dateTo + "T23:59:59");
    }

    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    if (accountFilter !== "all") {
      result = result.filter((t) => t.accountId === accountFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.description.toLowerCase().includes(q));
    }

    if (tagsFilter.trim()) {
      const filterTags = tagsFilter
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (filterTags.length > 0) {
        result = result.filter((t) =>
          filterTags.some((tag) => t.tags.includes(tag)),
        );
      }
    }

    result.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [
    transactions,
    dateFilter,
    dateFrom,
    dateTo,
    typeFilter,
    categoryFilter,
    accountFilter,
    searchQuery,
    tagsFilter,
    sortAsc,
    today,
  ]);

  const activeCategories = useMemo(
    () => categories.filter((c) => !c.isArchived),
    [categories],
  );

  const categoryMap = useMemo(() => {
    const map: Record<string, TransactionCategory> = {};
    for (const c of activeCategories) map[c.id] = c;
    return map;
  }, [activeCategories]);

  const accountMap = useMemo(() => {
    const map: Record<string, FinanceAccount> = {};
    for (const a of accounts) map[a.id] = a;
    return map;
  }, [accounts]);

  const balanceHistory = useMemo(() => {
    const map: Record<string, { before: number; after: number }> = {};
    const byAccount: Record<string, Transaction[]> = {};
    for (const tx of transactions) {
      (byAccount[tx.accountId] ??= []).push(tx);
    }
    for (const [accId, txs] of Object.entries(byAccount)) {
      const acc = accountMap[accId];
      if (!acc) continue;
      const sorted = [...txs].sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : a.createdAt.localeCompare(b.createdAt);
      });
      let after = acc.balance;
      for (let i = sorted.length - 1; i >= 0; i--) {
        const tx = sorted[i];
        const delta = tx.type === "income" ? tx.amount : -tx.amount;
        map[tx.id] = { before: after - delta, after };
        after = after - delta;
      }
    }
    return map;
  }, [transactions, accountMap]);

  const incomeCategories = useMemo(
    () => activeCategories.filter((c) => c.type === "income"),
    [activeCategories],
  );
  const expenseCategories = useMemo(
    () => activeCategories.filter((c) => c.type === "expense"),
    [activeCategories],
  );

  const selectedCategories = useMemo(() => {
    if (txType === "income") return incomeCategories;
    if (txType === "expense") return expenseCategories;
    return [];
  }, [txType, incomeCategories, expenseCategories]);

  const clearFilters = () => {
    setDateFilter("all");
    setDateFrom("");
    setDateTo("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAccountFilter("all");
    setSearchQuery("");
    setTagsFilter("");
  };

  const hasActiveFilters =
    dateFilter !== "all" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    accountFilter !== "all" ||
    searchQuery.trim() ||
    tagsFilter.trim();

  const resetForm = () => {
    setTxType("expense");
    setTxAccountId("");
    setTxToAccountId("");
    setTxCategoryId("");
    setTxAmount("");
    setTxCurrency("");
    setTxDate(() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}T${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
    });
    setTxDescription("");
    setTxTags("");
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setTxType(tx.type);
    setTxAccountId(tx.accountId);
    setTxToAccountId(tx.toAccountId || "");
    setTxCategoryId(tx.categoryId);
    setTxAmount(String(tx.amount));
    setTxCurrency(tx.currency || getDisplayCurrency());
    setTxDate(tx.date.slice(0, 16));
    setTxDescription(tx.description);
    setTxTags(tx.tags.join(", "));
    setEditOpen(true);
  };

  const handleTxAccountChange = (id: string) => {
    setTxAccountId(id);
    const acc = accounts.find((a) => a.id === id);
    setTxCurrency(acc?.currency || getDisplayCurrency());
  };

  const handleSaveTx = async () => {
    if (!txAccountId || !txAmount.trim() || !txDate) return;
    setSaving(true);
    const amount = parseFloat(txAmount);
    if (isNaN(amount) || amount <= 0) {
      setSaving(false);
      return;
    }

    const tags = txTags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const isEdit = editTx && editOpen;

    const account = accounts.find((a) => a.id === txAccountId);
    const desc =
      txDescription.trim() ||
      (account
        ? txType === "income"
          ? `Пополнение — ${account.name}`
          : txType === "expense"
            ? `Списание — ${account.name}`
            : `Перевод — ${account.name}`
        : "");

    const dateValue = txDate.includes("T") ? txDate : txDate + "T12:00:00";

    try {
      if (isEdit) {
        const saved = await updateTransaction(editTx!.id, {
          accountId: txAccountId,
          toAccountId: txType === "transfer" ? txToAccountId : undefined,
          type: txType,
          categoryId:
            txCategoryId ||
            (txType === "transfer"
              ? "fin-cat-9"
              : expenseCategories[0]?.id || ""),
          amount,
          currency: txCurrency || getDisplayCurrency(),
          description: desc,
          tags,
          date: dateValue,
        });
        setTransactions((prev) =>
          prev.map((t) => (t.id === saved.id ? saved : t)),
        );
        setEditOpen(false);
        resetForm();
        toast.success("Операция обновлена");
      } else {
        const id = crypto.randomUUID();
        const saved = await createTransaction({
          id,
          userId: uid,
          accountId: txAccountId,
          toAccountId: txType === "transfer" ? txToAccountId : undefined,
          type: txType,
          categoryId:
            txCategoryId ||
            (txType === "transfer"
              ? "fin-cat-9"
              : expenseCategories[0]?.id || ""),
          amount,
          currency: txCurrency || getDisplayCurrency(),
          description: desc,
          tags,
          date: dateValue,
        });
        setTransactions((prev) => [saved, ...prev]);
        const cur = txCurrency || getDisplayCurrency();
        const rates = getCachedRates();
        const convertTo = (am: number, acc: FinanceAccount) =>
          cur !== acc.currency && rates
            ? convert(am, cur, acc.currency, rates)
            : am;
        setAccounts((prev) => {
          if (txType === "transfer") {
            return prev.map((a) => {
              if (a.id === txAccountId)
                return { ...a, balance: a.balance - convertTo(amount, a) };
              if (txToAccountId && a.id === txToAccountId)
                return { ...a, balance: a.balance + convertTo(amount, a) };
              return a;
            });
          }
          return prev.map((a) => {
            if (a.id !== txAccountId) return a;
            let delta =
              txType === "income" ? amount : txType === "expense" ? -amount : 0;
            if (cur !== a.currency && rates)
              delta =
                convert(amount, cur, a.currency, rates) *
                (txType === "expense" ? -1 : 1);
            return { ...a, balance: a.balance + delta };
          });
        });
        setAddOpen(false);
        resetForm();
        toast.success("Операция добавлена");
      }
    } catch (e) {
      console.error("Failed to save transaction:", e);
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTx) return;
    setDeleting(true);
    try {
      const targets = deleteCategoryAll
        ? transactions.filter((t) => t.categoryId === deleteTx.categoryId)
        : [deleteTx];

      if (deleteRestore && targets.length > 0) {
        for (const tx of targets) {
          const cur = tx.currency || getDisplayCurrency();
          const rates = getCachedRates();
          if (tx.type === "transfer") {
            const fromAcc = accountMap[tx.accountId];
            const toAcc = tx.toAccountId
              ? accountMap[tx.toAccountId]
              : undefined;
            if (fromAcc) {
              const delta =
                cur !== fromAcc.currency && rates
                  ? convert(tx.amount, cur, fromAcc.currency, rates)
                  : tx.amount;
              const newBalance = fromAcc.balance + delta;
              await updateAccount(fromAcc.id, { balance: newBalance });
              setAccounts((prev) =>
                prev.map((a) =>
                  a.id === fromAcc.id ? { ...a, balance: newBalance } : a,
                ),
              );
            }
            if (toAcc && tx.toAccountId !== tx.accountId) {
              const delta =
                cur !== toAcc.currency && rates
                  ? convert(tx.amount, cur, toAcc.currency, rates)
                  : tx.amount;
              const newBalance = toAcc.balance - delta;
              await updateAccount(toAcc.id, { balance: newBalance });
              setAccounts((prev) =>
                prev.map((a) =>
                  a.id === toAcc.id ? { ...a, balance: newBalance } : a,
                ),
              );
            }
            continue;
          }
          const acc = accountMap[tx.accountId];
          if (!acc) continue;
          let delta =
            tx.type === "income"
              ? -tx.amount
              : tx.type === "expense"
                ? tx.amount
                : 0;
          if (cur !== acc.currency && delta !== 0 && rates) {
            delta =
              convert(tx.amount, cur, acc.currency, rates) *
              (tx.type === "income" ? -1 : 1);
          }
          if (delta === 0) continue;
          const newBalance = acc.balance + delta;
          await updateAccount(tx.accountId, { balance: newBalance });
          setAccounts((prev) =>
            prev.map((a) =>
              a.id === tx.accountId ? { ...a, balance: newBalance } : a,
            ),
          );
        }
      }

      await Promise.all(targets.map((t) => deleteTransaction(t.id)));
      const deletedSet = new Set(targets.map((t) => t.id));
      setTransactions((prev) => prev.filter((t) => !deletedSet.has(t.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deletedSet.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteTx(null);
      toast.success(
        targets.length > 1
          ? `Удалено ${targets.length} операций`
          : "Операция удалена",
      );
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    toast("Удалить выбранные операции?", {
      action: {
        label: "Удалить",
        onClick: async () => {
          const ids = Array.from(selectedIds);
          try {
            await Promise.all(ids.map((id) => deleteTransaction(id)));
            setTransactions((prev) =>
              prev.filter((t) => !selectedIds.has(t.id)),
            );
            setSelectedIds(new Set());
            toast.success(`Удалено ${ids.length} операций`);
          } catch {
            toast.error("Ошибка массового удаления");
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["Дата", "Тип", "Описание", "Категория", "Счёт", "Сумма", "Теги"],
    ];
    for (const tx of filteredTransactions) {
      const cat = categoryMap[tx.categoryId];
      const acc = accountMap[tx.accountId];
      rows.push([
        tx.date,
        TYPE_LABELS[tx.type],
        tx.description,
        cat?.name || "",
        acc?.name || "",
        String(tx.amount),
        tx.tags.map(formatTag).join("; "),
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = JSON.stringify(filteredTransactions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Журнал операций</h2>
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors outline-none shrink-0"
              title="Экспорт"
            >
              <ArrowUp className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleExportCSV}>
                Экспорт CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportJSON}>
                Экспорт JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSortAsc(!sortAsc)}
            title={sortAsc ? "Сначала старые" : "Сначала новые"}
            className={cn(sortAsc && "text-muted-foreground/50")}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      {/* Compact filters */}
      <Card>
        <CardContent className="p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={dateFilter}
              onValueChange={(v) => v && setDateFilter(v as DateFilter)}
            >
              <SelectTrigger className="h-7 text-xs w-[130px]">
                <Calendar className="h-3 w-3 mr-1 shrink-0" />
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">7 дней</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="custom">Свой</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter === "custom" && (
              <>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-7 w-[130px] text-xs"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-7 w-[130px] text-xs"
                />
              </>
            )}

            <Select
              value={typeFilter}
              onValueChange={(v) => {
                if (v) {
                  setTypeFilter(v as TransactionType | "all");
                  setCategoryFilter("all");
                  setAccountFilter("all");
                }
              }}
            >
              <SelectTrigger className="h-7 text-xs w-[110px]">
                <SelectValue>
                  {FILTER_TYPE_OPTIONS.find((o) => o.value === typeFilter)
                    ?.label || typeFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FILTER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(typeFilter === "expense" || typeFilter === "income") && (
              <Select
                value={categoryFilter}
                onValueChange={(v) => v && setCategoryFilter(v)}
              >
                <SelectTrigger className="h-7 text-xs w-[150px]">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {activeCategories
                    .filter((c) => c.type === typeFilter)
                    .map((c) => {
                      const Icon = c.icon ? getFinanceIcon(c.icon) : null;
                      return (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="flex items-center gap-2">
                            {Icon && (
                              <Icon
                                className="h-3.5 w-3.5 shrink-0"
                                style={c.color ? { color: c.color } : undefined}
                              />
                            )}
                            {c.name}
                          </span>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            )}

            <Select
              value={accountFilter}
              onValueChange={(v) => v && setAccountFilter(v)}
            >
              <SelectTrigger className="h-7 text-xs w-[130px]">
                <SelectValue placeholder="Счёт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="h-7 text-xs w-[120px]"
            />

            <Input
              value={tagsFilter}
              onChange={(e) => setTagsFilter(e.target.value)}
              placeholder="Теги"
              className="h-7 text-xs w-[100px]"
            />

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearFilters}
                className="h-7 w-7"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions list */}
      <div className="space-y-6">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Filter className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Операции не найдены</p>
              <p className="text-xs mt-1">
                Попробуйте изменить фильтры или добавьте новую операцию
              </p>
            </CardContent>
          </Card>
        ) : (
          Array.from(groupByDate(filteredTransactions).entries()).map(
            ([groupLabel, txs]) => (
              <div key={groupLabel}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-foreground/80">
                    {groupLabel}
                  </h3>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {txs.map((tx) => {
                    const cat = categoryMap[tx.categoryId];
                    const acc = accountMap[tx.accountId];
                    const TypeIcon = TYPE_ICONS[tx.type];
                    const typeColor = TYPE_COLORS[tx.type];
                    const typeBg = TYPE_BGS[tx.type];
                    const CatIcon = cat?.icon
                      ? getFinanceIcon(cat.icon)
                      : TypeIcon;
                    const visibleTags = tx.tags;
                    return (
                      <div
                        key={tx.id}
                        className={cn(
                          "group relative flex flex-col rounded-xl border bg-card p-3 transition-all duration-200 hover:shadow-sm hover:border-foreground/20 cursor-pointer",
                          selectedIds.has(tx.id) &&
                            "border-primary/40 bg-primary/[0.03]",
                        )}
                        onClick={() => openEdit(tx)}
                      >
                        {/* Top row: icon, title + type badge, amount */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              typeBg,
                            )}
                          >
                            <CatIcon className={cn("h-4 w-4", typeColor)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium leading-tight truncate">
                                {tx.description || cat?.name || "Без категории"}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                                  typeBg,
                                  typeColor,
                                )}
                              >
                                {TYPE_LABELS[tx.type]}
                              </span>
                            </div>
                            {cat && tx.description && (
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                                {cat.name}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <div
                              className={cn(
                                "text-base font-bold tabular-nums tracking-tight",
                                typeColor,
                              )}
                            >
                              {tx.type === "income"
                                ? "+"
                                : tx.type === "expense"
                                  ? "−"
                                  : ""}
                              {(() => {
                                const accCurrency =
                                  accountMap[tx.accountId]?.currency || "RUB";
                                const dc = getDisplayCurrency();
                                const rates = getCachedRates();
                                if (rates && accCurrency !== dc) {
                                  const converted = convert(
                                    tx.amount,
                                    accCurrency,
                                    dc,
                                    rates,
                                  );
                                  return (
                                    <>
                                      {converted.toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      {getCurrencySymbol(dc)}
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    {tx.amount.toLocaleString()}{" "}
                                    {getCurrencySymbol(accCurrency)}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Time + account */}
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground/70">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="h-3 w-3 opacity-50" />
                            {formatTime(tx.date)}
                          </span>
                          {acc && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="inline-flex items-center gap-1 truncate max-w-[110px]">
                                <Wallet className="h-3 w-3 opacity-50 shrink-0" />
                                <span className="truncate">{acc.name}</span>
                                {tx.type === "transfer" &&
                                  tx.toAccountId &&
                                  accountMap[tx.toAccountId] && (
                                    <>
                                      <ArrowRight className="h-3 w-3 opacity-50 shrink-0" />
                                      <span className="truncate">
                                        {accountMap[tx.toAccountId].name}
                                      </span>
                                    </>
                                  )}
                              </span>
                            </>
                          )}
                          <div
                            className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(tx)}
                              className="h-6 w-6"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setDeleteRestore(true);
                                setDeleteCategoryAll(false);
                                setDeleteTx(tx);
                              }}
                              className="h-6 w-6 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Balance before → after */}
                        {acc && balanceHistory[tx.id] && (
                          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-border/50 text-[10px]">
                            <span className="text-muted-foreground/50">
                              Баланс счёта
                            </span>
                            <span className="tabular-nums text-muted-foreground/80">
                              {(() => {
                                const accCurrency = acc.currency || "RUB";
                                const b = balanceHistory[tx.id];
                                const sym = getCurrencySymbol(accCurrency);
                                const fmt = (n: number) =>
                                  n.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  });
                                return (
                                  <>
                                    <span>
                                      {fmt(b.before)} {sym}
                                    </span>
                                    <ArrowRight className="inline h-3 w-3 mx-1 opacity-50" />
                                    <span
                                      className={cn("font-semibold", typeColor)}
                                    >
                                      {fmt(b.after)} {sym}
                                    </span>
                                  </>
                                );
                              })()}
                            </span>
                          </div>
                        )}

                        {/* Tags (снятие/пополнение скрыты — дублируют вид) */}
                        {visibleTags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {visibleTags.slice(0, 2).map((tag) => {
                              const isShopping = tag === "shopping";
                              return (
                                <span
                                  key={tag}
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[9px] font-medium",
                                    isShopping
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "bg-muted/50",
                                  )}
                                >
                                  {isShopping ? "🛒 Покупки" : formatTag(tag)}
                                </span>
                              );
                            })}
                            {visibleTags.length > 2 && (
                              <span className="text-[9px] text-muted-foreground/40">
                                +{visibleTags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )
        )}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-sm text-muted-foreground">
            Выбрано: {selectedIds.size}
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Удалить выбранные
          </Button>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="overflow-hidden !p-0 sm:max-w-md">
          <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 pt-5 pb-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb,99,102,241)/0.14),transparent_55%)]" />
            <DialogHeader className="relative">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                  <Plus className="size-4" />
                </div>
                <div>
                  <DialogTitle className="text-base">
                    Новая операция
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Запишите движение средств
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Type segmented control */}
            <div className="relative mt-4 grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 backdrop-blur-sm">
              {(["expense", "income", "transfer"] as TransactionType[]).map(
                (t) => {
                  const Icon = TYPE_ICONS[t];
                  const active = txType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTxType(t);
                        setTxCategoryId("");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200",
                        active
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn("size-3.5", active && TYPE_COLORS[t])}
                      />
                      {TYPE_LABELS[t]}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <div className="space-y-4 px-5 py-4 max-h-[60vh] overflow-y-auto">
            {/* Amount hero */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Сумма
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className={cn(
                      "h-10 border-transparent bg-muted/60 px-4 text-lg font-semibold tabular-nums focus-visible:ring-2 focus-visible:ring-ring/40",
                      TYPE_COLORS[txType],
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {(() => {
                      const selAcc = accounts.find((a) => a.id === txAccountId);
                      if (!selAcc) return null;
                      const amt = parseFloat(txAmount);
                      if (isNaN(amt) || amt <= 0) return null;
                      const rates = getCachedRates();
                      if (!rates) return null;
                      const cur = txCurrency || getDisplayCurrency();
                      const dc = getDisplayCurrency();
                      const parts: string[] = [];
                      if (selAcc.currency !== cur) {
                        const converted = convert(
                          amt,
                          cur,
                          selAcc.currency,
                          rates,
                        );
                        parts.push(
                          `${converted.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })} ${getCurrencySymbol(selAcc.currency)} ${selAcc.currency}`,
                        );
                      }
                      if (dc !== selAcc.currency && dc !== cur) {
                        const displayVal = convert(amt, cur, dc, rates);
                        parts.push(
                          `${displayVal.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })} ${getCurrencySymbol(dc)} ${dc}`,
                        );
                      }
                      if (parts.length === 0) return null;
                      return (
                        <span className="text-xs text-muted-foreground/70 tabular-nums font-medium whitespace-nowrap">
                          ≈ {parts.join(" · ")}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <CurrencySelect
                  value={txCurrency || getDisplayCurrency()}
                  onChange={(v) => setTxCurrency(v)}
                  triggerClassName="h-10 w-[118px] shrink-0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  {txType === "transfer" ? "Счёт (откуда)" : "Счёт"}
                </Label>
                <AccountSearchSelect
                  accounts={accounts}
                  value={txAccountId}
                  onChange={handleTxAccountChange}
                />
              </div>

              {txType === "transfer" ? (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Счёт (куда)
                  </Label>
                  <AccountSearchSelect
                    accounts={accounts}
                    value={txToAccountId}
                    onChange={setTxToAccountId}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Категория
                  </Label>
                  <CategorySearchSelect
                    categories={activeCategories}
                    type={txType}
                    value={txCategoryId}
                    onChange={setTxCategoryId}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Дата и время
              </Label>
              <Input
                type="datetime-local"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="h-10 border-transparent bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Описание
              </Label>
              <Textarea
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Описание операции"
                rows={2}
                className="border-transparent bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Теги
              </Label>
              <Input
                value={txTags}
                onChange={(e) => setTxTags(e.target.value)}
                placeholder="тег1, тег2"
                className="h-10 border-transparent bg-muted/50"
              />
            </div>
          </div>

          <DialogFooter className="m-0 flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              className="h-10 px-6 font-medium shadow-sm"
              onClick={handleSaveTx}
              disabled={
                saving ||
                !txAccountId ||
                !txAmount.trim() ||
                !txDate ||
                (txType === "transfer" &&
                  (!txToAccountId || txToAccountId === txAccountId))
              }
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {txType === "income"
                ? "Добавить доход"
                : txType === "expense"
                  ? "Добавить расход"
                  : "Выполнить перевод"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать операцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Тип</Label>
              <Select
                value={txType}
                onValueChange={(v) => {
                  if (v) {
                    setTxType(v as TransactionType);
                    setTxCategoryId("");
                  }
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue>
                    {FILTER_TYPE_OPTIONS.find((o) => o.value === txType)
                      ?.label || txType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TYPE_OPTIONS.filter((o) => o.value !== "all").map(
                    (opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                {txType === "transfer" ? "Счёт (откуда)" : "Счёт"}
              </Label>
              <AccountSearchSelect
                accounts={accounts}
                value={txAccountId}
                onChange={handleTxAccountChange}
              />
            </div>

            {txType === "transfer" ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Счёт (куда)</Label>
                <AccountSearchSelect
                  accounts={accounts}
                  value={txToAccountId}
                  onChange={setTxToAccountId}
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">Категория</Label>
                <CategorySearchSelect
                  categories={activeCategories}
                  type={txType}
                  value={txCategoryId}
                  onChange={setTxCategoryId}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Сумма</Label>
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <CurrencySelect
                    value={txCurrency || getDisplayCurrency()}
                    onChange={(v) => setTxCurrency(v)}
                    triggerClassName="h-9"
                  />
                  {txAccountId &&
                    (() => {
                      const selAcc = accounts.find((a) => a.id === txAccountId);
                      if (!selAcc) return null;
                      const cur = txCurrency || getDisplayCurrency();
                      if (selAcc.currency === cur) return null;
                      return (
                        <span className="text-[10px] text-muted-foreground/60">
                          → {selAcc.currency}{" "}
                          {getCurrencySymbol(selAcc.currency)}
                        </span>
                      );
                    })()}
                </div>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0"
                    className="h-9 pr-24"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {(() => {
                      const selAcc = accounts.find((a) => a.id === txAccountId);
                      if (!selAcc) return null;
                      const amt = parseFloat(txAmount);
                      if (isNaN(amt) || amt <= 0) return null;
                      const rates = getCachedRates();
                      if (!rates) return null;
                      const cur = txCurrency || getDisplayCurrency();
                      const dc = getDisplayCurrency();
                      const parts: string[] = [];
                      if (selAcc.currency !== cur) {
                        const converted = convert(
                          amt,
                          cur,
                          selAcc.currency,
                          rates,
                        );
                        parts.push(
                          `${converted.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })} ${getCurrencySymbol(selAcc.currency)} ${selAcc.currency}`,
                        );
                      }
                      if (dc !== selAcc.currency && dc !== cur) {
                        const displayVal = convert(amt, cur, dc, rates);
                        parts.push(
                          `${displayVal.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })} ${getCurrencySymbol(dc)} ${dc}`,
                        );
                      }
                      if (parts.length === 0) return null;
                      return (
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums font-medium whitespace-nowrap">
                          ≈ {parts.join(" · ")}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Дата и время</Label>
              <Input
                type="datetime-local"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Описание</Label>
              <Textarea
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Описание операции"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Теги</Label>
              <Input
                value={txTags}
                onChange={(e) => setTxTags(e.target.value)}
                placeholder="тег1, тег2"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTx}
              disabled={
                saving ||
                !txAccountId ||
                !txAmount.trim() ||
                !txDate ||
                (txType === "transfer" &&
                  (!txToAccountId || txToAccountId === txAccountId))
              }
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTx}
        onOpenChange={(open) => {
          if (!open) setDeleteTx(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-5 text-destructive" />
              </div>
              <div className="space-y-1">
                <DialogTitle>Удалить операцию?</DialogTitle>
                <DialogDescription>
                  Это действие нельзя будет отменить
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteTx && (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  TYPE_BGS[deleteTx.type],
                )}
              >
                {(() => {
                  const Icon = TYPE_ICONS[deleteTx.type];
                  return (
                    <Icon
                      className={cn("size-4", TYPE_COLORS[deleteTx.type])}
                    />
                  );
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {deleteTx.description || "Без описания"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {accountMap[deleteTx.accountId]?.name || getDisplayCurrency()}{" "}
                  · {formatDate(deleteTx.date)}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  TYPE_COLORS[deleteTx.type],
                )}
              >
                {deleteTx.type === "expense"
                  ? "−"
                  : deleteTx.type === "income"
                    ? "+"
                    : ""}
                {deleteTx.amount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {getCurrencySymbol(deleteTx.currency || getDisplayCurrency())}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <Checkbox
                checked={deleteRestore}
                onCheckedChange={(checked) => setDeleteRestore(!!checked)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <RefreshCcw className="size-3.5 text-muted-foreground" />
                  Вернуть средства на счёт
                </span>
                <span className="text-xs text-muted-foreground">
                  {deleteTx?.type === "income"
                    ? "Снять зачисленную сумму со счёта"
                    : "Вернуть списанную сумму на счёт"}
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
              <Checkbox
                checked={deleteCategoryAll}
                onCheckedChange={(checked) => setDeleteCategoryAll(!!checked)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Layers className="size-3.5 text-muted-foreground" />
                  Удалить все операции этой категории
                </span>
                <span className="text-xs text-muted-foreground">
                  {deleteCategoryAll
                    ? `Будут удалены все операции категории «${
                        deleteTx?.categoryId
                          ? categoryMap[deleteTx.categoryId]?.name ||
                            "Без категории"
                          : "Без категории"
                      }»`
                    : "Затронет все операции с той же категорией"}
                </span>
              </span>
            </label>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTx(null)}
              disabled={deleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
