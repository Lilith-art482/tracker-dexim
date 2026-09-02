"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Send,
  Bot,
  User,
  X,
  Loader2,
  Lightbulb,
  ChevronRight,
  AlertTriangle,
  Info,
  Calendar,
  DollarSign,
  ListChecks,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BarChart3,
  Trash2,
  HelpCircle,
  Crown,
  FileText,
  ShieldCheck,
  MessageCircle,
  Gift,
  Clapperboard,
  Megaphone,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  getAccountsByUser,
  getTransactionsByUser,
  getLoansByUser,
  getBudgetPlansByUser,
  getGoalsByUser,
  getCategoriesByUser,
} from "@/lib/finance-client";
import {
  getUSDTtoRUB,
  convertToRUB,
  getConversionNote,
} from "@/lib/exchange-rates";
import { FAQ_DATA } from "@/lib/faq";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SuggestedPrompt {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}

const DEFAULT_PROMPTS: SuggestedPrompt[] = [
  {
    icon: Clapperboard,
    label: "Контент-план",
    text: "Что у меня по контент-плану? Расскажи о задачах и подскажи, что стоит опубликовать",
  },
  {
    icon: Calendar,
    label: "Задачи на сегодня",
    text: "Что у меня по задачам на сегодня?",
  },
  {
    icon: DollarSign,
    label: "Финансы",
    text: "Расскажи о моих финансах",
  },
  {
    icon: ListChecks,
    label: "Привычки",
    text: "Как у меня с привычками?",
  },
  {
    icon: Crown,
    label: "Тарифы",
    text: "Расскажи о тарифах In Motion",
  },
];

const SERVICE_PROMPTS: SuggestedPrompt[] = [
  {
    icon: HelpCircle,
    label: "О проекте",
    text: "Расскажи подробнее о проекте In Motion",
  },
  {
    icon: Crown,
    label: "Тарифы",
    text: "Какие тарифы есть и чем они отличаются?",
  },
  {
    icon: FileText,
    label: "FAQ",
    text: "Что чаще всего спрашивают о сервисе?",
  },
  {
    icon: ShieldCheck,
    label: "Персональные данные",
    text: "Расскажи о персональных данных: как их обрабатывают, как отозвать согласие или удалить аккаунт? Это регулируется ФЗ №152-ФЗ?",
  },
  {
    icon: MessageCircle,
    label: "Связь с разработчиками",
    text: "Хочу связаться с разработчиками: могу предложить идею, сообщить о проблеме, запросить индивидуальные лимиты или узнать о персональных данных в соответствии с ФЗ №152. Как это сделать?",
  },
  {
    icon: Crown,
    label: "Промокод",
    text: "Расскажи про промокоды: как получить скидку и где проходят акции и розыгрыши?",
  },
];

const CHAT_STORAGE_KEY = "inmotion_ai_chat_messages";
const CHAT_TTL = 3 * 24 * 60 * 60 * 1000;

function loadMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.timestamp && Date.now() - parsed.timestamp > CHAT_TTL) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return [];
    }
    return parsed.messages || [];
  } catch {
    return [];
  }
}

function saveMessages(messages: Message[]) {
  try {
    localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ messages, timestamp: Date.now() }),
    );
  } catch {}
}

function clearMessages() {
  localStorage.removeItem(CHAT_STORAGE_KEY);
}

function sanitize(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

const faqContext = FAQ_DATA.map(
  (cat) =>
    `=== ${cat.label} ===\n` +
    cat.items
      .map((item) => `Q: ${item.question}\nA: ${item.answer}`)
      .join("\n"),
).join("\n\n");

async function buildUserContext(): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) return "Пользователь не авторизован.";

  const parts: string[] = [];
  let usdtRate = 90;

  try {
    usdtRate = await getUSDTtoRUB();
  } catch {}

  try {
    const [accounts, transactions, loans, budgets, goals, categories] =
      await Promise.all([
        getAccountsByUser(uid),
        getTransactionsByUser(uid),
        getLoansByUser(uid),
        getBudgetPlansByUser(uid),
        getGoalsByUser(uid),
        getCategoriesByUser(uid),
      ]);

    if (accounts.length > 0) {
      const totalBalance = accounts.reduce(
        (s, a) => s + convertToRUB(a.balance, a.currency, usdtRate),
        0,
      );
      parts.push(
        `Счета (${accounts.length}): общий баланс ${Math.round(totalBalance).toLocaleString()} ₽ (все счета в рублёвом эквиваленте, кроме неподдерживаемых валют).`,
      );
      accounts.forEach((a) => {
        const rub = convertToRUB(a.balance, a.currency, usdtRate);
        const note = getConversionNote(a.currency);
        parts.push(
          `  - ${a.name}: ${rub.toLocaleString()} ₽${note ? note : ""} (тип: ${a.type})`,
        );
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7);
    const monthTxns = transactions.filter((t) => t.date.startsWith(thisMonth));
    const income = monthTxns
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxns
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    parts.push(
      `Транзакции за ${thisMonth}: доход ${income.toLocaleString()} ₽, расход ${expenses.toLocaleString()} ₽, всего ${monthTxns.length} операций.`,
    );

    if (loans.length > 0) {
      const totalDebt = loans.reduce((s, l) => s + l.remainingAmount, 0);
      const monthlyPayments = loans
        .filter((l) => l.repaymentType === "monthly")
        .reduce((s, l) => s + l.monthlyPayment, 0);
      const overdue = loans.filter((l) => (l.overdueMonths || 0) > 0).length;
      parts.push(
        `Обязательства (${loans.length}): общий долг ${totalDebt.toLocaleString()} ₽, ежемесячный платёж ${monthlyPayments.toLocaleString()} ₽, просрочено ${overdue}.`,
      );
      loans.forEach((l) => {
        parts.push(
          `  - ${l.name}: ${l.remainingAmount.toLocaleString()} ₽, ${l.repaymentType === "monthly" ? l.monthlyPayment.toLocaleString() + " ₽/мес" : "единовременно до " + l.dueDate}, тип: ${l.obligationType}`,
        );
      });
    }

    if (budgets.length > 0) {
      const current = budgets.find(
        (b) => b.period === "month" && b.periodStart.startsWith(thisMonth),
      );
      if (current) {
        parts.push(
          `Бюджет на ${thisMonth}: ожидаемый доход ${current.expectedIncome.toLocaleString()} ₽, лимиты по ${current.categoryBudgets.length} категориям.`,
        );
      }
    }

    if (goals.length > 0) {
      const active = goals.filter((g) => !g.completed);
      parts.push(
        `Цели (${active.length} активных): ${active.map((g) => `${g.name} (${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()} ₽)`).join(", ")}`,
      );
    }

    if (categories.length > 0) {
      const expCats = categories.filter((c) => c.type === "expense");
      const incCats = categories.filter((c) => c.type === "income");
      parts.push(
        `Категории: ${expCats.length} расходных, ${incCats.length} доходных.`,
      );
    }
  } catch (e) {
    console.error("[AI Chat] Error building context:", e);
  }

  try {
    const res = await fetch(`/api/content-tasks?uid=${uid}`);
    if (res.ok) {
      const contentTasks: {
        date?: string | null;
        status?: string;
        title?: string;
      }[] = await res.json();
      if (contentTasks.length > 0) {
        const today = new Date().toISOString().split("T")[0];
        const onToday = contentTasks.filter((t) => t.date === today).length;
        const backlog = contentTasks.filter((t) => !t.date).length;
        const pending = contentTasks.filter(
          (t) =>
            t.status && t.status !== "Опубликовано" && t.status !== "Архив",
        ).length;
        parts.push(
          `Контент-план: всего ${contentTasks.length} контент-задач, сегодня ${onToday}, без даты (бэклог) ${backlog}, в работе/черновиках ${pending}.`,
        );
        const byStatus = new Map<string, number>();
        for (const t of contentTasks) {
          const s = t.status || "Без статуса";
          byStatus.set(s, (byStatus.get(s) || 0) + 1);
        }
        parts.push(
          `  По статусам: ${[...byStatus.entries()]
            .map(([s, n]) => `${s}: ${n}`)
            .join(", ")}.`,
        );
        const upcoming = contentTasks
          .filter((t) => t.date && t.date >= today)
          .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
          .slice(0, 5)
          .map((t) => (t.title || "").slice(0, 60))
          .join(" | ");
        if (upcoming) {
          parts.push(`  Ближайшие контент-задачи: ${upcoming}.`);
        }
      } else {
        parts.push("Контент-план: контент-задач пока нет.");
      }
    }
  } catch {
    // silent
  }

  if (parts.length === 0) {
    return "Нет данных о пользователе.";
  }

  return parts.join("\n");
}

/** Analyse the last message(s) to suggest contextual follow-up prompts */
function suggestPrompts(messages: Message[]): SuggestedPrompt[] {
  const last = messages[messages.length - 1];
  const secondLast = messages[messages.length - 2];
  if (!last) return [...DEFAULT_PROMPTS, ...SERVICE_PROMPTS];

  const allContent =
    last.content.toLowerCase() + (secondLast?.content.toLowerCase() || "");

  const sets: { keywords: string[]; prompts: SuggestedPrompt[] }[] = [
    {
      keywords: ["задач", "план", "сегодня", "дедлайн", "сделать", "список"],
      prompts: [
        {
          icon: Calendar,
          label: "Что важно сегодня?",
          text: "Какие задачи самые важные на сегодня?",
        },
        {
          icon: ListChecks,
          label: "Просроченное",
          text: "Есть ли у меня просроченные задачи?",
        },
        {
          icon: Lightbulb,
          label: "Расписание",
          text: "Помоги составить расписание на день",
        },
      ],
    },
    {
      keywords: [
        "контент",
        "публикац",
        "пост",
        "stories",
        "сторис",
        "телеграм",
        "канал",
        "youtube",
        "tiktok",
        "рилс",
        "платфор",
      ],
      prompts: [
        {
          icon: Clapperboard,
          label: "Контент-план",
          text: "Что у меня по контент-плану? Покажи ближайшие публикации",
        },
        {
          icon: Megaphone,
          label: "Идеи контента",
          text: "Предложи идеи для публикаций на этой неделе",
        },
        {
          icon: Lightbulb,
          label: "Текст поста",
          text: "Помоги написать пост на основе моих контент-задач",
        },
      ],
    },
    {
      keywords: [
        "финанс",
        "баланс",
        "бюджет",
        "доход",
        "расход",
        "деньг",
        "счёт",
        "копить",
        "долг",
        "кредит",
      ],
      prompts: [
        {
          icon: TrendingUp,
          label: "Доходы",
          text: "Сколько я заработал в этом месяце?",
        },
        {
          icon: TrendingDown,
          label: "Расходы",
          text: "На что я трачу больше всего?",
        },
        { icon: Target, label: "Бюджет", text: "Как мне улучшить бюджет?" },
      ],
    },
    {
      keywords: [
        "привычк",
        "трек",
        "streak",
        "прогресс",
        "статистик",
        "достижен",
      ],
      prompts: [
        {
          icon: Award,
          label: "Лучшие серии",
          text: "Какие у меня самые длинные серии?",
        },
        {
          icon: BarChart3,
          label: "Прогресс",
          text: "Покажи прогресс по привычкам",
        },
        {
          icon: ListChecks,
          label: "Что добавить",
          text: "Какие привычки стоит добавить?",
        },
      ],
    },
    {
      keywords: ["цел", "goal", "накоп", "отлож", "копилк", "мечта"],
      prompts: [
        {
          icon: Target,
          label: "Достижение целей",
          text: "Как у меня идёт прогресс по целям?",
        },
        {
          icon: DollarSign,
          label: "Накопления",
          text: "Сколько нужно откладывать, чтобы достичь целей?",
        },
      ],
    },
    {
      keywords: [
        "обязательств",
        "кредит",
        "ипотек",
        "долг",
        "платёж",
        "просрочк",
      ],
      prompts: [
        {
          icon: DollarSign,
          label: "Долги",
          text: "Какой у меня общий долг по обязательствам?",
        },
        { icon: Calendar, label: "Платежи", text: "Какие платежи скоро?" },
        {
          icon: Lightbulb,
          label: "Снизить долги",
          text: "Как быстрее погасить долги?",
        },
      ],
    },
    {
      keywords: ["совет", "рекомендац", "помоги", "подскаж", "планирован"],
      prompts: [
        { icon: Calendar, label: "План дня", text: "Помоги спланировать день" },
        {
          icon: DollarSign,
          label: "Финансовый план",
          text: "Как оптимизировать бюджет?",
        },
        {
          icon: ListChecks,
          label: "Приоритеты",
          text: "На что мне стоит обратить внимание?",
        },
      ],
    },
    {
      keywords: [
        "faq",
        "вопрос",
        "сервис",
        "проект",
        "in motion",
        "о нас",
        "о проекте",
      ],
      prompts: SERVICE_PROMPTS,
    },
    {
      keywords: [
        "тариф",
        "цена",
        "сколько",
        "pro",
        "apex",
        "базовый",
        "подписк",
        "оплат",
      ],
      prompts: [
        {
          icon: Crown,
          label: "Сравнение тарифов",
          text: "Чем отличаются тарифы PRO и APEX?",
        },
        {
          icon: DollarSign,
          label: "Стоимость",
          text: "Сколько стоят тарифы?",
        },
        {
          icon: ShieldCheck,
          label: "Оплата",
          text: "Какие способы оплаты доступны?",
        },
      ],
    },
    {
      keywords: [
        "данн",
        "персональн",
        "конфиденциальн",
        "согласи",
        "удален",
        "аккаунт",
      ],
      prompts: [
        {
          icon: ShieldCheck,
          label: "Персональные данные",
          text: "Как обрабатываются мои данные?",
        },
        {
          icon: Trash2,
          label: "Удалить аккаунт",
          text: "Как удалить аккаунт и что для этого нужно?",
        },
        {
          icon: Gift,
          label: "Промокод",
          text: "Могу ли я получить промокод при удалении?",
        },
      ],
    },
  ];

  for (const set of sets) {
    if (set.keywords.some((kw) => allContent.includes(kw))) {
      return set.prompts;
    }
  }

  return [...DEFAULT_PROMPTS, ...SERVICE_PROMPTS];
}

function getMessageActions(content: string): {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] {
  const lower = content.toLowerCase();
  const actions: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [];
  if (
    lower.includes("связь") ||
    lower.includes("разработчик") ||
    lower.includes("/contact") ||
    lower.includes("контакт") ||
    lower.includes("письмо") ||
    lower.includes("email") ||
    lower.includes("fz-152") ||
    lower.includes("фз-152") ||
    lower.includes("техническ") ||
    lower.includes("предложени")
  ) {
    actions.push({
      label: "Написать разработчикам",
      href: "/contact",
      icon: MessageCircle,
    });
  }
  if (
    lower.includes("удален") ||
    lower.includes("аккаунт") ||
    lower.includes("персональн") ||
    lower.includes("согласи") ||
    lower.includes("данн") ||
    lower.includes("152-фз") ||
    lower.includes("152фз")
  ) {
    actions.push({
      label: "Подробнее об удалении",
      href: "/about",
      icon: FileText,
    });
  }
  if (
    lower.includes("тариф") ||
    lower.includes("pro") ||
    lower.includes("apex") ||
    lower.includes("цена") ||
    lower.includes("подписк") ||
    lower.includes("оплат")
  ) {
    actions.push({ label: "Тарифы", href: "/tariffs", icon: Crown });
  }
  if (
    lower.includes("faq") ||
    lower.includes("вопрос") ||
    lower.includes("часто")
  ) {
    actions.push({ label: "FAQ", href: "/faq", icon: HelpCircle });
  }
  if (
    lower.includes("промокод") ||
    lower.includes("акци") ||
    lower.includes("скидк") ||
    lower.includes("gift25")
  ) {
    actions.push({
      label: "Написать разработчикам",
      href: "/contact",
      icon: MessageCircle,
    });
  }
  return actions;
}

interface AiChatProps {
  open: boolean;
  onClose: () => void;
  initialMessage?: string | null;
}

export default function AiChat({ open, onClose, initialMessage }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextBuilt, setContextBuilt] = useState(false);
  const [userContext, setUserContext] = useState("");
  const [showMainMenu, setShowMainMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const contextualPrompts = useMemo(
    () =>
      showMainMenu
        ? [...DEFAULT_PROMPTS, ...SERVICE_PROMPTS]
        : suggestPrompts(messages),
    [messages, showMainMenu],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setShowMainMenu(false);
      setLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            context: userContext,
            faqContext,
          }),
        });

        const data = await res.json();
        const reply =
          data.choices?.[0]?.message?.content ||
          data.error ||
          "Не удалось получить ответ.";

        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Ошибка соединения. Попробуйте ещё раз.",
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading, userContext],
  );

  const handleClear = () => {
    clearMessages();
    setMessages([]);
    setContextBuilt(false);
    setUserContext("");
  };

  useEffect(() => {
    if (open) {
      setMessages(loadMessages());
      setTimeout(() => inputRef.current?.focus(), 300);
      if (!contextBuilt) {
        buildUserContext().then((ctx) => {
          setUserContext(ctx);
          setContextBuilt(true);
        });
      }
    }
  }, [open, contextBuilt]);

  useEffect(() => {
    if (open && initialMessage && contextBuilt) {
      sendMessage(initialMessage);
    }
  }, [open, initialMessage, contextBuilt, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        ref={panelRef}
        className={cn(
          "fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-full sm:w-[420px] z-[101]",
          "flex flex-col bg-background border-l shadow-[0_0_40px_-12px_rgba(0,0,0,0.3)]",
          "rounded-tl-2xl rounded-bl-2xl overflow-hidden",
          "translate-x-0 transition-transform duration-300",
        )}
        style={{
          animation: "slideInFromRight 0.3s ease-out",
        }}
      >
        <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
        {/* Header */}
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-primary via-primary/80 to-primary" />
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-gradient-to-r from-primary/10 via-background to-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/30">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI-помощник</p>
              <p className="text-[10px] text-muted-foreground/60">In Motion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
              title="Очистить историю"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm">
                  <p className="font-medium mb-1">
                    Привет! Я — твой AI-помощник
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Могу рассказать о твоих задачах, контент-плане, помочь с
                    финансами, привычками или ответить на вопросы о сервисе. Вот
                    что я умею:
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      Посмотреть задачи на сегодня
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      Контент-план: задачи, статусы, ближайшие публикации
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      Анализ финансов и бюджета
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      Статистика привычек
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                      FAQ, тарифы и информация о сервисе
                    </li>
                  </ul>
                </div>
              </div>

              {!contextBuilt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60 animate-pulse px-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Загружаю данные...
                </div>
              )}

              {/* Default prompts */}
              <div>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium mb-2 px-1">
                  Быстрый старт
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DEFAULT_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => sendMessage(prompt.text)}
                      disabled={loading || !contextBuilt}
                      className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 text-xs text-left hover:bg-muted/50 hover:border-primary/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <prompt.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium leading-tight">
                        {prompt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service prompts */}
              <div>
                <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium mb-2 px-1">
                  О сервисе
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.label}
                      onClick={() => sendMessage(prompt.text)}
                      disabled={loading || !contextBuilt}
                      className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 text-xs text-left hover:bg-muted/50 hover:border-primary/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <prompt.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium leading-tight">
                        {prompt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={msg.id}>
                  <div
                    className={cn(
                      "flex items-start gap-3",
                      msg.role === "user" && "flex-row-reverse",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-primary to-primary/80"
                          : "bg-primary/10",
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <Bot className="h-3.5 w-3.5 text-white" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-sm max-w-[85%]",
                        msg.role === "assistant"
                          ? "bg-muted/50"
                          : "bg-primary/10",
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {sanitize(msg.content)}
                      </p>
                      {msg.role === "assistant" &&
                        (() => {
                          const actions = getMessageActions(msg.content);
                          if (actions.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/40">
                              {actions.map((action) => (
                                <Link
                                  key={action.label}
                                  href={action.href}
                                  onClick={onClose}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <action.icon className="h-3 w-3" />
                                  {action.label}
                                </Link>
                              ))}
                            </div>
                          );
                        })()}
                    </div>
                  </div>

                  {/* Contextual follow-up prompts after the last assistant message */}
                  {msg.role === "assistant" && i === messages.length - 1 && (
                    <div className="mt-3 ml-10 space-y-2">
                      <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">
                        {showMainMenu ? "Быстрый старт" : "Продолжить:"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {contextualPrompts.map((prompt) => (
                          <button
                            key={prompt.label}
                            onClick={() => sendMessage(prompt.text)}
                            disabled={loading}
                            className="flex items-center gap-1.5 rounded-lg border bg-background/80 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
                          >
                            <prompt.icon className="h-3 w-3 text-primary shrink-0" />
                            {prompt.label}
                          </button>
                        ))}
                        {!showMainMenu && (
                          <button
                            onClick={() => setShowMainMenu(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-dashed bg-background/50 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all"
                          >
                            <ChevronRight className="h-3 w-3 shrink-0" />В
                            главное меню
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="rounded-xl bg-muted/50 px-3.5 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Спроси что-нибудь..."
              className="h-9 text-sm"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={!input.trim() || loading}
              className="shrink-0 h-9 w-9"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              AI может ошибаться
            </span>
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Не выполняет действия
            </span>
            <span className="w-px h-3 bg-border/50 hidden sm:block" />
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              История хранится 3 дня
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
