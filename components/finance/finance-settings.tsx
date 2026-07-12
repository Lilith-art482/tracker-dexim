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
  Stethoscope,
  Pill,
  Bike,
  Tv,
  Radio,
  Gamepad2,
  Drama,
  Paintbrush,
  Wrench,
  Fuel,
  Building2,
  Baby,
  ToyBrick,
  Sparkles,
  Hand,
  ScrollText,
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
  Package,
  Target,
  Shield,
  ChevronDown,
  ChevronRight,
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

const ICON_GROUPS: {
  name: string;
  color: string;
  items: { value: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    name: "Продукты",
    color: "bg-emerald-500",
    items: [
      { value: "ShoppingCart", label: "Продукты", icon: ShoppingCart },
      { value: "Utensils", label: "Ресторан", icon: Utensils },
      { value: "Coffee", label: "Кофе", icon: Coffee },
    ],
  },
  {
    name: "Дом",
    color: "bg-blue-500",
    items: [
      { value: "Home", label: "Дом", icon: Home },
      { value: "Zap", label: "Электричество", icon: Zap },
      { value: "Wifi", label: "Интернет", icon: Wifi },
      { value: "Wrench", label: "Ремонт", icon: Wrench },
      { value: "ScrollText", label: "Коммуналка", icon: ScrollText },
      { value: "Paintbrush", label: "Краска", icon: Paintbrush },
    ],
  },
  {
    name: "Транспорт",
    color: "bg-orange-500",
    items: [
      { value: "Car", label: "Авто", icon: Car },
      { value: "Fuel", label: "Топливо", icon: Fuel },
      { value: "Train", label: "Поезд", icon: Train },
      { value: "Bus", label: "Автобус", icon: Bus },
      { value: "Plane", label: "Самолёт", icon: Plane },
      { value: "Ship", label: "Корабль", icon: Ship },
      { value: "Bike", label: "Велосипед", icon: Bike },
    ],
  },
  {
    name: "Здоровье",
    color: "bg-pink-500",
    items: [
      { value: "Heart", label: "Здоровье", icon: Heart },
      { value: "Stethoscope", label: "Врач", icon: Stethoscope },
      { value: "Pill", label: "Таблетки", icon: Pill },
      { value: "Dumbbell", label: "Спортзал", icon: Dumbbell },
    ],
  },
  {
    name: "Одежда",
    color: "bg-violet-500",
    items: [
      { value: "Shirt", label: "Одежда", icon: Shirt },
      { value: "Gem", label: "Украшения", icon: Gem },
      { value: "Sparkles", label: "Косметика", icon: Sparkles },
      { value: "Footprints", label: "Обувь", icon: Footprints },
    ],
  },
  {
    name: "Образование",
    color: "bg-indigo-500",
    items: [
      { value: "GraduationCap", label: "Обучение", icon: GraduationCap },
      { value: "BookOpen", label: "Книги", icon: BookOpen },
    ],
  },
  {
    name: "Развлечения",
    color: "bg-amber-500",
    items: [
      { value: "Film", label: "Кино", icon: Film },
      { value: "Music", label: "Музыка", icon: Music },
      { value: "Gamepad2", label: "Игры", icon: Gamepad2 },
      { value: "Ticket", label: "Билеты", icon: Ticket },
      { value: "Drama", label: "Театр", icon: Drama },
    ],
  },
  {
    name: "Связь",
    color: "bg-cyan-500",
    items: [
      { value: "Smartphone", label: "Телефон", icon: Smartphone },
      { value: "Radio", label: "Подписки", icon: Radio },
      { value: "Tv", label: "ТВ", icon: Tv },
    ],
  },
  {
    name: "Социальное",
    color: "bg-teal-500",
    items: [
      { value: "Gift", label: "Подарки", icon: Gift },
      { value: "Baby", label: "Дети", icon: Baby },
      { value: "ToyBrick", label: "Игрушки", icon: ToyBrick },
      { value: "Cat", label: "Животные", icon: Cat },
    ],
  },
  {
    name: "Финансы",
    color: "bg-emerald-500",
    items: [
      { value: "DollarSign", label: "Доход", icon: DollarSign },
      { value: "PiggyBank", label: "Копилка", icon: PiggyBank },
      { value: "Wallet", label: "Кошелёк", icon: Wallet },
      { value: "Landmark", label: "Банк", icon: Landmark },
      { value: "Banknote", label: "Наличные", icon: Banknote },
    ],
  },
  {
    name: "Госуслуги",
    color: "bg-red-500",
    items: [
      { value: "Building2", label: "Госуслуги", icon: Building2 },
      { value: "ScrollText", label: "Документы", icon: ScrollText },
      { value: "AlertTriangle", label: "Штрафы", icon: AlertTriangle },
    ],
  },
  {
    name: "Покупки",
    color: "bg-slate-500",
    items: [
      { value: "ShoppingCart", label: "Покупки", icon: ShoppingCart },
      { value: "Hand", label: "Услуги", icon: Hand },
      { value: "Package", label: "Товары", icon: Package },
    ],
  },
  {
    name: "Прочее",
    color: "bg-slate-500",
    items: [
      { value: "MoreHorizontal", label: "Другое", icon: MoreHorizontal },
      { value: "Award", label: "Достижения", icon: Award },
      { value: "Target", label: "Цель", icon: Target },
      { value: "Shield", label: "Страховка", icon: Shield },
      { value: "Crown", label: "Премиум", icon: Crown },
    ],
  },
];

const ICON_OPTIONS = ICON_GROUPS.flatMap((g) => g.items);

const CATEGORY_GROUPS: {
  id: string;
  name: string;
  icon: string;
  accent: string;
  defaultColor: string;
  categories: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: "expense" | "income";
  }[];
}[] = [
  {
    id: "food",
    name: "Продукты и питание",
    icon: "ShoppingCart",
    accent: "#10b981",
    defaultColor: "emerald",
    categories: [
      {
        id: "cat-food",
        name: "Продукты",
        icon: "ShoppingCart",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-delivery",
        name: "Доставка еды",
        icon: "Coffee",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-restaurants",
        name: "Рестораны / Кафе",
        icon: "Utensils",
        color: "green",
        type: "expense",
      },
    ],
  },
  {
    id: "home",
    name: "Дом и ЖКХ",
    icon: "Home",
    accent: "#3b82f6",
    defaultColor: "blue",
    categories: [
      {
        id: "cat-rent",
        name: "Аренда жилья",
        icon: "Home",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-utilities",
        name: "Коммунальные платежи",
        icon: "ScrollText",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-electricity",
        name: "Электричество",
        icon: "Zap",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-water",
        name: "Вода / Отопление",
        icon: "Wifi",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-internet",
        name: "Интернет",
        icon: "Wifi",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-tv",
        name: "ТВ / Кабельное",
        icon: "Tv",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-repair",
        name: "Ремонт и быт",
        icon: "Wrench",
        color: "orange",
        type: "expense",
      },
    ],
  },
  {
    id: "transport",
    name: "Транспорт",
    icon: "Car",
    accent: "#f97316",
    defaultColor: "orange",
    categories: [
      {
        id: "cat-car",
        name: "Автомобиль",
        icon: "Car",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-fuel",
        name: "Топливо",
        icon: "Fuel",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-car-parts",
        name: "Запчасти / Ремонт",
        icon: "Wrench",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-taxi",
        name: "Такси",
        icon: "Car",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-public-transport",
        name: "Общественный транспорт",
        icon: "Bus",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-train",
        name: "Поезд (билеты)",
        icon: "Train",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-plane",
        name: "Самолёт (билеты)",
        icon: "Plane",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-ship",
        name: "Корабль / Паром",
        icon: "Ship",
        color: "orange",
        type: "expense",
      },
    ],
  },
  {
    id: "health",
    name: "Здоровье и спорт",
    icon: "Heart",
    accent: "#ec4899",
    defaultColor: "pink",
    categories: [
      {
        id: "cat-doctor",
        name: "Врач / Клиника",
        icon: "Stethoscope",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-pharmacy",
        name: "Аптека / Таблетки",
        icon: "Pill",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-treatment",
        name: "Лечение",
        icon: "Heart",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-gym",
        name: "Спортзал / Фитнес",
        icon: "Dumbbell",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-vitamins",
        name: "Витамины",
        icon: "Pill",
        color: "green",
        type: "expense",
      },
    ],
  },
  {
    id: "clothing",
    name: "Одежда и внешность",
    icon: "Shirt",
    accent: "#8b5cf6",
    defaultColor: "violet",
    categories: [
      {
        id: "cat-clothes",
        name: "Одежда",
        icon: "Shirt",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-shoes",
        name: "Обувь",
        icon: "Footprints",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-beauty",
        name: "Салон красоты",
        icon: "Sparkles",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-jewelry",
        name: "Украшения / Бижутерия",
        icon: "Gem",
        color: "purple",
        type: "expense",
      },
      {
        id: "cat-cosmetics",
        name: "Косметика",
        icon: "Sparkles",
        color: "pink",
        type: "expense",
      },
    ],
  },
  {
    id: "entertainment",
    name: "Развлечения и культура",
    icon: "Film",
    accent: "#f59e0b",
    defaultColor: "amber",
    categories: [
      {
        id: "cat-cinema",
        name: "Кино",
        icon: "Film",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-video",
        name: "Видео / Подписки",
        icon: "Tv",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-music",
        name: "Музыка / Подписки",
        icon: "Music",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-theater",
        name: "Театр / Концерты",
        icon: "Drama",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-games",
        name: "Игры / Софт",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-tickets",
        name: "Билеты (мероприятия)",
        icon: "Ticket",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-books",
        name: "Книги",
        icon: "BookOpen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-hobby",
        name: "Хобби",
        icon: "Heart",
        color: "rose",
        type: "expense",
      },
    ],
  },
  {
    id: "education",
    name: "Образование",
    icon: "GraduationCap",
    accent: "#6366f1",
    defaultColor: "indigo",
    categories: [
      {
        id: "cat-courses",
        name: "Курсы / Обучение",
        icon: "GraduationCap",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-books-edu",
        name: "Книги (учебные)",
        icon: "BookOpen",
        color: "indigo",
        type: "expense",
      },
    ],
  },
  {
    id: "digital",
    name: "Цифровые услуги и связь",
    icon: "Smartphone",
    accent: "#06b6d4",
    defaultColor: "cyan",
    categories: [
      {
        id: "cat-mobile",
        name: "Мобильная связь",
        icon: "Smartphone",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-subscriptions",
        name: "Подписки (сервисы)",
        icon: "Radio",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-gadgets",
        name: "Техника / Гаджеты",
        icon: "ShoppingCart",
        color: "cyan",
        type: "expense",
      },
    ],
  },
  {
    id: "social",
    name: "Личное и социальное",
    icon: "Gift",
    accent: "#14b8a6",
    defaultColor: "teal",
    categories: [
      {
        id: "cat-gifts",
        name: "Подарки",
        icon: "Gift",
        color: "teal",
        type: "expense",
      },
      {
        id: "cat-toys",
        name: "Игрушки / Детям",
        icon: "ToyBrick",
        color: "teal",
        type: "expense",
      },
      {
        id: "cat-children",
        name: "Дети (садик, школа, кружки)",
        icon: "Baby",
        color: "teal",
        type: "expense",
      },
      {
        id: "cat-pets",
        name: "Животные",
        icon: "Cat",
        color: "teal",
        type: "expense",
      },
    ],
  },
  {
    id: "government",
    name: "Государственные расходы",
    icon: "Building2",
    accent: "#ef4444",
    defaultColor: "red",
    categories: [
      {
        id: "cat-taxes",
        name: "Налоги",
        icon: "Building2",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-fines",
        name: "Штрафы",
        icon: "AlertTriangle",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-fees",
        name: "Госпошлины",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-enforcement",
        name: "Исполнительное производство",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
    ],
  },
  {
    id: "loans",
    name: "Кредиты и займы",
    icon: "Landmark",
    accent: "#f43f5e",
    defaultColor: "rose",
    categories: [
      {
        id: "cat-mortgage",
        name: "Ипотека",
        icon: "Home",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-loan",
        name: "Потребительский кредит",
        icon: "Landmark",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-car-loan",
        name: "Автокредит",
        icon: "Car",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-microloan",
        name: "Займ",
        icon: "Banknote",
        color: "rose",
        type: "expense",
      },
    ],
  },
  {
    id: "purchases",
    name: "Покупки и услуги",
    icon: "ShoppingCart",
    accent: "#6b7280",
    defaultColor: "slate",
    categories: [
      {
        id: "cat-big-purchases",
        name: "Крупные покупки",
        icon: "Package",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-services",
        name: "Услуги",
        icon: "Hand",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-office",
        name: "Офис / Работа",
        icon: "Building2",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "insurance",
    name: "Страховки",
    icon: "Shield",
    accent: "#84cc16",
    defaultColor: "lime",
    categories: [
      {
        id: "cat-insurance",
        name: "Страхование",
        icon: "Shield",
        color: "lime",
        type: "expense",
      },
    ],
  },
  {
    id: "other",
    name: "Прочее",
    icon: "MoreHorizontal",
    accent: "#9ca3af",
    defaultColor: "slate",
    categories: [
      {
        id: "cat-other",
        name: "Прочие расходы",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "income",
    name: "Доходы",
    icon: "DollarSign",
    accent: "#10b981",
    defaultColor: "emerald",
    categories: [
      {
        id: "cat-salary",
        name: "Зарплата",
        icon: "DollarSign",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-freelance",
        name: "Фриланс / Подработка",
        icon: "Wallet",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-deposit-interest",
        name: "Проценты по вкладам",
        icon: "PiggyBank",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-debt-return",
        name: "Возврат долгов",
        icon: "Banknote",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-bonus",
        name: "Бонусы / Достижения",
        icon: "Award",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-vip",
        name: "Премиум / VIP",
        icon: "Crown",
        color: "emerald",
        type: "income",
      },
    ],
  },
  {
    id: "finance-mgmt",
    name: "Финансовые операции",
    icon: "Banknote",
    accent: "#06b6d4",
    defaultColor: "cyan",
    categories: [
      {
        id: "cat-savings",
        name: "Копилка / Накопления",
        icon: "PiggyBank",
        color: "cyan",
        type: "income",
      },
      {
        id: "cat-cash",
        name: "Кошелёк / Наличные",
        icon: "Wallet",
        color: "cyan",
        type: "income",
      },
      {
        id: "cat-bank-transfer",
        name: "Банк / Переводы между счетами",
        icon: "Landmark",
        color: "cyan",
        type: "income",
      },
    ],
  },
];

const getCategoryGroup = (catName: string) => {
  for (const group of CATEGORY_GROUPS) {
    for (const c of group.categories) {
      if (c.name === catName) return group;
    }
  }
  return CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1];
};

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
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Нет категорий. Создайте первую.
            </p>
          ) : (
            <div className="space-y-5">
              {CATEGORY_GROUPS.map((group) => {
                const groupCats = categories.filter((c) => {
                  const g = getCategoryGroup(c.name);
                  return g.id === group.id;
                });
                if (groupCats.length === 0) return null;
                return (
                  <div key={group.id}>
                    <div
                      className="flex items-center gap-2 mb-2 pb-1.5 border-b"
                      style={{ borderColor: group.accent + "40" }}
                    >
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
                    </div>
                    <div className="space-y-0.5">
                      {groupCats.map((cat) => {
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
                                  "h-6 w-6 rounded flex items-center justify-center shrink-0 text-white",
                                  colorInfo?.bg || "bg-gray-500",
                                )}
                              >
                                {renderIcon(cat.icon, "h-3 w-3")}
                              </div>
                              <span className="text-sm truncate">
                                {cat.name}
                              </span>
                              {cat.type === "income" && (
                                <Badge
                                  variant="default"
                                  className="text-[9px] px-1 py-0 h-3.5 leading-none"
                                >
                                  доход
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0 ml-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEdit(cat)}
                              >
                                <Pencil className="h-3 w-3" />
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
                  </div>
                );
              })}
            </div>
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
              <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                {ICON_GROUPS.map((grp) => (
                  <div key={grp.name}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={cn("h-1.5 w-1.5 rounded-full", grp.color)}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {grp.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {grp.items.map((opt) => (
                        <button
                          key={opt.value}
                          className={cn(
                            "flex flex-col items-center gap-0.5 rounded-md border p-1.5 transition-colors",
                            icon === opt.value
                              ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                              : "border-input hover:bg-muted",
                          )}
                          onClick={() => setIcon(opt.value)}
                        >
                          <opt.icon className="h-4 w-4" />
                          <span className="text-[7px] text-muted-foreground text-center leading-tight">
                            {opt.label}
                          </span>
                        </button>
                      ))}
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
