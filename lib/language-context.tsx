"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ru" | "en" | "zh";

const STORAGE_KEY = "inmotion_lang";

const dict: Record<Lang, Record<string, string>> = {
  ru: {
    planner: "Планнер",
    ideas: "Идея",
    finance: "Финансы",
    habits: "Привычки",
    duodays: "Семья",
    notes: "Заметки",
    sport: "Спорт и Питание",
    sleep: "Сон",
    work: "Работа",
    focusing: "Фокусирование",
    blog: "Блог",
  },
  en: {
    planner: "Planner",
    ideas: "Ideas",
    finance: "Finance",
    habits: "Habits",
    duodays: "DuoDays",
    notes: "Notes",
    sport: "Sport & Nutrition",
    sleep: "Sleep Hub",
    work: "Work",
    focusing: "Focusing",
    blog: "Blog",
  },
  zh: {
    planner: "规划器",
    ideas: "创意",
    finance: "财务",
    habits: "习惯",
    duodays: "家庭",
    notes: "笔记",
    sport: "运动与营养",
    sleep: "睡眠",
    work: "工作",
    focusing: "专注",
    blog: "博客",
  },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const LanguageContext = createContext<Ctx>({
  lang: "ru",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && ["ru", "en", "zh"].includes(saved)) setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {}
    document.documentElement.lang = l;
  };

  const t = (key: string) => dict[lang]?.[key] ?? dict.ru[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
