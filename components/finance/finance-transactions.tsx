"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Filter,
  Download,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  X,
} from "lucide-react";
import type {
  Transaction,
  TransactionCategory,
  FinanceAccount,
  TransactionType,
} from "@/lib/finance-types";

import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DateFilter = "all" | "today" | "week" | "month" | "custom";

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Доход",
  expense: "Расход",
  transfer: "Перевод",
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

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("ru-RU");
}

function getNextTxId(transactions: Transaction[]): string {
  const max = transactions.reduce((m, t) => {
    const n = parseInt(t.id.replace("fin-tx-", ""), 10);
    return n > m ? n : m;
  }, 0);
  return `fin-tx-${max + 1}`;
}

export function FinanceTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] =
    useState<FinanceAccount[]>([]);
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

  const [txType, setTxType] = useState<TransactionType>("expense");
  const [txAccountId, setTxAccountId] = useState("");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDescription, setTxDescription] = useState("");
  const [txTags, setTxTags] = useState("");
  const [saving, setSaving] = useState(false);

  const uid = auth.currentUser?.uid || "user-1";

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, accRes, catRes] = await Promise.all([
        fetch(`/api/finance/transactions?uid=${uid}`),
        fetch(`/api/finance/accounts?uid=${uid}`),
        fetch(`/api/finance/categories?uid=${uid}`),
      ]);
      if (txRes.ok) {
        const data = await txRes.json();
        setTransactions(Array.isArray(data) ? data : []);
      }
      if (accRes.ok) setAccounts(await accRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch {
      console.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = new Date().toISOString().split("T")[0];

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (dateFilter === "today") {
      result = result.filter((t) => t.date === today);
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekStart = weekAgo.toISOString().split("T")[0];
      result = result.filter((t) => t.date >= weekStart);
    } else if (dateFilter === "month") {
      const monthStart = new Date();
      monthStart.setDate(1);
      const ms = monthStart.toISOString().split("T")[0];
      result = result.filter((t) => t.date >= ms);
    } else if (dateFilter === "custom") {
      if (dateFrom) result = result.filter((t) => t.date >= dateFrom);
      if (dateTo) result = result.filter((t) => t.date <= dateTo);
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

  const categoryMap = useMemo(() => {
    const map: Record<string, TransactionCategory> = {};
    for (const c of categories) map[c.id] = c;
    return map;
  }, [categories]);

  const accountMap = useMemo(() => {
    const map: Record<string, FinanceAccount> = {};
    for (const a of accounts) map[a.id] = a;
    return map;
  }, [accounts]);

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );

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

  const resetForm = () => {
    setTxType("expense");
    setTxAccountId("");
    setTxCategoryId("");
    setTxAmount("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setTxDescription("");
    setTxTags("");
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setTxType(tx.type);
    setTxAccountId(tx.accountId);
    setTxCategoryId(tx.categoryId);
    setTxAmount(String(tx.amount));
    setTxDate(tx.date);
    setTxDescription(tx.description);
    setTxTags(tx.tags.join(", "));
    setEditOpen(true);
  };

  const selectedCategories = useMemo(() => {
    if (txType === "income") return incomeCategories;
    if (txType === "expense") return expenseCategories;
    return [];
  }, [txType, incomeCategories, expenseCategories]);

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

    const body = {
      id: isEdit ? editTx!.id : getNextTxId(transactions),
      userId: uid,
      accountId: txAccountId,
      type: txType,
      categoryId:
        txCategoryId ||
        (txType === "transfer" ? "fin-cat-9" : expenseCategories[0]?.id || ""),
      amount,
      description: txDescription.trim(),
      tags,
      date: txDate,
    };

    try {
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch("/api/finance/transactions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved: Transaction = await res.json();
        setTransactions((prev) => {
          if (isEdit) return prev.map((t) => (t.id === saved.id ? saved : t));
          return [saved, ...prev];
        });
        if (isEdit) setEditOpen(false);
        else setAddOpen(false);
        resetForm();
        toast.success(isEdit ? "Операция обновлена" : "Операция добавлена");
      }
    } catch {
      toast.error("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, userId: uid }),
      });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.success("Операция удалена");
      }
    } catch {
      toast.error("Ошибка удаления");
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
            await Promise.all(
              ids.map((id) =>
                fetch("/api/finance/transactions", {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id, userId: uid }),
                }),
              ),
            );
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
        tx.tags.join("; "),
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Журнал операций</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="h-4 w-4 mr-1" />
            JSON
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

      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-2 pt-3">
          <div className="space-y-1">
            <Label className="text-xs">Дата</Label>
            <Select
              value={dateFilter}
              onValueChange={(v) => v && setDateFilter(v as DateFilter)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="today">Сегодня</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="custom">Произвольно</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateFilter === "custom" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">С</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">По</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Тип</Label>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                if (v) {
                  setTypeFilter(v as TransactionType | "all");
                  setCategoryFilter("all");
                }
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="income">Доход</SelectItem>
                <SelectItem value="expense">Расход</SelectItem>
                <SelectItem value="transfer">Перевод</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(typeFilter === "expense" || typeFilter === "income") && (
            <div className="space-y-1">
              <Label className="text-xs">Категория</Label>
              <Select
                value={categoryFilter}
                onValueChange={(v) => v && setCategoryFilter(v)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {categories
                    .filter((c) => c.type === typeFilter)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Счёт</Label>
            <Select
              value={accountFilter}
              onValueChange={(v) => v && setAccountFilter(v)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
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
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Поиск</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Описание..."
              className="h-7 text-xs w-32"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Теги</Label>
            <Input
              value={tagsFilter}
              onChange={(e) => setTagsFilter(e.target.value)}
              placeholder="тег1, тег2"
              className="h-7 text-xs w-28"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Сброс
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Filter className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">Операции не найдены</p>
              <p className="text-xs mt-1">Попробуйте изменить фильтры</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-3 py-2.5 text-left w-8">
                      <button
                        onClick={toggleSelectAll}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {selectedIds.size === filteredTransactions.length &&
                        filteredTransactions.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none"
                      onClick={() => setSortAsc(!sortAsc)}
                    >
                      Дата {sortAsc ? "↑" : "↓"}
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Тип
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Описание
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Категория
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Счёт
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      Сумма
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                      Теги
                    </th>
                    <th className="px-3 py-2.5 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const cat = categoryMap[tx.categoryId];
                    const acc = accountMap[tx.accountId];
                    return (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer",
                          selectedIds.has(tx.id) && "bg-primary/5",
                        )}
                        onClick={() => openEdit(tx)}
                      >
                        <td
                          className="px-3 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleSelect(tx.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {selectedIds.has(tx.id) ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full",
                              TYPE_BGS[tx.type],
                            )}
                          >
                            {tx.type === "income" ? (
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                            ) : tx.type === "expense" ? (
                              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                            ) : (
                              <ArrowRightLeft className="h-3.5 w-3.5 text-sky-600" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 max-w-[200px] truncate font-medium">
                          {tx.description}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {cat?.name || tx.categoryId}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                          {acc?.name || tx.accountId}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                          <span className={cn(TYPE_COLORS[tx.type])}>
                            {tx.type === "income"
                              ? "+"
                              : tx.type === "expense"
                                ? "-"
                                : ""}
                            {tx.amount.toLocaleString()} ₽
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {tx.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {tx.tags.length > 2 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                              >
                                +{tx.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td
                          className="px-3 py-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(tx)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(tx.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Новая операция</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select
                value={txType}
                onValueChange={(v) => {
                  if (v) {
                    setTxType(v as TransactionType);
                    setTxCategoryId("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="expense">Расход</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Счёт</Label>
              <Select
                value={txAccountId}
                onValueChange={(v) => v && setTxAccountId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {txType !== "transfer" && (
              <div className="space-y-1.5">
                <Label>Категория</Label>
                <Select
                  value={txCategoryId}
                  onValueChange={(v) => v && setTxCategoryId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Сумма</Label>
              <Input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Описание операции"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Теги</Label>
              <Input
                value={txTags}
                onChange={(e) => setTxTags(e.target.value)}
                placeholder="тег1, тег2"
              />
            </div>
          </div>
          <DialogFooter>
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
              onClick={handleSaveTx}
              disabled={saving || !txAccountId || !txAmount.trim() || !txDate}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Редактировать операцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select
                value={txType}
                onValueChange={(v) => {
                  if (v) {
                    setTxType(v as TransactionType);
                    setTxCategoryId("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Доход</SelectItem>
                  <SelectItem value="expense">Расход</SelectItem>
                  <SelectItem value="transfer">Перевод</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Счёт</Label>
              <Select
                value={txAccountId}
                onValueChange={(v) => v && setTxAccountId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {txType !== "transfer" && (
              <div className="space-y-1.5">
                <Label>Категория</Label>
                <Select
                  value={txCategoryId}
                  onValueChange={(v) => v && setTxCategoryId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Сумма</Label>
              <Input
                type="number"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Дата</Label>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Textarea
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Описание операции"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Теги</Label>
              <Input
                value={txTags}
                onChange={(e) => setTxTags(e.target.value)}
                placeholder="тег1, тег2"
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
              disabled={saving || !txAccountId || !txAmount.trim() || !txDate}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
