"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Landmark,
  Calculator,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import type { Loan } from "@/lib/finance-types";
import { auth } from "@/lib/firebase";
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

function calcMonthlyPayment(P: number, annualRate: number, n: number) {
  if (annualRate === 0) return P / n;
  const r = annualRate / 100 / 12;
  return (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
}

function calcMonths(P: number, annualRate: number, M: number) {
  if (M <= 0) return Infinity;
  if (annualRate === 0) return Math.ceil(P / M);
  const r = annualRate / 100 / 12;
  if (M <= P * r) return Infinity;
  return Math.ceil(Math.log(M / (M - P * r)) / Math.log(1 + r));
}

function getPayoffDate(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

interface CalcSuccess {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  payoffMonths: number;
  payoffDate: string;
}

type CalcResult = CalcSuccess | { error: string };

export function FinanceLoans() {
  const uid = auth.currentUser?.uid || "user-1";

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formRemaining, setFormRemaining] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formPayment, setFormPayment] = useState("");
  const [formStartDate, setFormStartDate] = useState("");

  const [calcAmount, setCalcAmount] = useState("");
  const [calcRate, setCalcRate] = useState("");
  const [calcTerm, setCalcTerm] = useState("");
  const [calcMonthly, setCalcMonthly] = useState("");
  const [calcMode, setCalcMode] = useState<"payment" | "term">("payment");

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/loans?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setLoans(Array.isArray(data) ? data : []);
      }
    } catch {
      console.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormTotal("");
    setFormRemaining("");
    setFormRate("");
    setFormPayment("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setEditingLoan(null);
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((loan: Loan) => {
    setEditingLoan(loan);
    setFormName(loan.name);
    setFormTotal(String(loan.totalAmount));
    setFormRemaining(String(loan.remainingAmount));
    setFormRate(String(loan.interestRate));
    setFormPayment(String(loan.monthlyPayment));
    setFormStartDate(loan.createdAt.split("T")[0]);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingLoan(null);
  }, []);

  const handleSave = async () => {
    if (!formName || !formTotal || !formRate || !formPayment) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const totalAmount = parseFloat(formTotal);
    const remainingAmount = parseFloat(formRemaining) || totalAmount;
    const interestRate = parseFloat(formRate);
    const monthlyPayment = parseFloat(formPayment);

    if (
      isNaN(totalAmount) ||
      isNaN(interestRate) ||
      isNaN(monthlyPayment) ||
      totalAmount <= 0 ||
      interestRate < 0 ||
      monthlyPayment <= 0
    ) {
      toast.error("Проверьте правильность введённых данных");
      return;
    }

    const toastId = toast.loading("Сохраняем...");

    try {
      if (editingLoan) {
        const res = await fetch("/api/finance/loans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingLoan.id,
            name: formName,
            totalAmount,
            remainingAmount,
            interestRate,
            monthlyPayment,
            startDate: formStartDate,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          setLoans((prev) =>
            prev.map((l) => (l.id === editingLoan.id ? updated : l)),
          );
          toast.success("Готово", { id: toastId });
          closeDialog();
        } else {
          const err = await res.json();
          toast.error(err.error || "Ошибка при сохранении", { id: toastId });
        }
      } else {
        const res = await fetch("/api/finance/loans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            totalAmount,
            remainingAmount,
            interestRate,
            monthlyPayment,
            startDate: formStartDate,
            userId: uid,
          }),
        });

        if (res.ok) {
          const created = await res.json();
          setLoans((prev) => [...prev, created]);
          toast.success("Готово", { id: toastId });
          closeDialog();
        } else {
          const err = await res.json();
          toast.error(err.error || "Ошибка при создании", { id: toastId });
        }
      }
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  };

  const handleMakePayment = async (loan: Loan) => {
    const paymentAmount = loan.monthlyPayment;
    const toastId = toast.loading("Проводим платёж...");

    try {
      const res = await fetch("/api/finance/loans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: loan.id, paymentAmount }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLoans((prev) => prev.map((l) => (l.id === loan.id ? updated : l)));
        toast.success("Платёж проведён", { id: toastId });
      } else {
        const err = await res.json();
        toast.error(err.error || "Ошибка платежа", { id: toastId });
      }
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  };

  const handleDelete = (loan: Loan) => {
    toast(`Удалить «${loan.name}»?`, {
      action: {
        label: "Удалить",
        onClick: async () => {
          const toastId = toast.loading("Удаляем...");
          try {
            const res = await fetch("/api/finance/loans", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: loan.id }),
            });
            if (res.ok) {
              setLoans((prev) => prev.filter((l) => l.id !== loan.id));
              toast.success("Удалено", { id: toastId });
            } else {
              toast.error("Ошибка при удалении", { id: toastId });
            }
          } catch {
            toast.error("Ошибка сети", { id: toastId });
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const calcResults = useMemo((): CalcResult | null => {
    const P = parseFloat(calcAmount);
    const annualRate = parseFloat(calcRate);

    if (!P || P <= 0 || isNaN(annualRate) || annualRate < 0) return null;

    if (calcMode === "payment") {
      const n = parseInt(calcTerm);
      if (!n || n <= 0) return null;
      const M = calcMonthlyPayment(P, annualRate, n);
      const totalCost = M * n;
      return {
        monthlyPayment: M,
        totalInterest: totalCost - P,
        totalCost,
        payoffMonths: n,
        payoffDate: getPayoffDate(n),
      };
    }

    if (calcMode === "term") {
      const M = parseFloat(calcMonthly);
      if (!M || M <= 0) return null;
      const n = calcMonths(P, annualRate, M);
      if (n === Infinity) {
        return { error: "Платёж слишком мал — он не покрывает проценты" };
      }
      const totalCost = M * n;
      return {
        monthlyPayment: M,
        totalInterest: totalCost - P,
        totalCost,
        payoffMonths: n,
        payoffDate: getPayoffDate(n),
      };
    }

    return null;
  }, [calcAmount, calcRate, calcTerm, calcMonthly, calcMode]);

  const loanStats = useMemo(
    () =>
      loans.map((loan) => {
        const totalMonths = calcMonths(
          loan.totalAmount,
          loan.interestRate,
          loan.monthlyPayment,
        );
        const monthsRemaining = calcMonths(
          loan.remainingAmount,
          loan.interestRate,
          loan.monthlyPayment,
        );
        const paidAmount = loan.totalAmount - loan.remainingAmount;
        const progressPct =
          loan.totalAmount > 0
            ? Math.min((paidAmount / loan.totalAmount) * 100, 100)
            : 0;
        const totalInterest =
          totalMonths === Infinity
            ? Infinity
            : loan.monthlyPayment * totalMonths - loan.totalAmount;
        const interestPaidRatio =
          totalMonths > 0 && totalMonths !== Infinity
            ? 1 - monthsRemaining / totalMonths
            : loan.totalAmount > 0
              ? paidAmount / loan.totalAmount
              : 0;
        const interestPaid =
          totalInterest === Infinity
            ? 0
            : Math.max(0, totalInterest * interestPaidRatio);
        const totalCost =
          totalMonths === Infinity
            ? Infinity
            : loan.monthlyPayment * totalMonths;

        return {
          ...loan,
          totalMonths,
          monthsRemaining,
          paidAmount,
          progressPct,
          totalInterest,
          interestPaid,
          totalCost,
        };
      }),
    [loans],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Landmark className="h-5 w-5" />
          Кредиты
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCalcOpen(true)}>
            <Calculator className="h-4 w-4 mr-1" />
            Калькулятор
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>
      </div>

      {loans.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Landmark className="h-6 w-6" />
              </div>
              <p className="text-sm">Нет кредитов</p>
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить кредит
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loanStats.map((loan) => (
            <Card key={loan.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {loan.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {loan.interestRate}% ·{" "}
                      {loan.monthlyPayment.toLocaleString()} ₽/мес
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(loan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(loan)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Всего</p>
                    <p className="text-sm font-semibold">
                      {loan.totalAmount.toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Остаток</p>
                    <p className="text-sm font-semibold">
                      {loan.remainingAmount.toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Проценты выплачено
                    </p>
                    <p className="text-sm font-semibold text-amber-600">
                      {Math.round(loan.interestPaid).toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Осталось</p>
                    <p className="text-sm font-semibold">
                      {loan.monthsRemaining === Infinity
                        ? "—"
                        : `${loan.monthsRemaining} мес.`}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Выплачено</span>
                    <span>{Math.round(loan.progressPct)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${loan.progressPct}%` }}
                    />
                  </div>
                </div>

                {loan.totalCost !== Infinity &&
                  loan.totalCost > loan.totalAmount * 1.3 && (
                    <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-600">
                        Переплата &gt;30% — всего{" "}
                        {Math.round(
                          (loan.totalCost / loan.totalAmount - 1) * 100,
                        )}
                        % от суммы кредита
                      </p>
                    </div>
                  )}

                <Button
                  className="w-full"
                  size="sm"
                  disabled={loan.remainingAmount <= 0}
                  onClick={() => handleMakePayment(loan)}
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  {loan.remainingAmount <= 0
                    ? "Погашен"
                    : `Внести ${loan.monthlyPayment.toLocaleString()} ₽`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLoan ? "Редактировать кредит" : "Добавить кредит"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Например, Ипотека"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Общая сумма</label>
              <Input
                type="number"
                value={formTotal}
                onChange={(e) => setFormTotal(e.target.value)}
                placeholder="5 000 000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Остаток</label>
              <Input
                type="number"
                value={formRemaining}
                onChange={(e) => setFormRemaining(e.target.value)}
                placeholder={formTotal || "4 200 000"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Процентная ставка (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={formRate}
                onChange={(e) => setFormRate(e.target.value)}
                placeholder="8"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ежемесячный платёж</label>
              <Input
                type="number"
                value={formPayment}
                onChange={(e) => setFormPayment(e.target.value)}
                placeholder="45 000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Дата начала</label>
              <Input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingLoan ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amortization Calculator Dialog */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Кредитный калькулятор
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Сумма кредита</label>
              <Input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                placeholder="5 000 000"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Годовая ставка (%)</label>
              <Input
                type="number"
                step="0.1"
                value={calcRate}
                onChange={(e) => setCalcRate(e.target.value)}
                placeholder="8"
              />
            </div>

            {calcMode === "payment" ? (
              <div>
                <label className="text-sm font-medium">Срок (месяцев)</label>
                <Input
                  type="number"
                  value={calcTerm}
                  onChange={(e) => setCalcTerm(e.target.value)}
                  placeholder="120"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">
                  Ежемесячный платёж
                </label>
                <Input
                  type="number"
                  value={calcMonthly}
                  onChange={(e) => setCalcMonthly(e.target.value)}
                  placeholder="45 000"
                />
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() =>
                setCalcMode(calcMode === "payment" ? "term" : "payment")
              }
            >
              {calcMode === "payment"
                ? "Рассчитать срок по платежу"
                : "Рассчитать платёж по сроку"}
            </Button>

            {calcResults && !("error" in calcResults) && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <h4 className="text-sm font-medium">Результат</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Ежемесячный платёж
                    </p>
                    <p className="font-semibold">
                      {Math.round(calcResults.monthlyPayment).toLocaleString()}{" "}
                      ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Всего процентов
                    </p>
                    <p
                      className={cn(
                        "font-semibold",
                        calcResults.totalInterest > 0
                          ? "text-amber-600"
                          : "text-emerald-600",
                      )}
                    >
                      {Math.round(calcResults.totalInterest).toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Общая стоимость
                    </p>
                    <p className="font-semibold">
                      {Math.round(calcResults.totalCost).toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Дата погашения
                    </p>
                    <p className="font-semibold">{calcResults.payoffDate}</p>
                  </div>
                </div>

                {calcResults.totalCost >
                  parseFloat(calcAmount || "0") * 1.3 && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-600">
                      Переплата превышает 30% от суммы кредита
                    </p>
                  </div>
                )}
              </div>
            )}

            {calcResults && "error" in calcResults && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-600">{calcResults.error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setCalcOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
