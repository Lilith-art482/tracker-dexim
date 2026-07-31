"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  AlertTriangle,
  LayoutDashboard,
  CheckSquare,
  Columns3,
  CalendarDays,
  DollarSign,
  CreditCard,
  Receipt,
  PiggyBank,
  Target,
  HandCoins,
  ShoppingCart,
  Repeat,
  ShieldCheck,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAllBoards, type Board } from "@/lib/models";

interface ResetDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlannerOptions {
  boards: boolean;
  personalTasks: boolean;
  kanbanTasks: boolean;
  planEntries: boolean;
  boardId?: string;
}

interface FinanceOptions {
  accounts: boolean;
  transactions: boolean;
  categories: boolean;
  budgets: boolean;
  goals: boolean;
  loans: boolean;
  shoppingLists: boolean;
  recurringPayments: boolean;
  emergencyFund: boolean;
}

export function ResetDataDialog({ open, onOpenChange }: ResetDataDialogProps) {
  const [step, setStep] = useState<"select" | "confirm" | "loading">("select");
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("all");

  const [plannerExpanded, setPlannerExpanded] = useState(false);
  const [planner, setPlanner] = useState<PlannerOptions>({
    boards: false,
    personalTasks: false,
    kanbanTasks: false,
    planEntries: false,
  });

  const [financeExpanded, setFinanceExpanded] = useState(false);
  const [finance, setFinance] = useState<FinanceOptions>({
    accounts: false,
    transactions: false,
    categories: false,
    budgets: false,
    goals: false,
    loans: false,
    shoppingLists: false,
    recurringPayments: false,
    emergencyFund: false,
  });

  const [notes, setNotes] = useState(false);
  const [blogReadStatus, setBlogReadStatus] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("select");
      setPlanner({
        boards: false,
        personalTasks: false,
        kanbanTasks: false,
        planEntries: false,
      });
      setFinance({
        accounts: false,
        transactions: false,
        categories: false,
        budgets: false,
        goals: false,
        loans: false,
        shoppingLists: false,
        recurringPayments: false,
        emergencyFund: false,
      });
      setNotes(false);
      setBlogReadStatus(false);
      setSelectedBoardId("all");
      setPlannerExpanded(false);
      setFinanceExpanded(false);

      getAllBoards()
        .then((b) => setBoards(b))
        .catch(() => {});
    }
  }, [open]);

  const hasAnySelection =
    planner.boards ||
    planner.personalTasks ||
    planner.kanbanTasks ||
    planner.planEntries ||
    finance.accounts ||
    finance.transactions ||
    finance.categories ||
    finance.budgets ||
    finance.goals ||
    finance.loans ||
    finance.shoppingLists ||
    finance.recurringPayments ||
    finance.emergencyFund ||
    notes ||
    blogReadStatus;

  const handleResetAll = useCallback(async () => {
    setStep("confirm");
  }, []);

  const executeResetAll = useCallback(async () => {
    setStep("loading");
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Не авторизован");
        setStep("select");
        return;
      }
      const res = await fetch("/api/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          boards: true,
          personalTasks: true,
          kanbanTasks: true,
          planEntries: true,
          finance: {
            accounts: true,
            transactions: true,
            categories: true,
            budgets: true,
            goals: true,
            loans: true,
            shoppingLists: true,
            recurringPayments: true,
            emergencyFund: true,
          },
          notes: true,
          blogReadStatus: true,
        }),
      });

      if (res.ok) {
        localStorage.removeItem("inmotion_blog_read");
        toast.success("Все данные удалены");
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
        setStep("select");
      }
    } catch {
      toast.error("Ошибка сети");
      setStep("select");
    }
  }, [onOpenChange]);

  const executeSelectiveReset = useCallback(async () => {
    setStep("loading");
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Не авторизован");
        setStep("select");
        return;
      }

      const payload: Record<string, unknown> = { uid: user.uid };

      if (
        planner.boards ||
        planner.personalTasks ||
        planner.kanbanTasks ||
        planner.planEntries
      ) {
        payload.boards = planner.boards;
        payload.personalTasks = planner.personalTasks;
        payload.kanbanTasks = planner.kanbanTasks;
        payload.planEntries = planner.planEntries;
        if (selectedBoardId !== "all") {
          payload.boardId = selectedBoardId;
        }
      }

      const hasFinanceSelection = Object.values(finance).some(Boolean);
      if (hasFinanceSelection) {
        payload.finance = { ...finance };
      }

      if (notes) payload.notes = true;
      if (blogReadStatus) payload.blogReadStatus = true;

      const res = await fetch("/api/reset-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const deleted = data.deleted as Record<string, number>;
        const total = Object.values(deleted).reduce((a, b) => a + b, 0);

        if (blogReadStatus) {
          localStorage.removeItem("inmotion_blog_read");
        }

        toast.success(`Удалено записей: ${total}`);
        onOpenChange(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Ошибка удаления");
        setStep("select");
      }
    } catch {
      toast.error("Ошибка сети");
      setStep("select");
    }
  }, [planner, finance, notes, blogReadStatus, selectedBoardId, onOpenChange]);

  const toggleFinance = (key: keyof FinanceOptions) => {
    setFinance((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" />
            Сброс данных
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4 py-2">
            {/* Reset All */}
            <div className="rounded-xl border border-rose-200/60 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/30 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                    Сбросить всё
                  </p>
                  <p className="text-xs text-rose-600/70 dark:text-rose-400/60 mt-0.5">
                    Удалит все задачи, доски, финансы, заметки. Блог останется,
                    но прочитанные статьи пометятся как непрочитанные.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleResetAll}
                    className="mt-3 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Сбросить всё
                  </Button>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/40" />

            {/* Selective Reset */}
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Выберите что удалить
            </p>

            {/* Planner */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <button
                onClick={() => setPlannerExpanded(!plannerExpanded)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <LayoutDashboard className="h-4 w-4 text-violet-500 shrink-0" />
                <span className="text-sm font-medium flex-1">Планнер</span>
                {plannerExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {plannerExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t border-border/30">
                  {/* Board selector */}
                  <div className="pt-2">
                    <label className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider mb-1 block">
                      Доска
                    </label>
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setSelectedBoardId("all")}
                        className={cn(
                          "px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                          selectedBoardId === "all"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        Все доски
                      </button>
                      {boards.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedBoardId(b.id)}
                          className={cn(
                            "px-2 py-1 rounded-md text-[11px] font-medium transition-colors truncate max-w-[100px]",
                            selectedBoardId === b.id
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode toggles */}
                  {(
                    [
                      ["boards", "Доски и все задачи в них", LayoutDashboard],
                      [
                        "personalTasks",
                        "Задачи из таблицы/списка",
                        CheckSquare,
                      ],
                      ["kanbanTasks", "Задачи из канбана", Columns3],
                      ["planEntries", "Записи плана", CalendarDays],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={planner[key]}
                        onChange={() =>
                          setPlanner((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Finance */}
            <div className="rounded-xl border border-border/40 overflow-hidden">
              <button
                onClick={() => setFinanceExpanded(!financeExpanded)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium flex-1">Финансы</span>
                {financeExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {financeExpanded && (
                <div className="px-3 pb-3 space-y-1 border-t border-border/30 pt-2">
                  {(
                    [
                      ["accounts", "Счета", CreditCard],
                      ["transactions", "Транзакции", Receipt],
                      ["categories", "Категории", Receipt],
                      ["budgets", "Бюджет планирования", PiggyBank],
                      ["goals", "Цели", Target],
                      ["loans", "Обязательства", HandCoins],
                      ["shoppingLists", "Списки покупок", ShoppingCart],
                      ["recurringPayments", "Регулярные платежи", Repeat],
                      ["emergencyFund", "Подушка безопасности", ShieldCheck],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={finance[key]}
                        onChange={() => toggleFinance(key)}
                        className="h-3.5 w-3.5 rounded border-border accent-primary"
                      />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs">{label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/40 hover:bg-muted/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={notes}
                onChange={() => setNotes(!notes)}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
              <FileText className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm font-medium">Заметки</span>
            </label>

            {/* Blog read status */}
            <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/40 hover:bg-muted/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={blogReadStatus}
                onChange={() => setBlogReadStatus(!blogReadStatus)}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
              <FileText className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="text-sm font-medium">
                Сбросить статус прочтения блога
              </span>
            </label>

            {/* Habits & Sport - disabled */}
            <div className="rounded-xl border border-border/20 bg-muted/20 px-3 py-2.5 opacity-60">
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-muted-foreground">
                  Привычки, Спорт и Питание — функции удаления появятся позже
                </span>
              </div>
            </div>

            {/* Submit */}
            {hasAnySelection && (
              <Button
                variant="destructive"
                onClick={executeSelectiveReset}
                className="w-full gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Удалить выбранное
              </Button>
            )}
          </div>
        )}

        {step === "confirm" && (
          <div className="py-6 text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mx-auto">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">Вы уверены?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Это действие нельзя отменить. Все данные будут удалены
                безвозвратно.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("select")}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={executeResetAll}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Да, удалить всё
              </Button>
            </div>
          </div>
        )}

        {step === "loading" && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Удаление данных...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
