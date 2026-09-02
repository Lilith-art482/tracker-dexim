export const TASK_COLOR_OPTIONS = [
  { value: "", label: "Авто", swatch: "bg-muted" },
  { value: "sky", label: "Голубой", swatch: "bg-sky-500" },
  { value: "emerald", label: "Изумруд", swatch: "bg-emerald-500" },
  { value: "amber", label: "Янтарный", swatch: "bg-amber-500" },
  { value: "rose", label: "Розовый", swatch: "bg-rose-500" },
  { value: "violet", label: "Фиолетовый", swatch: "bg-violet-500" },
  { value: "teal", label: "Бирюзовый", swatch: "bg-teal-500" },
  { value: "indigo", label: "Индиго", swatch: "bg-indigo-500" },
  { value: "orange", label: "Оранжевый", swatch: "bg-orange-500" },
] as const;

export type TaskColor = (typeof TASK_COLOR_OPTIONS)[number]["value"];

export function taskColorSwatch(value: string): string {
  const found = TASK_COLOR_OPTIONS.find((o) => o.value === value);
  return found?.swatch ?? "bg-muted";
}

export function taskColorRing(value: string): string {
  const rings: Record<string, string> = {
    "": "ring-muted",
    sky: "ring-sky-500",
    emerald: "ring-emerald-500",
    amber: "ring-amber-500",
    rose: "ring-rose-500",
    violet: "ring-violet-500",
    teal: "ring-teal-500",
    indigo: "ring-indigo-500",
    orange: "ring-orange-500",
  };
  return rings[value] ?? "ring-muted";
}

export function taskColorCard(value: string): string {
  const cards: Record<string, string> = {
    "": "",
    sky: "bg-sky-500/10 border-l-sky-500",
    emerald: "bg-emerald-500/10 border-l-emerald-500",
    amber: "bg-amber-500/10 border-l-amber-500",
    rose: "bg-rose-500/10 border-l-rose-500",
    violet: "bg-violet-500/10 border-l-violet-500",
    teal: "bg-teal-500/10 border-l-teal-500",
    indigo: "bg-indigo-500/10 border-l-indigo-500",
    orange: "bg-orange-500/10 border-l-orange-500",
  };
  return cards[value] ?? "";
}

export function taskColorBg(value: string): string {
  const bgs: Record<string, string> = {
    "": "",
    sky: "bg-sky-500/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    rose: "bg-rose-500/10",
    violet: "bg-violet-500/10",
    teal: "bg-teal-500/10",
    indigo: "bg-indigo-500/10",
    orange: "bg-orange-500/10",
  };
  return bgs[value] ?? "";
}

export function taskColorLabel(value: string): string {
  const found = TASK_COLOR_OPTIONS.find((o) => o.value === value);
  return found?.label ?? "Авто";
}
