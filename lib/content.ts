import {
  GraduationCap,
  Camera,
  Package,
  Briefcase,
  Newspaper,
  Flame,
  HelpCircle,
  Star,
  Users,
  Megaphone,
  Wrench,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const CONTENT_TOPICS = [
  "Экспертиза / обучение",
  "Закулисье",
  "Продукт / услуга",
  "Кейсы клиентов",
  "Новости и тренды",
  "Мотивация / вдохновение",
  "FAQ и вопросы",
  "Отзывы",
  "Команда",
  "Анонс запуска",
  "Разбор ошибок",
  "Личный бренд",
] as const;

export const CONTENT_PLATFORMS = [
  "Telegram",
  "YouTube",
  "Instagram",
  "ВКонтакте",
  "TikTok",
  "Дзен",
  "VC.ru",
  "Facebook",
  "RuTube",
  "Email-рассылка",
] as const;

export const PLATFORM_LOGOS: Record<string, string> = {
  Telegram: "/Telegram_logo.svg.webp",
  YouTube: "/youtube.webp",
  Instagram: "/Instagram_logo.svg.webp",
  ВКонтакте: "/VK_Compact_Logo_(2021-present).svg.webp",
  TikTok: "/TikTok.webp",
  Дзен: "/Дзен_logo_icon.svg.webp",
  "VC.ru": "/Vc.ru-logo.png",
  Facebook: "/2023_Facebook_icon.svg.webp",
  RuTube: "/Rutube.webp",
};

export const CONTENT_FORMATS = [
  "Пост",
  "Видео",
  "Сторис",
  "Reels / Shorts",
  "Подборка",
  "Интервью",
  "Лонгрид",
  "Кейс",
  "Новость",
  "Эфир",
  "Чек-лист",
] as const;

export const CONTENT_STATUSES = [
  "Идея",
  "Черновик",
  "В работе",
  "Готов к публикации",
  "Опубликовано",
  "Архив",
] as const;

export const CUSTOM_OPTION = "__custom__";

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  "Экспертиза / обучение": GraduationCap,
  Закулисье: Camera,
  "Продукт / услуга": Package,
  "Кейсы клиентов": Briefcase,
  "Новости и тренды": Newspaper,
  "Мотивация / вдохновение": Flame,
  "FAQ и вопросы": HelpCircle,
  Отзывы: Star,
  Команда: Users,
  "Анонс запуска": Megaphone,
  "Разбор ошибок": Wrench,
  "Личный бренд": UserRound,
};

export const STATUS_STYLES: Record<string, string> = {
  Идея: "bg-muted/60 text-muted-foreground",
  Черновик: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "В работе": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Готов к публикации": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Опубликовано: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Архив: "bg-muted/40 text-muted-foreground/60",
};
