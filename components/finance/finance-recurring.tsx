"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Repeat,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wallet,
  Calendar,
  CalendarDays,
  Power,
  PowerOff,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type {
  RecurringTransaction,
  RecurringInterval,
  FinanceAccount,
  TransactionCategory,
  TransactionType,
} from "@/lib/finance-types";
import {
  getRecurringTransactionsByUser,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  getAccountsByUser,
  getCategoriesByUser,
} from "@/lib/finance-client";
import { useAuthUid } from "@/lib/use-auth-uid";
import {
  getDisplayCurrency,
  getCurrencySymbol,
  getCachedRates,
  convert,
} from "@/lib/exchange-rates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CategorySearchSelect } from "./category-search-select";
import { AccountSearchSelect } from "./account-search-select";
import { CurrencySelect } from "./currency-select";

const INTERVAL_LABELS: Record<RecurringInterval, string> = {
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  yearly: "Ежегодно",
};

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const TYPE_LABELS: Record<string, string> = {
  income: "Доход",
  expense: "Расход",
};

export function FinanceRecurring() {
  const { uid } = useAuthUid();

  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formCurrency, setFormCurrency] = useState("");
  const [formInterval, setFormInterval] =
    useState<RecurringInterval>("monthly");
  const [formDayOfMonth, setFormDayOfMonth] = useState("");
  const [formMonth, setFormMonth] = useState("1");
  const [formIsActive, setFormIsActive] = useState(true);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const activeCategories = categories.filter((c) => !c.isArchived);
  const categoryMap = new Map(activeCategories.map((c) => [c.id, c]));
  const filteredCategories = activeCategories.filter(
    (c) => c.type === formType,
  );

  useEffect(() => {
    if (!formAccountId && accounts.length > 0) {
      setFormAccountId(accounts[0].id);
    }
  }, [accounts, formAccountId]);

  useEffect(() => {
    setFormCategoryId("");
  }, [formType]);

  const fetchData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [recurring, accs, cats] = await Promise.all([
        getRecurringTransactionsByUser(uid),
        getAccountsByUser(uid),
        getCategoriesByUser(uid),
      ]);
      setItems(recurring);
      setAccounts(accs);
      setCategories(cats);
    } catch {
      toast.error("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = useCallback(() => {
    setFormDescription("");
    setFormType("expense");
    setFormAmount("");
    setFormAccountId(accounts[0]?.id || "");
    setFormCategoryId("");
    setFormCurrency(accounts[0]?.currency || getDisplayCurrency());
    setFormInterval("monthly");
    setFormDayOfMonth("");
    setFormMonth("1");
    setFormIsActive(true);
  }, [accounts]);

  const openAddDialog = useCallback(() => {
    resetForm();
    setEditingItem(null);
    setDialogOpen(true);
  }, [resetForm]);

  const handleFormAccountChange = (id: string) => {
    setFormAccountId(id);
    const acc = accounts.find((a) => a.id === id);
    setFormCurrency(acc?.currency || getDisplayCurrency());
  };

  const openEditDialog = useCallback(
    (item: RecurringTransaction) => {
      setEditingItem(item);
      setFormDescription(item.description);
      setFormType(item.type);
      setFormAmount(String(item.amount));
      setFormAccountId(item.accountId);
      setFormCategoryId(item.categoryId);
      setFormCurrency(
        item.currency ||
          accounts.find((a) => a.id === item.accountId)?.currency ||
          getDisplayCurrency(),
      );
      setFormInterval(item.interval);
      setFormDayOfMonth(String(item.dayOfMonth));
      setFormMonth(String(item.month ?? 1));
      setFormIsActive(item.isActive);
      setDialogOpen(true);
    },
    [accounts],
  );

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingItem(null);
  }, []);

  const handleSave = async () => {
    if (
      !formDescription.trim() ||
      !formAmount ||
      !formAccountId ||
      !formCategoryId ||
      !formDayOfMonth
    ) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    const amount = parseFloat(formAmount);
    const dayOfMonth = parseInt(formDayOfMonth, 10);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Сумма должна быть больше 0");
      return;
    }

    const maxDay = formInterval === "weekly" ? 7 : 31;
    if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > maxDay) {
      toast.error(
        formInterval === "weekly"
          ? "День недели должен быть от 1 до 7"
          : "День месяца должен быть от 1 до 31",
      );
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Сохраняем...");

    try {
      const now = new Date().toISOString();
      const baseData = {
        description: formDescription.trim(),
        type: formType,
        amount,
        currency: formCurrency || getDisplayCurrency(),
        accountId: formAccountId,
        categoryId: formCategoryId,
        interval: formInterval,
        dayOfMonth,
        month: formInterval === "yearly" ? parseInt(formMonth, 10) : undefined,
        isActive: formIsActive,
        startDate: editingItem?.startDate || now,
      };

      if (editingItem) {
        const updated = await updateRecurringTransaction(
          editingItem.id,
          baseData,
        );
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? updated : i)),
        );
        toast.success("Сохранено", { id: toastId });
      } else {
        const id = crypto.randomUUID();
        const created = await createRecurringTransaction({
          id,
          userId: uid,
          ...baseData,
        });
        setItems((prev) => [...prev, created]);
        toast.success("Создано", { id: toastId });
      }
      handleCloseDialog();
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: RecurringTransaction) => {
    toast(`Удалить «${item.description}»?`, {
      action: {
        label: "Удалить",
        onClick: async () => {
          const toastId = toast.loading("Удаляем...");
          try {
            await deleteRecurringTransaction(item.id);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            toast.success("Удалено", { id: toastId });
          } catch {
            toast.error("Ошибка сети", { id: toastId });
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    const toastId = toast.loading("Обновляем...");
    try {
      const updated = await updateRecurringTransaction(item.id, {
        isActive: !item.isActive,
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      toast.success(updated.isActive ? "Включено" : "Отключено", {
        id: toastId,
      });
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeCount = items.filter((i) => i.isActive).length;
  const rates = getCachedRates();
  const dc = getDisplayCurrency();
  const totalMonthly = items
    .filter((i) => i.isActive)
    .reduce((sum, i) => {
      const cur = i.currency || accountMap.get(i.accountId)?.currency || dc;
      const monthly =
        i.interval === "monthly"
          ? i.amount
          : i.interval === "weekly"
            ? i.amount * 4.33
            : i.amount / 12;
      const converted =
        rates && cur !== dc ? convert(monthly, cur, dc, rates) : monthly;
      return sum + converted;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10 shrink-0">
            <Repeat className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Регулярные платежи</h2>
            {items.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeCount} активных
                {totalMonthly > 0 && (
                  <>
                    {" "}
                    · ≈{" "}
                    {totalMonthly.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{" "}
                    {getCurrencySymbol(dc)}/мес
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          className="h-9 rounded-lg font-medium"
          onClick={openAddDialog}
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Repeat className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Нет регулярных платежей</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Добавьте регулярный доход или расход
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить платёж
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => {
            const account = accountMap.get(item.accountId);
            const category = categoryMap.get(item.categoryId);
            const isIncome = item.type === "income";
            const typeColor = isIncome ? "text-emerald-500" : "text-rose-500";
            const typeBg = isIncome
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400";
            const schedule =
              item.interval === "weekly"
                ? `Каждую неделю · ${item.dayOfMonth} день`
                : item.interval === "yearly"
                  ? `Ежегодно · ${item.dayOfMonth} ${MONTH_NAMES[(item.month ?? 1) - 1].toLowerCase()}`
                  : `Ежемесячно · ${item.dayOfMonth} числа`;
            return (
              <Card
                key={item.id}
                className={cn(
                  "group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                  !item.isActive && "opacity-60",
                )}
              >
                {/* Accent edge */}
                <div
                  className={cn(
                    "absolute left-0 top-0 h-full w-1",
                    isIncome
                      ? "bg-gradient-to-b from-emerald-400 to-emerald-600"
                      : "bg-gradient-to-b from-rose-400 to-rose-600",
                  )}
                />
                <div
                  className={cn(
                    "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl",
                    isIncome ? "bg-emerald-500/10" : "bg-rose-500/10",
                  )}
                />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          typeBg,
                        )}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {item.description}
                        </CardTitle>
                        <p className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground/70">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {schedule}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(item)}
                        className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item)}
                        className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p
                        className={cn(
                          "text-2xl font-bold tabular-nums tracking-tight",
                          typeColor,
                        )}
                      >
                        {isIncome ? "+" : "−"}
                        {item.amount.toLocaleString()}{" "}
                        {getCurrencySymbol(
                          item.currency ||
                            accountMap.get(item.accountId)?.currency ||
                            getDisplayCurrency(),
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50">
                        {isIncome ? "поступление" : "списание"}
                        {category ? ` · ${category.name}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all",
                        item.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {item.isActive ? (
                        <Power className="h-3 w-3" />
                      ) : (
                        <PowerOff className="h-3 w-3" />
                      )}
                      {item.isActive ? "Включено" : "Отключено"}
                    </button>
                  </div>
                  {account && (
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/50 text-[11px] text-muted-foreground/80">
                      <Wallet className="h-3 w-3 shrink-0 opacity-60" />
                      <span className="truncate">{account.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
      >
        <DialogContent className="overflow-hidden !p-0 sm:max-w-[520px]">
          <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-5 pt-5 pb-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241/0.14),transparent_55%)]" />
            <DialogHeader className="relative">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                  <Repeat className="size-4" />
                </div>
                <div>
                  <DialogTitle className="text-base">
                    {editingItem ? "Редактировать платёж" : "Регулярный платёж"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground">
                    Автоматическое создание операций
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Type segmented control */}
            <div className="relative mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1 backdrop-blur-sm">
              {(["expense", "income"] as const).map((t) => {
                const active = formType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormType(t as TransactionType)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200",
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t === "income" ? (
                      <ArrowUpRight
                        className={cn("size-3.5", active && "text-emerald-500")}
                      />
                    ) : (
                      <ArrowDownRight
                        className={cn("size-3.5", active && "text-rose-500")}
                      />
                    )}
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 px-5 py-4 max-h-[60vh] overflow-y-auto">
            {/* Amount hero */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Сумма
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    min={0}
                    className={cn(
                      "h-10 border-transparent bg-muted/60 text-lg font-semibold tabular-nums focus-visible:ring-2 focus-visible:ring-ring/40",
                      formType === "income"
                        ? "text-emerald-500"
                        : "text-rose-500",
                    )}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {(() => {
                      const amt = parseFloat(formAmount);
                      if (isNaN(amt) || amt <= 0) return null;
                      const rates = getCachedRates();
                      if (!rates) return null;
                      const selAcc = accounts.find(
                        (a) => a.id === formAccountId,
                      );
                      const cur = formCurrency || getDisplayCurrency();
                      const dc = getDisplayCurrency();
                      const parts: string[] = [];
                      if (selAcc && selAcc.currency !== cur) {
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
                      if (dc !== cur && dc !== selAcc?.currency) {
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
                  value={formCurrency || getDisplayCurrency()}
                  onChange={(v) => setFormCurrency(v)}
                  triggerClassName="h-10 w-[118px] shrink-0"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Описание
              </label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Например: Аренда квартиры"
                className="h-10 border-transparent bg-muted/50"
              />
            </div>

            {/* Account + category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Счёт
                </label>
                <AccountSearchSelect
                  accounts={accounts}
                  value={formAccountId}
                  onChange={handleFormAccountChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Категория
                </label>
                <CategorySearchSelect
                  categories={categories}
                  type={formType}
                  value={formCategoryId}
                  onChange={setFormCategoryId}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
                <CalendarDays className="size-3.5 text-primary" />
                Расписание
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/70 p-1">
                {(["weekly", "monthly", "yearly"] as RecurringInterval[]).map(
                  (iv) => (
                    <button
                      key={iv}
                      type="button"
                      onClick={() => setFormInterval(iv)}
                      className={cn(
                        "flex items-center justify-center rounded-md px-1 py-1.5 text-[11px] font-medium transition-all duration-200",
                        formInterval === iv
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {INTERVAL_LABELS[iv]}
                    </button>
                  ),
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {formInterval === "weekly" ? "День недели" : "День месяца"}
                  </label>
                  <Input
                    type="number"
                    value={formDayOfMonth}
                    onChange={(e) => setFormDayOfMonth(e.target.value)}
                    placeholder={formInterval === "weekly" ? "1–7" : "1–31"}
                    min={1}
                    max={formInterval === "weekly" ? 7 : 31}
                    className="h-9 border-transparent bg-muted/50"
                  />
                  <p className="text-[10px] text-muted-foreground/60">
                    {formInterval === "weekly"
                      ? "1 = Пн, 7 = Вс"
                      : "Число месяца (1–31)"}
                  </p>
                </div>
                {formInterval === "yearly" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Месяц
                    </label>
                    <Select
                      value={formMonth}
                      onValueChange={(v) => v && setFormMonth(v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Месяц">
                          {MONTH_NAMES[parseInt(formMonth) - 1]}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_NAMES.map((name, i) => (
                          <SelectItem key={i} value={String(i + 1)}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-xl border bg-card p-3.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    formIsActive
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {formIsActive ? (
                    <Power className="size-4" />
                  ) : (
                    <PowerOff className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Платёж активен</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formIsActive
                      ? "Операции будут создаваться автоматически"
                      : "Платежи не создаются"}
                  </p>
                </div>
              </div>
              <Switch
                checked={formIsActive}
                onCheckedChange={(checked) => setFormIsActive(checked)}
              />
            </div>
          </div>

          <DialogFooter className="m-0 flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="sm" onClick={handleCloseDialog}>
              Отмена
            </Button>
            <Button
              size="sm"
              className="h-10 px-6 font-medium shadow-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingItem ? "Сохранить" : "Создать платёж"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
