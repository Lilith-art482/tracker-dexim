export interface PaletteColor {
  value: string;
  label: string;
  light: string;
  dark: string;
  accent: string;
  accentFg: string;
}

export interface BgPreset {
  value: string;
  label: string;
  bg: string;
  card: string;
  muted: string;
  border: string;
  foreground: string;
}

export const BG_LIGHT_PRESETS: BgPreset[] = [
  { value: "warm", label: "Тёплый", bg: "#F7F7F5", card: "#FFFFFF", muted: "#F0EFED", border: "#E4E3E0", foreground: "#1A1A1A" },
  { value: "cool", label: "Холодный", bg: "#F4F6F8", card: "#FFFFFF", muted: "#EFF2F5", border: "#DEE3E9", foreground: "#1A1D23" },
  { value: "paper", label: "Бумага", bg: "#F5F0EB", card: "#FFFDF9", muted: "#EDE8E2", border: "#DDD6CE", foreground: "#2C2418" },
  { value: "milk", label: "Молочный", bg: "#FAFAF8", card: "#FFFFFF", muted: "#F5F5F3", border: "#E8E8E4", foreground: "#1C1C1A" },
  { value: "slate", label: "Сланец", bg: "#F1F3F5", card: "#FFFFFF", muted: "#E9ECF0", border: "#D5DAE1", foreground: "#1A1E25" },
  { value: "cream", label: "Кремовый", bg: "#FBF8F1", card: "#FFFDF7", muted: "#F3EFE6", border: "#E5DFD4", foreground: "#2A2317" },
  { value: "ice", label: "Ледяной", bg: "#EFF5F7", card: "#FFFFFF", muted: "#E5EDF1", border: "#D3DEE5", foreground: "#152028" },
  { value: "sand", label: "Песчаный", bg: "#F2EDE6", card: "#FFFDF8", muted: "#EAE4DB", border: "#DCD5CA", foreground: "#2B2318" },
  { value: "rose", label: "Розовый", bg: "#F9F5F5", card: "#FFFFFF", muted: "#F3EDED", border: "#E8DEDE", foreground: "#281A1A" },
  { value: "night", label: "Светлая ночь", bg: "#E8E9EC", card: "#F4F4F6", muted: "#DDE0E4", border: "#CDD2D8", foreground: "#1A1B1F" },
];

export const BG_DARK_PRESETS: BgPreset[] = [
  { value: "midnight", label: "Полночь", bg: "#16191F", card: "#1E2028", muted: "#25272F", border: "#2E3139", foreground: "#E8E8E8" },
  { value: "charcoal", label: "Уголь", bg: "#1A1A1A", card: "#222222", muted: "#2A2A2A", border: "#333333", foreground: "#E5E5E5" },
  { value: "deep", label: "Глубина", bg: "#0F1219", card: "#181C25", muted: "#1E2230", border: "#282D3C", foreground: "#E2E5ED" },
  { value: "ocean", label: "Океан", bg: "#111827", card: "#1A2332", muted: "#1F2937", border: "#2A3544", foreground: "#E0E6ED" },
  { value: "forest", label: "Лес", bg: "#131A16", card: "#1B2420", muted: "#212C27", border: "#2B3832", foreground: "#DEE8E2" },
  { value: "plum", label: "Слива", bg: "#1A1420", card: "#231C2A", muted: "#2A2233", border: "#352E40", foreground: "#E5DFF0" },
  { value: "warm-dark", label: "Тёмный тёплый", bg: "#1C1917", card: "#252220", muted: "#2C2826", border: "#3A3533", foreground: "#EAE5E0" },
  { value: "steel", label: "Сталь", bg: "#17191C", card: "#1F2125", muted: "#26282D", border: "#31343A", foreground: "#E3E5EA" },
  { value: "slate-dark", label: "Сланец тёмный", bg: "#15181E", card: "#1D2027", muted: "#24272F", border: "#2E323A", foreground: "#E0E3EA" },
  { value: "pure", label: "Чистый", bg: "#000000", card: "#0A0A0A", muted: "#141414", border: "#1F1F1F", foreground: "#FAFAFA" },
];

export interface ThemeSettings {
  accent: { preset: string; custom: string };
  lightBg: string;
  lightBgCustom: string;
  darkBg: string;
  darkBgCustom: string;
  brightness: { light: number; dark: number };
  contrast: { light: number; dark: number };
}

export const DEFAULT_THEME: ThemeSettings = {
  accent: { preset: "sage", custom: "#6B8F71" },
  lightBg: "warm",
  lightBgCustom: "",
  darkBg: "midnight",
  darkBgCustom: "",
  brightness: { light: 100, dark: 100 },
  contrast: { light: 100, dark: 100 },
};

export const PALETTE_GROUPS: {
  name: string;
  colors: PaletteColor[];
}[] = [
  {
    name: "Яркие",
    colors: [
      { value: "red", label: "Красный", light: "#DC2626", dark: "#EF4444", accent: "#FEF2F2", accentFg: "#991B1B" },
      { value: "orange", label: "Оранжевый", light: "#EA580C", dark: "#F97316", accent: "#FFF7ED", accentFg: "#9A3412" },
      { value: "amber", label: "Янтарный", light: "#D97706", dark: "#F59E0B", accent: "#FFFBEB", accentFg: "#92400E" },
      { value: "yellow", label: "Жёлтый", light: "#CA8A04", dark: "#EAB308", accent: "#FEFCE8", accentFg: "#854D0E" },
      { value: "lime", label: "Лаймовый", light: "#65A30D", dark: "#84CC16", accent: "#F7FEE7", accentFg: "#3F6212" },
      { value: "green", label: "Зелёный", light: "#16A34A", dark: "#22C55E", accent: "#F0FDF4", accentFg: "#166534" },
      { value: "emerald", label: "Изумрудный", light: "#059669", dark: "#10B981", accent: "#ECFDF5", accentFg: "#065F46" },
      { value: "teal", label: "Бирюзовый", light: "#0D9488", dark: "#14B8A6", accent: "#F0FDFA", accentFg: "#134E4A" },
      { value: "cyan", label: "Голубой", light: "#0891B2", dark: "#06B6D4", accent: "#ECFEFF", accentFg: "#155E75" },
      { value: "sky", label: "Небесный", light: "#0284C7", dark: "#0EA5E9", accent: "#F0F9FF", accentFg: "#0C4A6E" },
    ],
  },
  {
    name: "Пастельные",
    colors: [
      { value: "rose", label: "Розовый", light: "#E11D48", dark: "#FB7185", accent: "#FFF1F2", accentFg: "#9F1239" },
      { value: "pink", label: "Маджента", light: "#DB2777", dark: "#EC4899", accent: "#FDF2F8", accentFg: "#9D174D" },
      { value: "fuchsia", label: "Фуксия", light: "#C026D3", dark: "#D946EF", accent: "#FDF4FF", accentFg: "#86198F" },
      { value: "purple", label: "Фиолетовый", light: "#9333EA", dark: "#A855F7", accent: "#FAF5FF", accentFg: "#6B21A8" },
      { value: "violet", label: "Сиреневый", light: "#7C3AED", dark: "#8B5CF6", accent: "#F5F3FF", accentFg: "#5B21B6" },
      { value: "indigo", label: "Индиго", light: "#4F46E5", dark: "#6366F1", accent: "#EEF2FF", accentFg: "#3730A3" },
      { value: "blue", label: "Синий", light: "#2563EB", dark: "#3B82F6", accent: "#EFF6FF", accentFg: "#1E40AF" },
      { value: "slate", label: "Серый", light: "#475569", dark: "#94A3B8", accent: "#F8FAFC", accentFg: "#334155" },
      { value: "zinc", label: "Цинковый", light: "#52525B", dark: "#A1A1AA", accent: "#FAFAFA", accentFg: "#3F3F46" },
      { value: "neutral", label: "Нейтральный", light: "#525252", dark: "#A3A3A3", accent: "#FAFAFA", accentFg: "#404040" },
    ],
  },
  {
    name: "Мягкие",
    colors: [
      { value: "stone", label: "Каменный", light: "#78716C", dark: "#A8A29E", accent: "#FAFAF9", accentFg: "#57534E" },
      { value: "peach", label: "Персиковый", light: "#F97316", dark: "#FB923C", accent: "#FFF7ED", accentFg: "#9A3412" },
      { value: "coral", label: "Коралловый", light: "#F97044", dark: "#FF8A65", accent: "#FFF3E0", accentFg: "#BF360C" },
      { value: "sand", label: "Песочный", light: "#C4A06A", dark: "#DEB887", accent: "#FDF8F0", accentFg: "#8B6F47" },
      { value: "sage", label: "Шалфей", light: "#6B8F71", dark: "#8FB996", accent: "#F0F5F1", accentFg: "#4A6B4F" },
      { value: "mint", label: "Мятный", light: "#10B981", dark: "#34D399", accent: "#ECFDF5", accentFg: "#065F46" },
      { value: "lavender", label: "Лавандовый", light: "#8B5CF6", dark: "#A78BFA", accent: "#F5F3FF", accentFg: "#5B21B6" },
      { value: "sky-soft", label: "Голубой мягкий", light: "#38BDF8", dark: "#7DD3FC", accent: "#F0F9FF", accentFg: "#0C4A6E" },
      { value: "bronze", label: "Бронзовый", light: "#B45309", dark: "#D97706", accent: "#FFFBEB", accentFg: "#92400E" },
      { value: "graphite", label: "Графит", light: "#374151", dark: "#6B7280", accent: "#F9FAFB", accentFg: "#1F2937" },
    ],
  },
];
