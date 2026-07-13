"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
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
  MessageSquare,
  Trash2,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getAccountsByUser,
  getTransactionsByUser,
  getLoansByUser,
  getBudgetPlansByUser,
  getGoalsByUser,
  getCategoriesByUser,
} from "@/lib/finance-client";
import type { FinanceAccount, Transaction, Loan, BudgetPlan, FinanceGoal, TransactionCategory } from "@/lib/finance-types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_PROMPTS = [
  { icon: Calendar, label: "Задачи на сегодня", text: "Что у меня по задачам на сегодня?" },
  { icon: DollarSign, label: "Финансы", text: "Расскажи о моих финансах" },
  { icon: ListChecks, label: "Привычки", text: "Как у меня с привычками?" },
  { icon: Lightbulb, label: "Совет дня", text: "Дай совет по планированию дня" },
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

async function buildUserContext(): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) return "Пользователь не авторизован.";

  const parts: string[] = [];

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
      const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
      parts.push(
        `Счета (${accounts.length}): общий баланс ${totalBalance.toLocaleString()} ₽. ${accounts.map((a) => `${a.name}: ${a.balance.toLocaleString()} ${a.currency}`).join(", ")}`,
      );
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
      const overdue = loans.filter((l) => l.overdueMonths > 0).length;
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
        (b) =>
          b.period === "month" &&
          b.periodStart.startsWith(thisMonth),
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
    parts.push("Ошибка при загрузке данных.");
  }

  if (parts.length === 0) {
    return "Нет данных о пользователе.";
  }

  return parts.join("\n");
}

interface AiChatProps {
  open: boolean;
  onClose: () => void;
}

export default function AiChat({ open, onClose }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextBuilt, setContextBuilt] = useState(false);
  const [userContext, setUserContext] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMessages(loadMessages());
      setTimeout(() => inputRef.current?.focus(), 100);
      if (!contextBuilt) {
        buildUserContext().then((ctx) => {
          setUserContext(ctx);
          setContextBuilt(true);
        });
      }
    }
  }, [open, contextBuilt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages]);

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
      setLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            context: userContext,
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 isolate z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border bg-background shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI-помощник</p>
              <p className="text-[10px] text-muted-foreground/60">
                In Motion
              </p>
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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-sm">
                  <p className="font-medium mb-1">
                    Привет! 👋 Я — твой AI-помощник
                  </p>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Могу рассказать о твоих задачах, помочь с финансами или
                    привычками. Вот что я умею:
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-violet-500 shrink-0" />
                      Посмотреть задачи на сегодня
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-violet-500 shrink-0" />
                      Анализ финансов и бюджета
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-violet-500 shrink-0" />
                      Статистика привычек
                    </li>
                    <li className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3 text-violet-500 shrink-0" />
                      Советы по планированию
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

              <div className="grid grid-cols-2 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => sendMessage(prompt.text)}
                    disabled={loading || !contextBuilt}
                    className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2.5 text-xs text-left hover:bg-muted/50 hover:border-primary/30 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <prompt.icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="font-medium leading-tight">
                      {prompt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3",
                  msg.role === "user" && "flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-violet-500 to-purple-600"
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
                      : "bg-primary/10 text-primary-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
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

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              AI может ошибаться — проверяйте информацию
            </span>
            <span className="w-px h-3 bg-border/50" />
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              История хранится 3 дня
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
