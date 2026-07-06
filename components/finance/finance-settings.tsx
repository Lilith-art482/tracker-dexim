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
  Coffee,
  Zap,
  Wifi,
  Shirt,
  Dumbbell,
  BookOpen,
  Music,
  Film,
  Cat,
  Dog,
  Sun,
  Moon,
  Cloud,
  Star,
  Stethoscope,
  Pill,
  Syringe,
  Bike,
  Tent,
  Tv,
  Radio,
  Cable,
  Gamepad2,
  Clapperboard,
  Drama,
  Paintbrush,
  Scissors,
  Wrench,
  Nut,
  Fuel,
  Church,
  Building2,
  TreePine,
  Flower2,
  Baby,
  ToyBrick,
  ShowerHead,
  Lightbulb,
  Flame,
  Snowflake,
  Fan,
  Bug,
  Sparkles,
  Hand,
  ScrollText,
  ChartPie,
  Banknote,
  Landmark,
  Award,
  Crown,
  Gem,
  Ticket,
  Train,
  Bus,
  Ship,
  Footprints,
  Circle,
  Egg,
  Apple,
  Sandwich,
  Beef,
  Milk,
  Candy,
  Wine,
  Beer,
  ChefHat,
  Soup,
  Cookie,
  CupSoda,
  EyeOff,
} from "lucide-react";
import type { TransactionCategory, FinanceAccount } from "@/lib/finance-types";
import { CURRENCIES } from "@/lib/finance-types";
import {
  getCategoriesByUser,
  createCategory,
  deleteCategory,
  getAccountsByUser,
} from "@/lib/finance-client";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
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
import { HideModulesDialog } from "@/components/finance/hide-modules-dialog";

const COLORS = [
  { value: "red", bg: "bg-red-500", label: "Красный" },
  { value: "blue", bg: "bg-blue-500", label: "Синий" },
  { value: "green", bg: "bg-green-500", label: "Зелёный" },
  { value: "yellow", bg: "bg-yellow-500", label: "Жёлтый" },
  { value: "purple", bg: "bg-purple-500", label: "Фиолетовый" },
  { value: "pink", bg: "bg-pink-500", label: "Розовый" },
  { value: "orange", bg: "bg-orange-500", label: "Оранжевый" },
  { value: "teal", bg: "bg-teal-500", label: "Бирюзовый" },
  { value: "indigo", bg: "bg-indigo-500", label: "Индиго" },
  { value: "cyan", bg: "bg-cyan-500", label: "Голубой" },
  { value: "lime", bg: "bg-lime-500", label: "Лаймовый" },
  { value: "amber", bg: "bg-amber-500", label: "Янтарный" },
  { value: "violet", bg: "bg-violet-500", label: "Сиреневый" },
  { value: "rose", bg: "bg-rose-500", label: "Розовый" },
  { value: "fuchsia", bg: "bg-fuchsia-500", label: "Фуксия" },
  { value: "slate", bg: "bg-slate-500", label: "Серый" },
];

const ICON_OPTIONS: {
  value: string;
  label: string;
  icon: React.ElementType;
}[] = [
  // Еда и напитки
  { value: "Utensils", label: "Еда", icon: Utensils },
  { value: "Coffee", label: "Кофе", icon: Coffee },
  { value: "CupSoda", label: "Напитки", icon: CupSoda },
  { value: "Apple", label: "Фрукты", icon: Apple },
  { value: "Sandwich", label: "Сэндвич", icon: Sandwich },
  { value: "Beef", label: "Мясо", icon: Beef },
  { value: "Milk", label: "Молоко", icon: Milk },
  { value: "Candy", label: "Сладости", icon: Candy },
  { value: "Cookie", label: "Печенье", icon: Cookie },
  { value: "Egg", label: "Яйца", icon: Egg },
  { value: "Soup", label: "Суп", icon: Soup },
  { value: "ChefHat", label: "Готовка", icon: ChefHat },
  { value: "Wine", label: "Вино", icon: Wine },
  { value: "Beer", label: "Пиво", icon: Beer },
  // Дом и быт
  { value: "Home", label: "Дом", icon: Home },
  { value: "Zap", label: "Электричество", icon: Zap },
  { value: "Flame", label: "Отопление", icon: Flame },
  { value: "Snowflake", label: "Кондиционер", icon: Snowflake },
  { value: "Fan", label: "Вентиляция", icon: Fan },
  { value: "Lightbulb", label: "Лампочка", icon: Lightbulb },
  { value: "ShowerHead", label: "Вода", icon: ShowerHead },
  { value: "Wifi", label: "Интернет", icon: Wifi },
  { value: "Cable", label: "Кабельное", icon: Cable },
  { value: "Radio", label: "Радио", icon: Radio },
  { value: "Tv", label: "Телевидение", icon: Tv },
  { value: "ScrollText", label: "Коммуналка", icon: ScrollText },
  { value: "Wrench", label: "Ремонт", icon: Wrench },
  { value: "Paintbrush", label: "Краска", icon: Paintbrush },
  { value: "Scissors", label: "Ножницы", icon: Scissors },
  { value: "Bug", label: "Дератизация", icon: Bug },
  { value: "Sparkles", label: "Уборка", icon: Sparkles },
  // Транспорт
  { value: "Car", label: "Автомобиль", icon: Car },
  { value: "Bike", label: "Велосипед", icon: Bike },
  { value: "Tent", label: "Мотоцикл", icon: Tent },
  { value: "Fuel", label: "Топливо", icon: Fuel },
  { value: "Nut", label: "Запчасти", icon: Nut },
  { value: "Train", label: "Поезд", icon: Train },
  { value: "Bus", label: "Автобус", icon: Bus },
  { value: "Ship", label: "Корабль", icon: Ship },
  { value: "Plane", label: "Самолёт", icon: Plane },
  { value: "Footprints", label: "Пешком", icon: Footprints },
  // Здоровье
  { value: "Heart", label: "Здоровье", icon: Heart },
  { value: "Stethoscope", label: "Врач", icon: Stethoscope },
  { value: "Pill", label: "Таблетки", icon: Pill },
  { value: "Syringe", label: "Уколы", icon: Syringe },
  { value: "Dumbbell", label: "Спортзал", icon: Dumbbell },
  // Одежда
  { value: "Shirt", label: "Одежда", icon: Shirt },
  { value: "Gem", label: "Украшения", icon: Gem },
  // Образование
  { value: "GraduationCap", label: "Образование", icon: GraduationCap },
  { value: "BookOpen", label: "Книги", icon: BookOpen },
  // Развлечения
  { value: "Film", label: "Кино", icon: Film },
  { value: "Clapperboard", label: "Видео", icon: Clapperboard },
  { value: "Music", label: "Музыка", icon: Music },
  { value: "Drama", label: "Театр", icon: Drama },
  { value: "Gamepad2", label: "Игры", icon: Gamepad2 },
  { value: "Ticket", label: "Билеты", icon: Ticket },
  { value: "Award", label: "Достижения", icon: Award },
  { value: "Crown", label: "Премиум", icon: Crown },
  // Связь и подписки
  { value: "Smartphone", label: "Телефон", icon: Smartphone },
  { value: "ChartPie", label: "Подписки", icon: ChartPie },
  // Подарки
  { value: "Gift", label: "Подарки", icon: Gift },
  { value: "ToyBrick", label: "Игрушки", icon: ToyBrick },
  { value: "Baby", label: "Дети", icon: Baby },
  // Природа
  { value: "TreePine", label: "Природа", icon: TreePine },
  { value: "Flower2", label: "Цветы", icon: Flower2 },
  { value: "Cat", label: "Кошка", icon: Cat },
  { value: "Dog", label: "Собака", icon: Dog },
  // Финансы
  { value: "DollarSign", label: "Зарплата", icon: DollarSign },
  { value: "PiggyBank", label: "Копилка", icon: PiggyBank },
  { value: "Wallet", label: "Кошелёк", icon: Wallet },
  { value: "Banknote", label: "Наличные", icon: Banknote },
  { value: "Landmark", label: "Банк", icon: Landmark },
  // Прочее
  { value: "ShoppingCart", label: "Покупки", icon: ShoppingCart },
  { value: "Hand", label: "Услуги", icon: Hand },
  { value: "Building2", label: "Офис", icon: Building2 },
  { value: "Church", label: "Религия", icon: Church },
  { value: "Circle", label: "Цель", icon: Circle },
  { value: "Cloud", label: "Облако", icon: Cloud },
  { value: "Sun", label: "Солнце", icon: Sun },
  { value: "Moon", label: "Луна", icon: Moon },
  { value: "Star", label: "Звезда", icon: Star },
  { value: "MoreHorizontal", label: "Другое", icon: MoreHorizontal },
];

const FIAT_CURRENCIES = CURRENCIES.filter((c) => c.type === "fiat");

interface Props {
  onVisibilityChange?: () => void;
}

export function FinanceSettings({ onVisibilityChange }: Props) {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<TransactionCategory | null>(
    null,
  );
  const [defaultAccount, setDefaultAccount] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [name, setName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("MoreHorizontal");
  const uid = auth.currentUser?.uid || "user-1";

  useEffect(() => {
    setDefaultAccount(localStorage.getItem("finance_default_account") || "");
    setCurrency(localStorage.getItem("finance_currency") || "RUB");
    Promise.all([getCategoriesByUser(uid), getAccountsByUser(uid)]).then(
      ([cats, accts]) => {
        setCategories(cats);
        setAccounts(accts);
        setLoading(false);
      },
    );
  }, [uid]);

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
    const body = { userId: uid, name: name.trim(), type: catType, color, icon };
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
  }, [name, catType, color, icon, editingCat, uid]);

  const handleDeleteCategory = useCallback(async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Категория удалена");
    } catch {
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
    const data = JSON.stringify(
      { categories, accounts, currency, defaultAccount },
      null,
      2,
    );
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
          setCategories([]);
          setDefaultAccount("");
          setCurrency("RUB");
          toast.success("Данные сброшены");
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  }, []);

  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const opt = ICON_OPTIONS.find((i) => i.value === iconName);
    if (!opt) return <MoreHorizontal className={className} />;
    const Icon = opt.icon;
    return <Icon className={className} />;
  };

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Основные настройки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label className="text-sm font-medium sm:w-36">Валюта</label>
            <Select
              value={currency}
              onValueChange={(v) => v && saveCurrency(v)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {FIAT_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <label className="text-sm font-medium sm:w-36">
              Счёт по умолчанию
            </label>
            <Select
              value={defaultAccount}
              onValueChange={(v) => v && saveDefaultAccount(v)}
            >
              <SelectTrigger className="w-full sm:w-60">
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
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => {
              const colorInfo = COLORS.find((c) => c.value === cat.color);
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors border border-border/40"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        colorInfo?.bg || "bg-gray-500",
                      )}
                    >
                      <span className="text-white">
                        {renderIcon(cat.icon, "h-4 w-4")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{cat.name}</p>
                      <Badge
                        variant={
                          cat.type === "income" ? "default" : "secondary"
                        }
                        className="text-[10px] px-1.5 py-0 h-4 mt-0.5"
                      >
                        {cat.type === "income" ? "доход" : "расход"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
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
              );
            })}
          </div>
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

      {/* Управление данными */}
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

      {/* Диалог скрытия пунктов */}
      <HideModulesDialog
        open={showHideDialog}
        onOpenChange={setShowHideDialog}
        onSave={() => onVisibilityChange?.()}
      />

      {/* Диалог категории */}
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
                onValueChange={(v) =>
                  v && setCatType(v as "income" | "expense")
                }
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
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      c.bg,
                      color === c.value &&
                        "ring-2 ring-offset-2 ring-foreground",
                    )}
                    onClick={() => setColor(c.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Иконка</label>
              <div className="grid grid-cols-4 gap-1.5 max-h-[200px] overflow-y-auto">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors",
                      icon === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-input hover:bg-muted",
                    )}
                    onClick={() => setIcon(opt.value)}
                  >
                    <opt.icon className="h-5 w-5" />
                    <span className="text-[9px] text-muted-foreground text-center leading-tight">
                      {opt.label}
                    </span>
                  </button>
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
