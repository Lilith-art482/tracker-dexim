"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Palette,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
  Globe,
  Wallet,
  ShoppingCart,
  Home,
  Car,
  Heart,
  GraduationCap,
  Plane,
  Smartphone,
  Gift,
  Utensils,
  MoreHorizontal,
  DollarSign,
  PiggyBank,
} from "lucide-react";
import type { TransactionCategory, FinanceAccount } from "@/lib/finance-types";
import { mockFinanceCategories, mockFinanceAccounts } from "@/lib/finance-mock";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = [
  { value: "red", bg: "bg-red-500" },
  { value: "blue", bg: "bg-blue-500" },
  { value: "green", bg: "bg-green-500" },
  { value: "yellow", bg: "bg-yellow-500" },
  { value: "purple", bg: "bg-purple-500" },
  { value: "pink", bg: "bg-pink-500" },
  { value: "orange", bg: "bg-orange-500" },
  { value: "teal", bg: "bg-teal-500" },
];

const ICON_OPTIONS = [
  "ShoppingCart",
  "Home",
  "Car",
  "Heart",
  "GraduationCap",
  "Plane",
  "Smartphone",
  "Gift",
  "Utensils",
  "MoreHorizontal",
];

const CURRENCIES = ["RUB", "USD", "EUR", "KZT"];

export function FinanceSettings() {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<TransactionCategory | null>(null);
  const [defaultAccount, setDefaultAccount] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [name, setName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("MoreHorizontal");

  useEffect(() => {
    setDefaultAccount(localStorage.getItem("finance_default_account") || "");
    setCurrency(localStorage.getItem("finance_currency") || "RUB");
    Promise.all([
      fetch("/api/finance/categories").then((r) =>
        r.ok ? r.json() : mockFinanceCategories,
      ),
      fetch("/api/finance/accounts").then((r) =>
        r.ok ? r.json() : mockFinanceAccounts,
      ),
    ]).then(([cats, accts]) => {
      setCategories(Array.isArray(cats) ? cats : cats?.categories || mockFinanceCategories);
      setAccounts(Array.isArray(accts) ? accts : accts?.accounts || mockFinanceAccounts);
      setLoading(false);
    });
  }, []);

  const saveCurrency = useCallback((val: string) => {
    setCurrency(val);
    localStorage.setItem("finance_currency", val);
    toast.success("Валюта сохранена");
  }, []);

  const saveDefaultAccount = useCallback((val: string) => {
    setDefaultAccount(val);
    localStorage.setItem("finance_default_account", val);
    toast.success("Счёт по умолчанию сохранён");
  }, []);

  const handleSaveCategory = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Введите название категории");
      return;
    }
    const body = { name: name.trim(), type: catType, color, icon };
    if (editingCat) {
      const res = await fetch(`/api/finance/categories?id=${editingCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCat.id ? { ...c, ...body } : c)),
        );
        toast.success("Категория обновлена");
      } else {
        toast.error("Ошибка при обновлении");
      }
    } else {
      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories((prev) => [...prev, data]);
        toast.success("Категория создана");
      } else {
        toast.error("Ошибка при создании");
      }
    }
    setShowDialog(false);
    setEditingCat(null);
    setName("");
    setCatType("expense");
    setColor("blue");
    setIcon("MoreHorizontal");
  }, [name, catType, color, icon, editingCat]);

  const handleDeleteCategory = useCallback(async (id: string) => {
    const res = await fetch(`/api/finance/categories?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Категория удалена");
    } else {
      toast.error("Ошибка при удалении");
    }
  }, []);

  const openEdit = useCallback((cat: TransactionCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setCatType(cat.type as "income" | "expense");
    setColor(cat.color);
    setIcon(cat.icon);
    setShowDialog(true);
  }, []);

  const openAdd = useCallback(() => {
    setEditingCat(null);
    setName("");
    setCatType("expense");
    setColor("blue");
    setIcon("MoreHorizontal");
    setShowDialog(true);
  }, []);

  const exportAll = useCallback(() => {
    const data = JSON.stringify({ categories, accounts, currency, defaultAccount }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспорт завершён");
  }, [categories, accounts, currency, defaultAccount]);

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
        if (data.defaultAccount) saveDefaultAccount(data.defaultAccount);
        toast.success("Данные импортированы");
      } catch {
        toast.error("Ошибка при импорте");
      }
    };
    input.click();
  }, [saveCurrency, saveDefaultAccount]);

  const resetAll = useCallback(() => {
    toast("Сбросить все данные?", {
      action: {
        label: "Сбросить",
        onClick: () => {
          localStorage.removeItem("finance_default_account");
          localStorage.removeItem("finance_currency");
          setCategories(mockFinanceCategories);
          setDefaultAccount("");
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Основные настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32">Валюта</label>
            <Select value={currency} onValueChange={(v) => v && saveCurrency(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32">Счёт по умолчанию</label>
            <Select value={defaultAccount} onValueChange={(v) => v && saveDefaultAccount(v)}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Не выбран" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} — {a.balance.toLocaleString()} ₽
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
          <div className="space-y-1">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      COLORS.find((c) => c.value === cat.color)?.bg,
                    )}
                  />
                  <Badge
                    variant={cat.type === "income" ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {cat.type === "income" ? "доход" : "расход"}
                  </Badge>
                  <span className="text-sm">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Управление данными
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={exportAll}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Экспорт всех данных
            </Button>
            <Button variant="outline" size="sm" onClick={importAll}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Импорт данных
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={resetAll}
          >
            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
            Сбросить все данные
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Редактировать категорию" : "Новая категория"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Название</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Продукты"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Тип</label>
              <Select
                value={catType}
                onValueChange={(v) => v && setCatType(v as "income" | "expense")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Расход</SelectItem>
                  <SelectItem value="income">Доход</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Цвет</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      c.bg,
                      color === c.value && "ring-2 ring-offset-2 ring-foreground",
                    )}
                    onClick={() => setColor(c.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Иконка</label>
              <Select value={icon} onValueChange={(v) => v && setIcon(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((ic) => (
                    <SelectItem key={ic} value={ic}>
                      {ic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
