"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Repeat,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Wallet,
  Tag,
  Calendar,
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
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INTERVAL_LABELS: Record<RecurringInterval, string> = {
  weekly: "Еженедельно",
  monthly: "Ежемесячно",
  yearly: "Ежегодно",
};

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const TYPE_LABELS: Record<string, string> = {
  income: "Доход",
  expense: "Расход",
};

export function FinanceRecurring() {
  const uid = auth.currentUser?.uid || "user-1";

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
  const [formInterval, setFormInterval] =
    useState<RecurringInterval>("monthly");
  const [formDayOfMonth, setFormDayOfMonth] = useState("");
  const [formMonth, setFormMonth] = useState("1");
  const [formIsActive, setFormIsActive] = useState(true);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const filteredCategories = categories.filter((c) => c.type === formType);

  useEffect(() => {
    if (!formAccountId && accounts.length > 0) {
      setFormAccountId(accounts[0].id);
    }
  }, [accounts, formAccountId]);

  useEffect(() => {
    setFormCategoryId("");
  }, [formType]);

  const fetchData = useCallback(async () => {
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

  const openEditDialog = useCallback((item: RecurringTransaction) => {
    setEditingItem(item);
    setFormDescription(item.description);
    setFormType(item.type);
    setFormAmount(String(item.amount));
    setFormAccountId(item.accountId);
    setFormCategoryId(item.categoryId);
    setFormInterval(item.interval);
    setFormDayOfMonth(String(item.dayOfMonth));
    setFormMonth(String(item.month ?? 1));
    setFormIsActive(item.isActive);
    setDialogOpen(true);
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Регулярные платежи
          </h2>
          {items.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.filter((i) => i.isActive).length} активных
            </p>
          )}
        </div>
        <Button size="sm" onClick={openAddDialog}>
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
            return (
              <Card
                key={item.id}
                className={cn(
                  "transition-all hover:shadow-sm",
                  !item.isActive && "opacity-60",
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base font-semibold truncate">
                        {item.description}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant={
                            item.type === "income" ? "default" : "destructive"
                          }
                          className="text-[10px] px-1.5 py-0 h-5"
                        >
                          {item.type === "income" ? (
                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          )}
                          {TYPE_LABELS[item.type]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 font-normal"
                        >
                          <Calendar className="h-2.5 w-2.5 mr-0.5" />
                          {INTERVAL_LABELS[item.interval]}
                          {", "}
                          {item.dayOfMonth}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-5 font-normal",
                            item.isActive
                              ? "text-emerald-600 border-emerald-200"
                              : "text-muted-foreground",
                          )}
                        >
                          {item.isActive ? (
                            <Power className="h-2.5 w-2.5 mr-0.5" />
                          ) : (
                            <PowerOff className="h-2.5 w-2.5 mr-0.5" />
                          )}
                          {item.isActive ? "Активен" : "Неактивен"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold tabular-nums">
                      {item.amount.toLocaleString()} ₽
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 font-normal cursor-pointer transition-colors hover:bg-muted"
                      onClick={() => handleToggleActive(item)}
                    >
                      {item.isActive ? (
                        <Power className="h-3 w-3 mr-0.5 text-emerald-500" />
                      ) : (
                        <PowerOff className="h-3 w-3 mr-0.5 text-muted-foreground" />
                      )}
                      {item.isActive ? "Выключить" : "Включить"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {account && (
                      <span className="flex items-center gap-1">
                        <Wallet className="h-3 w-3" />
                        {account.name}
                      </span>
                    )}
                    {category && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {category.name}
                      </span>
                    )}
                  </div>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              {editingItem
                ? "Редактировать регулярный платёж"
                : "Добавить регулярный платёж"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Основное</h4>
              <div className="space-y-2">
                <label className="text-xs font-medium">Описание</label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Например: Аренда квартиры"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Тип</label>
                  <Select
                    value={formType}
                    onValueChange={(v) => v && setFormType(v as TransactionType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип">
                        {formType === "income" ? (
                          <span className="flex items-center gap-1.5">
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                            Доход
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                            Расход
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">
                        <span className="flex items-center gap-2">
                          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                          Доход
                        </span>
                      </SelectItem>
                      <SelectItem value="expense">
                        <span className="flex items-center gap-2">
                          <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                          Расход
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Сумма</label>
                  <Input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="50000"
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Счёт</label>
                  <Select
                    value={formAccountId}
                    onValueChange={(v) => v && setFormAccountId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите счёт">
                        {accountMap.get(formAccountId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Категория</label>
                  <Select
                    value={formCategoryId}
                    onValueChange={(v) => v && setFormCategoryId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию">
                        {categoryMap.get(formCategoryId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.length === 0 ? (
                        <SelectItem value="__noop" disabled>
                          Нет категорий
                        </SelectItem>
                      ) : (
                        filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Периодичность</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Интервал</label>
                  <Select
                    value={formInterval}
                    onValueChange={(v) =>
                      v && setFormInterval(v as RecurringInterval)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите интервал">
                        {INTERVAL_LABELS[formInterval]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Еженедельно</SelectItem>
                      <SelectItem value="monthly">Ежемесячно</SelectItem>
                      <SelectItem value="yearly">Ежегодно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    {formInterval === "weekly" ? "День недели" : "День месяца"}
                  </label>
                  <Input
                    type="number"
                    value={formDayOfMonth}
                    onChange={(e) => setFormDayOfMonth(e.target.value)}
                    placeholder={formInterval === "weekly" ? "1–7" : "1–31"}
                    min={1}
                    max={formInterval === "weekly" ? 7 : 31}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {formInterval === "weekly"
                      ? "1 = Пн, 7 = Вс"
                      : "Число месяца (1–31)"}
                  </p>
                </div>
              </div>
              {formInterval === "yearly" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium">Месяц</label>
                  <Select
                    value={formMonth}
                    onValueChange={(v) => v && setFormMonth(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите месяц">
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
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                {formIsActive ? (
                  <Power className="h-4 w-4 text-emerald-500" />
                ) : (
                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Активен</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formIsActive
                      ? "Платёж будет создаваться автоматически"
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
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
