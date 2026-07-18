"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  TrendingDown,
  TrendingUp,
  EyeOff,
  Check,
  Search,
  Briefcase,
  Key,
  Percent,
  Receipt,
  RefreshCw,
  Backpack,
  Cake,
  Camera,
  Cloud,
  CreditCard,
  Dices,
  Droplets,
  Flame,
  Flower2,
  Glasses,
  Gavel,
  Hammer,
  Lock,
  Luggage,
  Monitor,
  ParkingCircle,
  PartyPopper,
  Pen,
  Puzzle,
  Sandwich,
  School,
  Scooter,
  Sofa,
  Soup,
  Syringe,
  Umbrella,
  Calendar,
  Snowflake,
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
  { value: "slate", bg: "bg-slate-500", label: "Серый" },
];

const ICON_GROUPS: {
  name: string;
  color: string;
  type: "expense" | "income" | "both";
  items: { value: string; label: string; icon: React.ElementType }[];
}[] = [
  {
    name: "Продукты",
    color: "bg-emerald-500",
    type: "expense",
    items: [
      { value: "ShoppingCart", label: "Магазин", icon: ShoppingCart },
      { value: "Utensils", label: "Ресторан", icon: Utensils },
      { value: "Coffee", label: "Кофе", icon: Coffee },
      { value: "Soup", label: "Столовая", icon: Soup },
      { value: "Sandwich", label: "Фастфуд", icon: Sandwich },
      { value: "Cake", label: "Кондитерская", icon: Cake },
    ],
  },
  {
    name: "Дом",
    color: "bg-blue-500",
    type: "expense",
    items: [
      { value: "Home", label: "Дом", icon: Home },
      { value: "Zap", label: "Электричество", icon: Zap },
      { value: "Wrench", label: "Ремонт", icon: Wrench },
      { value: "ScrollText", label: "Коммуналка", icon: ScrollText },
      { value: "Droplets", label: "Вода", icon: Droplets },
      { value: "Flame", label: "Отопление/Газ", icon: Flame },
      { value: "Trash2", label: "Мусор", icon: Trash2 },
      { value: "Sofa", label: "Мебель", icon: Sofa },
      { value: "Flower2", label: "Растение", icon: Flower2 },
      { value: "Hammer", label: "Стройматериалы", icon: Hammer },
      { value: "Paintbrush", label: "Декор", icon: Paintbrush },
    ],
  },
  {
    name: "Транспорт",
    color: "bg-orange-500",
    type: "expense",
    items: [
      { value: "Car", label: "Авто", icon: Car },
      { value: "Fuel", label: "Топливо", icon: Fuel },
      { value: "Train", label: "Поезд", icon: Train },
      { value: "Bus", label: "Автобус", icon: Bus },
      { value: "Plane", label: "Самолёт", icon: Plane },
      { value: "Ship", label: "Корабль", icon: Ship },
      { value: "Bike", label: "Велосипед", icon: Bike },
      { value: "Scooter", label: "Самокат", icon: Scooter },
      { value: "Shield", label: "Мотоцикл", icon: Shield },
      { value: "ParkingCircle", label: "Парковка", icon: ParkingCircle },
      { value: "Gavel", label: "Штрафы", icon: Gavel },
    ],
  },
  {
    name: "Здоровье",
    color: "bg-pink-500",
    type: "expense",
    items: [
      { value: "Heart", label: "Здоровье", icon: Heart },
      { value: "Stethoscope", label: "Врач", icon: Stethoscope },
      { value: "Pill", label: "Таблетки", icon: Pill },
      { value: "Dumbbell", label: "Спортзал", icon: Dumbbell },
      { value: "Pill", label: "Анализы", icon: Pill },
      { value: "Syringe", label: "Вакцинация", icon: Syringe },
      { value: "Droplets", label: "Бассейн", icon: Droplets },
    ],
  },
  {
    name: "Одежда",
    color: "bg-violet-500",
    type: "expense",
    items: [
      { value: "Shirt", label: "Одежда", icon: Shirt },
      { value: "Gem", label: "Украшения", icon: Gem },
      { value: "Sparkles", label: "Косметика", icon: Sparkles },
      { value: "Footprints", label: "Обувь", icon: Footprints },
      { value: "Backpack", label: "Рюкзак", icon: Backpack },
      { value: "Luggage", label: "Чемодан", icon: Luggage },
      { value: "Glasses", label: "Очки", icon: Glasses },
      { value: "Umbrella", label: "Зонт", icon: Umbrella },
    ],
  },
  {
    name: "Образование",
    color: "bg-indigo-500",
    type: "expense",
    items: [
      { value: "GraduationCap", label: "Обучение", icon: GraduationCap },
      { value: "BookOpen", label: "Книги", icon: BookOpen },
      { value: "School", label: "Школа/Вуз", icon: School },
      { value: "Pen", label: "Канцелярия", icon: Pen },
    ],
  },
  {
    name: "Развлечения",
    color: "bg-amber-500",
    type: "expense",
    items: [
      { value: "Film", label: "Кино", icon: Film },
      { value: "Music", label: "Музыка", icon: Music },
      { value: "Gamepad2", label: "Игры", icon: Gamepad2 },
      { value: "Ticket", label: "Билеты", icon: Ticket },
      { value: "Drama", label: "Театр", icon: Drama },
      { value: "Dices", label: "Настольные игры", icon: Dices },
      { value: "Puzzle", label: "Пазлы", icon: Puzzle },
      { value: "Camera", label: "Фото", icon: Camera },
      { value: "PartyPopper", label: "Праздники", icon: PartyPopper },
    ],
  },
  {
    name: "Связь",
    color: "bg-cyan-500",
    type: "expense",
    items: [
      { value: "Smartphone", label: "Телефон", icon: Smartphone },
      { value: "Radio", label: "Подписки", icon: Radio },
      { value: "Tv", label: "ТВ", icon: Tv },
      { value: "Wifi", label: "Интернет", icon: Wifi },
      { value: "Monitor", label: "Серверы", icon: Monitor },
      { value: "Cloud", label: "Облака", icon: Cloud },
      { value: "Lock", label: "Сигнализация", icon: Lock },
    ],
  },
  {
    name: "Кредиты",
    color: "bg-rose-500",
    type: "expense",
    items: [
      { value: "Landmark", label: "Кредит", icon: Landmark },
      { value: "CreditCard", label: "Карта", icon: CreditCard },
      { value: "Percent", label: "Проценты", icon: Percent },
      { value: "Banknote", label: "Займ", icon: Banknote },
      { value: "Car", label: "Автокредит", icon: Car },
      { value: "Home", label: "Ипотека", icon: Home },
    ],
  },
  {
    name: "Социальное",
    color: "bg-teal-500",
    type: "expense",
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
    type: "income",
    items: [
      { value: "DollarSign", label: "Доход", icon: DollarSign },
      { value: "PiggyBank", label: "Копилка", icon: PiggyBank },
      { value: "Wallet", label: "Кошелёк", icon: Wallet },
      { value: "Landmark", label: "Банк", icon: Landmark },
      { value: "Banknote", label: "Наличные", icon: Banknote },
    ],
  },
  {
    name: "Зарплата",
    color: "bg-emerald-500",
    type: "income",
    items: [
      { value: "DollarSign", label: "Зарплата", icon: DollarSign },
      { value: "DollarSign", label: "Оклад", icon: DollarSign },
      { value: "Wallet", label: "Аванс", icon: Wallet },
      { value: "Award", label: "Премия", icon: Award },
      { value: "Briefcase", label: "Подработка", icon: Briefcase },
      { value: "Percent", label: "Проценты", icon: Percent },
    ],
  },
  {
    name: "Инвестиции",
    color: "bg-emerald-500",
    type: "income",
    items: [
      { value: "TrendingUp", label: "Доход", icon: TrendingUp },
      { value: "PiggyBank", label: "Вклады", icon: PiggyBank },
      { value: "Crown", label: "Роялти/Гонорар", icon: Crown },
      { value: "RefreshCw", label: "Кэшбэк", icon: RefreshCw },
    ],
  },
  {
    name: "Выплаты",
    color: "bg-teal-500",
    type: "income",
    items: [
      { value: "GraduationCap", label: "Стипендия", icon: GraduationCap },
      { value: "Baby", label: "Пособия", icon: Baby },
      { value: "Shield", label: "Страховка", icon: Shield },
      { value: "Heart", label: "Соцподдержка", icon: Heart },
      { value: "ScrollText", label: "Налоговое", icon: ScrollText },
    ],
  },
  {
    name: "Недвижимость",
    color: "bg-blue-500",
    type: "income",
    items: [
      { value: "Key", label: "Аренда", icon: Key },
      { value: "Building2", label: "Продажа", icon: Building2 },
      { value: "Package", label: "Товары", icon: Package },
    ],
  },
  {
    name: "Прочие доходы",
    color: "bg-amber-500",
    type: "income",
    items: [
      { value: "Gift", label: "Подарки", icon: Gift },
      { value: "Gem", label: "Выигрыши", icon: Gem },
      { value: "Search", label: "Находка", icon: Search },
      { value: "Landmark", label: "Кредит/Займ", icon: Landmark },
      { value: "Hand", label: "Компенсация", icon: Hand },
      { value: "Receipt", label: "Налоговый вычет", icon: Receipt },
    ],
  },
  {
    name: "Госуслуги",
    color: "bg-red-500",
    type: "expense",
    items: [
      { value: "Building2", label: "Госуслуги", icon: Building2 },
      { value: "ScrollText", label: "Документы", icon: ScrollText },
      { value: "AlertTriangle", label: "Штрафы", icon: AlertTriangle },
      { value: "Landmark", label: "Регистрация", icon: Landmark },
      { value: "Globe", label: "Виза/Паспорт", icon: Globe },
    ],
  },
  {
    name: "Покупки",
    color: "bg-slate-500",
    type: "expense",
    items: [
      { value: "ShoppingCart", label: "Покупки", icon: ShoppingCart },
      { value: "Hand", label: "Услуги", icon: Hand },
      { value: "Package", label: "Товары", icon: Package },
    ],
  },
  {
    name: "Прочее",
    color: "bg-slate-500",
    type: "both",
    items: [
      { value: "MoreHorizontal", label: "Другое", icon: MoreHorizontal },
      { value: "Award", label: "Достижения", icon: Award },
      { value: "Target", label: "Цель", icon: Target },
      { value: "Shield", label: "Страховка", icon: Shield },
      { value: "Crown", label: "Премиум", icon: Crown },
      { value: "CreditCard", label: "Кредитка", icon: CreditCard },
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
        id: "cat-grocery",
        name: "Магазин",
        icon: "ShoppingCart",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-food-delivery",
        name: "Доставка продуктов",
        icon: "ShoppingCart",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-meal-delivery",
        name: "Доставка готовой еды",
        icon: "Utensils",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-coffee-shop",
        name: "Кофейня",
        icon: "Coffee",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-cafe",
        name: "Кафе",
        icon: "Coffee",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-canteen",
        name: "Столовая",
        icon: "Soup",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-restaurant",
        name: "Ресторан",
        icon: "Utensils",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-fastfood",
        name: "Фастфуд",
        icon: "Sandwich",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-vending",
        name: "Вендинг",
        icon: "Coffee",
        color: "emerald",
        type: "expense",
      },
      {
        id: "cat-confectionery",
        name: "Кондитерская",
        icon: "Cake",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-food-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "home",
    name: "Дом",
    icon: "Home",
    accent: "#3b82f6",
    defaultColor: "blue",
    categories: [
      {
        id: "cat-rent",
        name: "Аренда",
        icon: "Home",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-utilities",
        name: "ЖКУ",
        icon: "ScrollText",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-electricity",
        name: "Электроэнергия",
        icon: "Zap",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-cold-water",
        name: "Водоснабжение (холодная вода)",
        icon: "Droplets",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-hot-water",
        name: "Горячая вода",
        icon: "Droplets",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-heating",
        name: "Отопление / Тепло",
        icon: "Flame",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-gas",
        name: "Газ",
        icon: "Flame",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-trash",
        name: "Вывоз мусора / ТКО",
        icon: "Trash2",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-major-repair",
        name: "Капитальный ремонт (взносы в фонд)",
        icon: "Wrench",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-home-maintenance",
        name: "Содержание и ремонт жилья",
        icon: "Wrench",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-common-areas",
        name: "Общедомовые нужды",
        icon: "ScrollText",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-heated-floor",
        name: "Теплый пол",
        icon: "Flame",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-cleaning",
        name: "Бытовая химия",
        icon: "Sparkles",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-furniture",
        name: "Мебель",
        icon: "Sofa",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-home-accessories",
        name: "Аксессуары",
        icon: "Gem",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-building-materials",
        name: "Стройматериалы",
        icon: "Hammer",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-appliances",
        name: "Бытовая техника",
        icon: "Zap",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-plant",
        name: "Растение",
        icon: "Flower2",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-home-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "connectivity",
    name: "Связь и информационные услуги",
    icon: "Smartphone",
    accent: "#06b6d4",
    defaultColor: "cyan",
    categories: [
      {
        id: "cat-internet",
        name: "Интернет",
        icon: "Wifi",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-mobile",
        name: "Мобильная связь",
        icon: "Smartphone",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-cable-tv",
        name: "Кабельное / Цифровое ТВ",
        icon: "Tv",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-antenna",
        name: "Антенна",
        icon: "Radio",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-subscriptions",
        name: "Подписки",
        icon: "Radio",
        color: "purple",
        type: "expense",
      },
      {
        id: "cat-intercom",
        name: "Домофон (абонентская плата)",
        icon: "Smartphone",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-phone",
        name: "Телефон (абонентская плата)",
        icon: "Smartphone",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-alarm",
        name: "Охранная сигнализация (мониторинг)",
        icon: "Lock",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-cloud",
        name: "Облачные хранилища",
        icon: "Cloud",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-vpn",
        name: "VPN",
        icon: "Lock",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-servers",
        name: "Серверы",
        icon: "Monitor",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-connectivity-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
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
        id: "cat-transit-pass",
        name: "Проездной",
        icon: "Bus",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-car",
        name: "Авто",
        icon: "Car",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-bicycle",
        name: "Велосипед",
        icon: "Bike",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-scooter",
        name: "Самокат",
        icon: "Scooter",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-kicksharing",
        name: "Кикшеринг",
        icon: "Scooter",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-carsharing",
        name: "Каршеринг",
        icon: "Car",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-motorcycle",
        name: "Мотоцикл",
        icon: "Shield",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-train",
        name: "Поезд/электричка",
        icon: "Train",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-metro",
        name: "Метро",
        icon: "Train",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-tram",
        name: "Трамвай",
        icon: "Train",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-trolleybus",
        name: "Троллейбус",
        icon: "Bus",
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
        id: "cat-plane",
        name: "Самолет",
        icon: "Plane",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-ship",
        name: "Корабль",
        icon: "Ship",
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
        id: "cat-parking",
        name: "Платные парковки",
        icon: "ParkingCircle",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-traffic-fines",
        name: "Штрафы ГИБДД",
        icon: "Gavel",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-tolls",
        name: "Платные дороги",
        icon: "Car",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-car-wash",
        name: "Мойка",
        icon: "Droplets",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-car-service",
        name: "ТО",
        icon: "Wrench",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-car-repair",
        name: "Ремонт",
        icon: "Wrench",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-car-insurance",
        name: "Страховка",
        icon: "Shield",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-transport-tax",
        name: "Транспортный налог",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-tow-truck",
        name: "Эвакуатор",
        icon: "Car",
        color: "orange",
        type: "expense",
      },
      {
        id: "cat-transport-accessories",
        name: "Аксессуары",
        icon: "Gem",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-transport-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "health",
    name: "Медицина и здоровье",
    icon: "Heart",
    accent: "#ec4899",
    defaultColor: "pink",
    categories: [
      {
        id: "cat-doctor",
        name: "Врач (прием, консультация)",
        icon: "Stethoscope",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-medication",
        name: "Таблетки (лекарства, витамины, БАДы)",
        icon: "Pill",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-gym",
        name: "Спортзал (абонемент, разовые посещения)",
        icon: "Dumbbell",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-lab-tests",
        name: "Анализы",
        icon: "Pill",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-pharmacy",
        name: "Аптека",
        icon: "Pill",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-massage",
        name: "Массаж",
        icon: "Heart",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-physiotherapy",
        name: "Физиотерапия",
        icon: "Heart",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-rehab",
        name: "Реабилитация / ЛФК",
        icon: "Heart",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-swimming-pool",
        name: "Бассейн (абонемент или разовое посещение)",
        icon: "Droplets",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-vaccination",
        name: "Вакцинация",
        icon: "Syringe",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-day-hospital",
        name: "Дневной стационар",
        icon: "Stethoscope",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-home-doctor",
        name: "Домашний вызов врача",
        icon: "Stethoscope",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-ambulance",
        name: "Скорая помощь",
        icon: "Heart",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-sanatorium",
        name: "Санаторий / Профилакторий",
        icon: "Heart",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-vitamins",
        name: "Витаминно-минеральные комплексы",
        icon: "Pill",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-procedures",
        name: "Процедуры",
        icon: "Stethoscope",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-health-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "clothing",
    name: "Одежда и аксессуары",
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
        id: "cat-jewelry",
        name: "Украшения",
        icon: "Gem",
        color: "purple",
        type: "expense",
      },
      {
        id: "cat-bags",
        name: "Сумки",
        icon: "Luggage",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-backpacks",
        name: "Рюкзаки",
        icon: "Backpack",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-luggage",
        name: "Чемоданы / Дорожные сумки",
        icon: "Luggage",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-belts",
        name: "Ремни",
        icon: "Shirt",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-ties",
        name: "Галстуки / Бабочки",
        icon: "Shirt",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-scarves",
        name: "Шарфы / Платки",
        icon: "Shirt",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-gloves",
        name: "Перчатки / Варежки",
        icon: "Shirt",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-hats",
        name: "Шапки / Кепки / Панамы",
        icon: "Shirt",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-socks",
        name: "Носки / Колготки / Чулки",
        icon: "Footprints",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-underwear",
        name: "Нижнее белье",
        icon: "Shirt",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-swimwear",
        name: "Купальники / Плавки",
        icon: "Shirt",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-sportswear",
        name: "Спортивная форма",
        icon: "Shirt",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-pajamas",
        name: "Пижамы / Домашняя одежда",
        icon: "Shirt",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-robes",
        name: "Халаты",
        icon: "Shirt",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-kids-clothes",
        name: "Детская одежда",
        icon: "Baby",
        color: "teal",
        type: "expense",
      },
      {
        id: "cat-hair-accessories",
        name: "Аксессуары для волос",
        icon: "Sparkles",
        color: "pink",
        type: "expense",
      },
      {
        id: "cat-sunglasses",
        name: "Очки солнцезащитные",
        icon: "Glasses",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-umbrellas",
        name: "Зонты",
        icon: "Umbrella",
        color: "blue",
        type: "expense",
      },
      {
        id: "cat-costume-jewelry",
        name: "Бижутерия",
        icon: "Gem",
        color: "purple",
        type: "expense",
      },
      {
        id: "cat-wallets",
        name: "Кошельки / Портмоне",
        icon: "Wallet",
        color: "violet",
        type: "expense",
      },
      {
        id: "cat-clothing-repair",
        name: "Ремонт одежды / обуви (химчистка, мастерская)",
        icon: "Wrench",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-clothing-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
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
        id: "cat-training",
        name: "Обучение",
        icon: "GraduationCap",
        color: "indigo",
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
        id: "cat-textbooks",
        name: "Учебники / Учебные пособия",
        icon: "BookOpen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-stationery",
        name: "Тетради / Блокноты / Письменные принадлежности",
        icon: "Pen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-edu-subscriptions",
        name: "Подписка на образовательные платформы",
        icon: "Radio",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-tutor",
        name: "Репетитор / Преподаватель",
        icon: "GraduationCap",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-language-courses",
        name: "Языковые курсы",
        icon: "BookOpen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-online-school",
        name: "Онлайн-школы / Академии",
        icon: "Monitor",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-university",
        name: "Вуз / Колледж",
        icon: "School",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-school",
        name: "Школа (частная / платные услуги)",
        icon: "School",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-kindergarten",
        name: "Детский сад (платный / частный)",
        icon: "Baby",
        color: "teal",
        type: "expense",
      },
      {
        id: "cat-clubs",
        name: "Кружки / Секции (музыка, спорт, рисование, танцы)",
        icon: "Music",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-exams",
        name: "Экзамены / Тестирование (оплата за сдачу, сертификация)",
        icon: "ScrollText",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-certificates",
        name: "Дипломы / Сертификаты / Свидетельства",
        icon: "ScrollText",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-enrollment-fees",
        name: "Вступительные взносы",
        icon: "Banknote",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-library",
        name: "Библиотека (платный абонемент, штрафы)",
        icon: "BookOpen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-office-supplies",
        name: "Канцелярия (бумага, папки, файлы, степлеры, скрепки)",
        icon: "Pen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-printing",
        name: "Печать / Копирование / Брошюровка",
        icon: "Pen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-flash-drives",
        name: "Портативные накопители (флешки, внешние диски для учебы)",
        icon: "Package",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-edu-apps",
        name: "Образовательные приложения (платные)",
        icon: "Smartphone",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-marathons",
        name: "Марафоны / Интенсивы (образовательные)",
        icon: "GraduationCap",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-conferences",
        name: "Конференции / Семинары (оплата участия)",
        icon: "Ticket",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-driving-school",
        name: "Вождение (автошкола, инструктор)",
        icon: "Car",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-mentor",
        name: "Тьютор / Наставник",
        icon: "GraduationCap",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-after-school",
        name: "Продленка",
        icon: "Baby",
        color: "teal",
        type: "expense",
      },
      {
        id: "cat-edu-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "entertainment",
    name: "Развлечения",
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
        id: "cat-music",
        name: "Музыка",
        icon: "Music",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-games",
        name: "Игры",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-tickets",
        name: "Билеты",
        icon: "Ticket",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-theater",
        name: "Театр",
        icon: "Drama",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-concerts",
        name: "Концерты",
        icon: "Music",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-quests",
        name: "Квесты",
        icon: "Puzzle",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-amusement-rides",
        name: "Аттракционы",
        icon: "ParkingCircle",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-amusement-park",
        name: "Парки развлечений",
        icon: "PartyPopper",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-zoo",
        name: "Зоопарк",
        icon: "Cat",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-aquarium",
        name: "Океанариум",
        icon: "Ship",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-dolphinarium",
        name: "Дельфинарий",
        icon: "Ship",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-museum",
        name: "Музеи",
        icon: "Building2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-exhibitions",
        name: "Выставки",
        icon: "Building2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-circus",
        name: "Цирк",
        icon: "Drama",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-bowling",
        name: "Боулинг",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-billiards",
        name: "Бильярд",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-ice-rink",
        name: "Каток",
        icon: "Snowflake",
        color: "cyan",
        type: "expense",
      },
      {
        id: "cat-laser-tag",
        name: "Лазертаг",
        icon: "Target",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-paintball",
        name: "Пейнтбол",
        icon: "Target",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-water-park",
        name: "Аквапарк",
        icon: "Droplets",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-nightclubs",
        name: "Ночные клубы",
        icon: "Music",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-bars",
        name: "Бары",
        icon: "Coffee",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-casino",
        name: "Казино",
        icon: "Dices",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-slot-machines",
        name: "Игровые автоматы",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-holidays",
        name: "Праздники",
        icon: "PartyPopper",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-fireworks",
        name: "Фейерверки",
        icon: "Sparkles",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-photoshoot",
        name: "Фотосессии",
        icon: "Camera",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-streaming",
        name: "Подписки",
        icon: "Radio",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-video-games",
        name: "Видеоигры",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-consoles",
        name: "Игровые консоли",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-gaming-accessories",
        name: "Аксессуары для игр",
        icon: "Gamepad2",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-board-games",
        name: "Настольные игры",
        icon: "Dices",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-puzzles",
        name: "Пазлы",
        icon: "Puzzle",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-building-toys",
        name: "Конструкторы",
        icon: "ToyBrick",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-fiction",
        name: "Художественные книги",
        icon: "BookOpen",
        color: "indigo",
        type: "expense",
      },
      {
        id: "cat-photo-printing",
        name: "Печать фотографий",
        icon: "Camera",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-festivals",
        name: "Фестивали",
        icon: "Music",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-fairs",
        name: "Ярмарки",
        icon: "ShoppingCart",
        color: "amber",
        type: "expense",
      },
      {
        id: "cat-entertainment-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "government",
    name: "Госуслуги",
    icon: "Building2",
    accent: "#ef4444",
    defaultColor: "red",
    categories: [
      {
        id: "cat-documents",
        name: "Документы",
        icon: "ScrollText",
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
        id: "cat-taxes",
        name: "Налоги",
        icon: "Building2",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-fees",
        name: "Пошлины",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-licenses",
        name: "Лицензии",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-permits",
        name: "Разрешения",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-government-certificates",
        name: "Справки",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-international-passport",
        name: "Загранпаспорт",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-domestic-passport",
        name: "Внутренний паспорт",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-drivers-license",
        name: "Водительские права",
        icon: "Car",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-car-registration",
        name: "Регистрация автомобиля",
        icon: "Car",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-residence-registration",
        name: "Регистрация по месту жительства",
        icon: "Home",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-courts",
        name: "Суды",
        icon: "Gavel",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-enforcement-fees",
        name: "Исполнительные сборы",
        icon: "AlertTriangle",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-notary",
        name: "Нотариус",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-powers-of-attorney",
        name: "Доверенности",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-certified-copies",
        name: "Заверение копий",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-apostille",
        name: "Апостиль",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-document-translation",
        name: "Перевод документов",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-consular-fee",
        name: "Консульский сбор",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-visa",
        name: "Виза",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-certification",
        name: "Сертификация",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-meter-verification",
        name: "Поверка счетчиков",
        icon: "Zap",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-privatization",
        name: "Приватизация",
        icon: "Home",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-inheritance-processing",
        name: "Оформление наследства",
        icon: "Heart",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-deed-of-gift",
        name: "Дарственная",
        icon: "Gift",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-property-registration",
        name: "Купля-продажа недвижимости (регистрация)",
        icon: "Home",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-egrn-extracts",
        name: "Выписки из ЕГРН",
        icon: "ScrollText",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-cadastral-work",
        name: "Кадастровые работы",
        icon: "Home",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-property-appraisal",
        name: "Оценка имущества",
        icon: "Building2",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-state-expertise",
        name: "Госэкспертиза",
        icon: "Building2",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-excise-duties",
        name: "Акцизы",
        icon: "Building2",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-customs",
        name: "Таможенные платежи",
        icon: "Globe",
        color: "red",
        type: "expense",
      },
      {
        id: "cat-government-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "extra",
    name: "Дополнительно",
    icon: "ShoppingCart",
    accent: "#6b7280",
    defaultColor: "slate",
    categories: [
      {
        id: "cat-service",
        name: "Услуга",
        icon: "Hand",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-purchase",
        name: "Покупка",
        icon: "ShoppingCart",
        color: "slate",
        type: "expense",
      },
      {
        id: "cat-rental-extra",
        name: "Аренда",
        icon: "Key",
        color: "slate",
        type: "expense",
      },
    ],
  },
  {
    id: "loans",
    name: "Кредиты",
    icon: "Landmark",
    accent: "#f43f5e",
    defaultColor: "rose",
    categories: [
      {
        id: "cat-loans",
        name: "Займы",
        icon: "Banknote",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-mortgage",
        name: "Ипотека",
        icon: "Home",
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
        id: "cat-consumer-loan",
        name: "Потребительский кредит",
        icon: "Landmark",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-credit-card-debt",
        name: "Кредитная карта (погашение долга)",
        icon: "CreditCard",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-microloans",
        name: "Микрозаймы",
        icon: "Banknote",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-refinancing",
        name: "Рефинансирование",
        icon: "RefreshCw",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-loan-interest",
        name: "Проценты по кредиту",
        icon: "Percent",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-loan-issuance-fee",
        name: "Комиссия за выдачу кредита",
        icon: "Percent",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-loan-penalties",
        name: "Штрафы по кредиту (пеня, неустойка)",
        icon: "AlertTriangle",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-loan-insurance",
        name: "Страховка кредита (если включена в платеж)",
        icon: "Shield",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-annuity",
        name: "Аннуитетный платеж",
        icon: "Landmark",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-differentiated",
        name: "Дифференцированный платеж",
        icon: "Landmark",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-early-repayment",
        name: "Досрочное погашение",
        icon: "Check",
        color: "green",
        type: "expense",
      },
      {
        id: "cat-loan-holidays",
        name: "Продление кредита / Каникулы",
        icon: "Calendar",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-overpayment",
        name: "Переплата по кредиту",
        icon: "Percent",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-debt-obligations",
        name: "Долговые обязательства (расписки, векселя)",
        icon: "ScrollText",
        color: "rose",
        type: "expense",
      },
      {
        id: "cat-loans-other",
        name: "Иное",
        icon: "MoreHorizontal",
        color: "slate",
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
    id: "salary-work",
    name: "Зарплата и работа",
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
        id: "cat-salary-official",
        name: "Оклад",
        icon: "DollarSign",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-advance",
        name: "Аванс",
        icon: "Wallet",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-bonus",
        name: "Премия",
        icon: "Award",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-fee",
        name: "Гонорар",
        icon: "Crown",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-commission",
        name: "Комиссионные",
        icon: "Percent",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-parttime",
        name: "Подработка",
        icon: "Briefcase",
        color: "emerald",
        type: "income",
      },
    ],
  },
  {
    id: "investment-income",
    name: "Инвестиционные доходы",
    icon: "TrendingUp",
    accent: "#10b981",
    defaultColor: "emerald",
    categories: [
      {
        id: "cat-investment",
        name: "Инвестиционный доход",
        icon: "TrendingUp",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-deposit-interest",
        name: "Процент по банковскому вкладу",
        icon: "PiggyBank",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-royalty",
        name: "Роялти",
        icon: "Crown",
        color: "emerald",
        type: "income",
      },
      {
        id: "cat-exchange-rate",
        name: "Курсовая разница",
        icon: "TrendingUp",
        color: "emerald",
        type: "income",
      },
    ],
  },
  {
    id: "debt-returns",
    name: "Возвраты и долги",
    icon: "Banknote",
    accent: "#14b8a6",
    defaultColor: "teal",
    categories: [
      {
        id: "cat-debt-return",
        name: "Возвращение долга",
        icon: "Banknote",
        color: "teal",
        type: "income",
      },
      {
        id: "cat-overpayment-return",
        name: "Возврат переплаты",
        icon: "RefreshCw",
        color: "teal",
        type: "income",
      },
      {
        id: "cat-debt-forgiveness",
        name: "Прощение долга",
        icon: "Heart",
        color: "teal",
        type: "income",
      },
      {
        id: "cat-tax-deduction",
        name: "Налоговый вычет",
        icon: "Receipt",
        color: "teal",
        type: "income",
      },
      {
        id: "cat-tax-recalculation",
        name: "Перерасчет налога",
        icon: "ScrollText",
        color: "teal",
        type: "income",
      },
    ],
  },
  {
    id: "social-benefits",
    name: "Пособия и компенсации",
    icon: "Heart",
    accent: "#ec4899",
    defaultColor: "pink",
    categories: [
      {
        id: "cat-scholarship",
        name: "Стипендия",
        icon: "GraduationCap",
        color: "indigo",
        type: "income",
      },
      {
        id: "cat-social-benefits",
        name: "Социальные пособия",
        icon: "Heart",
        color: "pink",
        type: "income",
      },
      {
        id: "cat-subsidy",
        name: "Субсидия",
        icon: "Building2",
        color: "pink",
        type: "income",
      },
      {
        id: "cat-maternity-capital",
        name: "Материнский капитал",
        icon: "Baby",
        color: "pink",
        type: "income",
      },
      {
        id: "cat-insurance-payout",
        name: "Страховые выплаты",
        icon: "Shield",
        color: "pink",
        type: "income",
      },
      {
        id: "cat-grant",
        name: "Гранты",
        icon: "Award",
        color: "indigo",
        type: "income",
      },
      {
        id: "cat-alimony",
        name: "Алименты",
        icon: "Heart",
        color: "pink",
        type: "income",
      },
      {
        id: "cat-compensation",
        name: "Компенсация",
        icon: "Hand",
        color: "pink",
        type: "income",
      },
    ],
  },
  {
    id: "property-income",
    name: "Доходы от имущества",
    icon: "Key",
    accent: "#3b82f6",
    defaultColor: "blue",
    categories: [
      {
        id: "cat-rental",
        name: "Аренда",
        icon: "Key",
        color: "blue",
        type: "income",
      },
      {
        id: "cat-property-sale",
        name: "Продажа имущества",
        icon: "Building2",
        color: "blue",
        type: "income",
      },
      {
        id: "cat-item-sale",
        name: "Продажа вещи",
        icon: "Package",
        color: "blue",
        type: "income",
      },
    ],
  },
  {
    id: "credit-loans",
    name: "Кредиты и займы",
    icon: "Landmark",
    accent: "#06b6d4",
    defaultColor: "cyan",
    categories: [
      {
        id: "cat-loan-received",
        name: "Получение кредита/займа",
        icon: "Landmark",
        color: "cyan",
        type: "income",
      },
    ],
  },
  {
    id: "other-income",
    name: "Прочие доходы",
    icon: "Gift",
    accent: "#f59e0b",
    defaultColor: "amber",
    categories: [
      {
        id: "cat-gift",
        name: "Подарок",
        icon: "Gift",
        color: "amber",
        type: "income",
      },
      {
        id: "cat-winnings",
        name: "Выигрыши",
        icon: "Gem",
        color: "amber",
        type: "income",
      },
      {
        id: "cat-inheritance",
        name: "Наследство",
        icon: "Heart",
        color: "amber",
        type: "income",
      },
      {
        id: "cat-treasure",
        name: "Клад",
        icon: "Gem",
        color: "amber",
        type: "income",
      },
      {
        id: "cat-finding",
        name: "Находка",
        icon: "Search",
        color: "amber",
        type: "income",
      },
      {
        id: "cat-cashback",
        name: "Кэшбэк",
        icon: "RefreshCw",
        color: "amber",
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

const CURRENCY_ORDER = [
  "RUB",
  "USD",
  "EUR",
  "CNY",
  "GBP",
  "JPY",
  "KZT",
  "BYN",
  "UAH",
  "TRY",
  "AED",
  "THB",
  "CHF",
  "KRW",
  "INR",
  "AUD",
  "CAD",
  "SGD",
  "HKD",
  "NZD",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "RSD",
  "MDL",
  "SEK",
  "NOK",
  "DKK",
  "ISK",
  "AMD",
  "GEL",
  "AZN",
  "KGS",
  "TJS",
  "UZS",
  "TMT",
  "MNT",
  "ILS",
  "SAR",
  "EGP",
  "VND",
  "IDR",
  "MXN",
  "BRL",
  "ZAR",
  "NGN",
  "ARS",
  "CLP",
  "COP",
  "PEN",
];

const COUNTRY_FLAGS: Record<string, string> = {
  RUB: "🇷🇺",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  CNY: "🇨🇳",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  KZT: "🇰🇿",
  BYN: "🇧🇾",
  UAH: "🇺🇦",
  AMD: "🇦🇲",
  GEL: "🇬🇪",
  AZN: "🇦🇿",
  KGS: "🇰🇬",
  TJS: "🇹🇯",
  TRY: "🇹🇷",
  AED: "🇦🇪",
  THB: "🇹🇭",
  VND: "🇻🇳",
  IDR: "🇮🇩",
  KRW: "🇰🇷",
  INR: "🇮🇳",
  BRL: "🇧🇷",
  MXN: "🇲🇽",
  ZAR: "🇿🇦",
  CHF: "🇨🇭",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  DKK: "🇩🇰",
  PLN: "🇵🇱",
  CZK: "🇨🇿",
  HUF: "🇭🇺",
  RON: "🇷🇴",
  BGN: "🇧🇬",
  ISK: "🇮🇸",
  RSD: "🇷🇸",
  MDL: "🇲🇩",
  UZS: "🇺🇿",
  TMT: "🇹🇲",
  MNT: "🇲🇳",
  ILS: "🇮🇱",
  SAR: "🇸🇦",
  EGP: "🇪🇬",
  NGN: "🇳🇬",
  ARS: "🇦🇷",
  CLP: "🇨🇱",
  COP: "🇨🇴",
  PEN: "🇵🇪",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  SGD: "🇸🇬",
  HKD: "🇭🇰",
  NZD: "🇳🇿",
};

function CurrencyPickerDialog({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}) {
  const [search, setSearch] = useState("");
  const sorted = useMemo(() => {
    const orderMap = new Map(CURRENCY_ORDER.map((code, i) => [code, i]));
    return FIAT_CURRENCIES.filter(
      (c) =>
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.label.toLowerCase().includes(search.toLowerCase()),
    ).sort((a, b) => {
      const ai = orderMap.get(a.code);
      const bi = orderMap.get(b.code);
      if (ai !== undefined && bi !== undefined) return ai - bi;
      if (ai !== undefined) return -1;
      if (bi !== undefined) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [search]);

  const renderCurrency = (c: (typeof FIAT_CURRENCIES)[number]) => {
    const isSelected = value === c.code;
    return (
      <button
        key={c.code}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-muted/50",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-transparent bg-muted/30",
        )}
        onClick={() => {
          onChange(c.code);
          onOpenChange(false);
        }}
      >
        <span className="text-3xl leading-none shrink-0">
          {COUNTRY_FLAGS[c.code] || "🏳️"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{c.code}</span>
            <span className="text-sm text-muted-foreground">{c.symbol}</span>
            {isSelected && (
              <Check className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            {c.label}
          </p>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Выберите валюту</DialogTitle>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Поиск валюты..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
          {sorted.map(renderCurrency)}
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full text-center py-4">
              Ничего не найдено
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  onVisibilityChange?: () => void;
}

export function FinanceSettings({ onVisibilityChange }: Props) {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showHideDialog, setShowHideDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<TransactionCategory | null>(
    null,
  );
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("finance_currency") || "RUB",
  );
  const [name, setName] = useState("");
  const [catType, setCatType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState("blue");
  const [icon, setIcon] = useState("MoreHorizontal");
  const uid = auth.currentUser?.uid || "user-1";

  useEffect(() => {
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
    const data = JSON.stringify({ categories, accounts, currency }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-data.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспорт завершён");
  }, [categories, accounts, currency]);

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
        toast.success("Данные импортированы");
      } catch {
        toast.error("Ошибка при импорте");
      }
    };
    input.click();
  }, [saveCurrency]);

  const resetAll = useCallback(() => {
    toast("Сбросить все данные?", {
      action: {
        label: "Сбросить",
        onClick: () => {
          localStorage.removeItem("finance_currency");
          setCategories([]);
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
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-input bg-background px-4 py-2.5 w-full sm:w-auto min-w-[200px] text-left transition-all hover:bg-muted/50 hover:border-muted-foreground/30"
              onClick={() => setShowCurrencyDialog(true)}
            >
              <span className="text-xl leading-none">
                {COUNTRY_FLAGS[currency] || "🏳️"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">{currency}</span>
                  <span className="text-sm text-muted-foreground">
                    {FIAT_CURRENCIES.find((c) => c.code === currency)?.symbol}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {FIAT_CURRENCIES.find((c) => c.code === currency)?.label}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
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

      {/* Быстрые действия по данным */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Быстрые действия по данным
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 text-left transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
              onClick={exportAll}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
                <Download className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Экспорт</p>
                <p className="text-[11px] text-muted-foreground">
                  Скачать все данные JSON
                </p>
              </div>
            </button>
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-blue-500/20 bg-blue-500/5 p-4 text-left transition-all hover:bg-blue-500/10 hover:border-blue-500/40"
              onClick={importAll}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 shrink-0">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Импорт</p>
                <p className="text-[11px] text-muted-foreground">
                  Загрузить данные из JSON
                </p>
              </div>
            </button>
            <button
              className="flex items-center gap-3 rounded-xl border-2 border-rose-500/20 bg-rose-500/5 p-4 text-left transition-all hover:bg-rose-500/10 hover:border-rose-500/40 sm:col-span-1 col-span-full"
              onClick={resetAll}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Сброс</p>
                <p className="text-[11px] text-muted-foreground">
                  Очистить все настройки
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Диалог выбора валюты */}
      <CurrencyPickerDialog
        open={showCurrencyDialog}
        onOpenChange={setShowCurrencyDialog}
        value={currency}
        onChange={saveCurrency}
      />

      {/* Диалог скрытия пунктов */}
      <HideModulesDialog
        open={showHideDialog}
        onOpenChange={setShowHideDialog}
        onSave={() => onVisibilityChange?.()}
      />

      {/* Диалог категории */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? "Редактировать категорию" : "Новая категория"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Название
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Продукты"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Тип</label>
                <div className="flex rounded-lg bg-muted p-0.5">
                  <button
                    onClick={() => setCatType("expense")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      catType === "expense"
                        ? "bg-rose-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TrendingDown className="h-3.5 w-3.5" />
                    Расход
                  </button>
                  <button
                    onClick={() => setCatType("income")}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      catType === "income"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Доход
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Цвет</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.label}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      c.bg,
                      color === c.value
                        ? "ring-2 ring-offset-2 ring-foreground scale-110"
                        : "ring-1 ring-offset-1 ring-transparent hover:scale-105",
                    )}
                    onClick={() => setColor(c.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Иконка</label>
              <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                {ICON_GROUPS.filter(
                  (grp) => grp.type === "both" || grp.type === catType,
                ).map((grp) => (
                  <div key={grp.name}>
                    <div className="flex items-center gap-2 mb-1.5 px-0.5">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          grp.color,
                        )}
                      />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {grp.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                      {grp.items.map((opt) => (
                        <button
                          key={opt.value}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border p-2 transition-all",
                            icon === opt.value
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-input hover:bg-muted hover:border-muted-foreground/30",
                          )}
                          onClick={() => setIcon(opt.value)}
                        >
                          <opt.icon
                            className={cn(
                              "h-5 w-5",
                              icon === opt.value
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              "text-[8px] text-center leading-tight",
                              icon === opt.value
                                ? "text-foreground font-medium"
                                : "text-muted-foreground",
                            )}
                          >
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
