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
  Percent,
  Ban,
  Search,
  Filter,
  ArrowUpDown,
  Gauge,
  Wallet,
  Clock,
  ArrowRight,
  Coins,
  CircleOff,
} from "lucide-react";
import type { Loan } from "@/lib/finance-types";
import {
  getLoansByUser,
  createLoan,
  updateLoan,
  deleteLoan,
} from "@/lib/finance-client";
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
  DialogDescription,
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

function calcMonthlyPayment(P: number, annualRate: number, n: number) {
  if (annualRate === 0) return n > 0 ? P / n : 0;
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

function calcOverdueDays(nextPaymentDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(nextPaymentDate + "T00:00:00Z");
  next.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - next.getTime()) / 86400000);
  return Math.max(0, diff);
}

interface CalcSuccess {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  payoffMonths: number;
  payoffDate: string;
}

type CalcResult = CalcSuccess | { error: string };

const STATUS_FILTERS = [
  { value: "all", label: "Все" },
  { value: "overdue", label: "Просроченные" },
  { value: "ontime", label: "Вовремя" },
  { value: "paid", label: "Погашенные" },
] as const;

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
  const [formHasInterest, setFormHasInterest] = useState(true);

  const [calcAmount, setCalcAmount] = useState("");
  const [calcRate, setCalcRate] = useState("");
  const [calcTerm, setCalcTerm] = useState("");
  const [calcMonthly, setCalcMonthly] = useState("");
  const [calcMode, setCalcMode] = useState<"payment" | "term">("payment");
  const [calcHasInterest, setCalcHasInterest] = useState(true);

  const [filterPaymentMax, setFilterPaymentMax] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [extraPayments, setExtraPayments] = useState<Record<string, string>>(
    {},
  );

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoansByUser(uid);
      setLoans(data);
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
    setFormHasInterest(true);
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
    setFormHasInterest(loan.interestRate > 0);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingLoan(null);
  }, []);

  const handleSave = async () => {
    if (!formName || !formTotal || !formPayment) {
      toast.error("Заполните обязательные поля");
      return;
    }

    const totalAmount = parseFloat(formTotal);
    const remainingAmount = parseFloat(formRemaining) || totalAmount;
    const interestRate = formHasInterest ? parseFloat(formRate) : 0;
    const monthlyPayment = parseFloat(formPayment);

    if (
      isNaN(totalAmount) ||
      (formHasInterest && isNaN(interestRate)) ||
      isNaN(monthlyPayment) ||
      totalAmount <= 0 ||
      (formHasInterest && interestRate < 0) ||
      monthlyPayment <= 0
    ) {
      toast.error("Проверьте правильность введённых данных");
      return;
    }

    const toastId = toast.loading("Сохраняем...");

    try {
      if (editingLoan) {
        const updated = await updateLoan(editingLoan.id, {
          name: formName,
          totalAmount,
          remainingAmount,
          interestRate,
          monthlyPayment,
        });
        setLoans((prev) =>
          prev.map((l) => (l.id === editingLoan.id ? updated : l)),
        );
        toast.success("Готово", { id: toastId });
        closeDialog();
      } else {
        const id = crypto.randomUUID();
        const created = await createLoan({
          id,
          userId: uid,
          name: formName,
          totalAmount,
          remainingAmount,
          interestRate,
          monthlyPayment,
          nextPaymentDate:
            formStartDate || new Date().toISOString().split("T")[0],
        });
        setLoans((prev) => [...prev, created]);
        toast.success("Готово", { id: toastId });
        closeDialog();
      }
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  };

  const handleMakePayment = async (loan: Loan) => {
    const paymentAmount = loan.monthlyPayment;
    const toastId = toast.loading("Проводим платёж...");

    try {
      const newRemaining = Math.max(0, loan.remainingAmount - paymentAmount);
      const updated = await updateLoan(loan.id, {
        remainingAmount: newRemaining,
      });
      setLoans((prev) => prev.map((l) => (l.id === loan.id ? updated : l)));
      toast.success("Платёж проведён", { id: toastId });
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
            await deleteLoan(loan.id);
            setLoans((prev) => prev.filter((l) => l.id !== loan.id));
            toast.success("Удалено", { id: toastId });
          } catch {
            toast.error("Ошибка сети", { id: toastId });
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  const handleEarlyRepayment = async (loan: Loan) => {
    const extra = parseFloat(extraPayments[loan.id] || "0");
    if (!extra || extra <= 0) {
      toast.error("Укажите сумму досрочного погашения");
      return;
    }
    const toastId = toast.loading("Погашаем досрочно...");
    try {
      const newRemaining = Math.max(0, loan.remainingAmount - extra);
      const updated = await updateLoan(loan.id, {
        remainingAmount: newRemaining,
      });
      setLoans((prev) => prev.map((l) => (l.id === loan.id ? updated : l)));
      setExtraPayments((prev) => ({ ...prev, [loan.id]: "" }));
      toast.success("Досрочное погашение проведено", { id: toastId });
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  };

  const calcResults = useMemo((): CalcResult | null => {
    const P = parseFloat(calcAmount);
    const annualRate = calcHasInterest ? parseFloat(calcRate) : 0;

    if (
      !P ||
      P <= 0 ||
      (calcHasInterest && (isNaN(annualRate) || annualRate < 0))
    )
      return null;

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
        return { error: "Платёж слишком мал" };
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
  }, [calcAmount, calcRate, calcTerm, calcMonthly, calcMode, calcHasInterest]);

  const enrichedLoans = useMemo(
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
        const isPaid = loan.remainingAmount <= 0;
        const overdueDays = isPaid ? 0 : calcOverdueDays(loan.nextPaymentDate);
        const isOverdue = overdueDays > 0;

        const monthsElapsed =
          totalMonths === Infinity ? 0 : totalMonths - monthsRemaining;
        const monthProgressPct =
          totalMonths > 0 && totalMonths !== Infinity
            ? Math.min((monthsElapsed / totalMonths) * 100, 100)
            : 0;

        const monthlyInterestPortion =
          loan.interestRate > 0 && loan.remainingAmount > 0
            ? (loan.remainingAmount * (loan.interestRate / 100)) / 12
            : 0;
        const monthlyPrincipalPortion = isPaid
          ? 0
          : Math.max(0, loan.monthlyPayment - monthlyInterestPortion);

        const nextPayDate = new Date(loan.nextPaymentDate + "T00:00:00Z");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffMs = nextPayDate.getTime() - today.getTime();
        const daysUntilNextPayment = Math.ceil(diffMs / 86400000);

        const healthStatus = isPaid
          ? "paid"
          : isOverdue
            ? "critical"
            : progressPct < 25
              ? "early"
              : progressPct > 75
                ? "almost-there"
                : "on-track";

        return {
          ...loan,
          totalMonths,
          monthsRemaining,
          monthsElapsed,
          monthProgressPct,
          paidAmount,
          progressPct,
          monthlyInterestPortion,
          monthlyPrincipalPortion,
          daysUntilNextPayment,
          totalInterest,
          interestPaid,
          totalCost,
          isPaid,
          overdueDays,
          isOverdue,
          healthStatus,
        };
      }),
    [loans],
  );

  const filteredLoans = useMemo(() => {
    return enrichedLoans.filter((loan) => {
      if (
        filterPaymentMax &&
        loan.monthlyPayment > parseFloat(filterPaymentMax)
      )
        return false;
      if (filterStatus === "overdue" && !loan.isOverdue) return false;
      if (filterStatus === "ontime" && (loan.isOverdue || loan.isPaid))
        return false;
      if (filterStatus === "paid" && !loan.isPaid) return false;
      return true;
    });
  }, [enrichedLoans, filterPaymentMax, filterStatus]);

  const totalOwed = useMemo(
    () => enrichedLoans.reduce((s, l) => s + l.remainingAmount, 0),
    [enrichedLoans],
  );

  const totalMonthly = useMemo(
    () => enrichedLoans.reduce((s, l) => s + l.monthlyPayment, 0),
    [enrichedLoans],
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Обязательства
          </h2>
          {loans.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {enrichedLoans.filter((l) => l.isOverdue).length > 0 && (
                <span className="text-rose-600 font-medium">
                  {enrichedLoans.filter((l) => l.isOverdue).length} просрочено
                  ·{" "}
                </span>
              )}
              {enrichedLoans.filter((l) => l.isPaid).length} погашено
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
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

      {loans.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Общая задолженность
                </p>
                <p className="text-xl font-bold tabular-nums mt-0.5">
                  {totalOwed.toLocaleString()} ₽
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Ежемесячный платёж
                </p>
                <p className="text-xl font-bold tabular-nums mt-0.5">
                  {totalMonthly.toLocaleString()} ₽
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Кол-во обязательств
                </p>
                <p className="text-xl font-bold tabular-nums mt-0.5">
                  {enrichedLoans.length}
                  {enrichedLoans.some((l) => l.isOverdue) && (
                    <span className="text-sm font-normal text-rose-600 ml-2">
                      · {enrichedLoans.filter((l) => l.isOverdue).length}{" "}
                      просрочено
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="number"
                value={filterPaymentMax}
                onChange={(e) => setFilterPaymentMax(e.target.value)}
                placeholder="Макс. платёж"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => v && setFilterStatus(v)}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {loans.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Landmark className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Нет обязательств</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Добавьте кредит, рассрочку или долг
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Добавить обязательство
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredLoans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Нет обязательств по выбранным фильтрам
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLoans.map((loan) => (
            <Card
              key={loan.id}
              className={cn(
                "overflow-hidden transition-all hover:shadow-sm",
                loan.isPaid && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "h-1 w-full",
                  loan.isPaid
                    ? "bg-emerald-500"
                    : loan.isOverdue
                      ? "bg-rose-500"
                      : "bg-emerald-400",
                )}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-semibold truncate">
                        {loan.name}
                      </CardTitle>
                      {loan.isPaid && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shrink-0"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                          Погашен
                        </Badge>
                      )}
                      {loan.isOverdue && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0 h-5 shrink-0"
                        >
                          <Clock className="h-3 w-3 mr-0.5" />
                          {loan.overdueDays} дн.
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {loan.interestRate > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 font-normal"
                        >
                          <Percent className="h-2.5 w-2.5 mr-0.5" />
                          {loan.interestRate}%
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground"
                        >
                          <Ban className="h-2.5 w-2.5 mr-0.5" />
                          Без %
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {loan.monthlyPayment.toLocaleString()} ₽/мес
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0 ml-2">
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
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-[10px] text-muted-foreground">Всего</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {loan.totalAmount.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-[10px] text-muted-foreground">Остаток</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {loan.remainingAmount.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-2">
                    <p className="text-[10px] text-muted-foreground">
                      Выплачено
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {loan.paidAmount.toLocaleString()} ₽
                    </p>
                  </div>
                </div>

                {/* Health indicator */}
                {!loan.isPaid && (
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        loan.healthStatus === "critical" &&
                          "bg-rose-500/10 text-rose-600",
                        loan.healthStatus === "early" &&
                          "bg-amber-500/10 text-amber-600",
                        loan.healthStatus === "on-track" &&
                          "bg-sky-500/10 text-sky-600",
                        loan.healthStatus === "almost-there" &&
                          "bg-emerald-500/10 text-emerald-600",
                      )}
                    >
                      <CircleOff className="h-3 w-3" />
                      {loan.healthStatus === "critical" && "Критично"}
                      {loan.healthStatus === "early" && "В начале пути"}
                      {loan.healthStatus === "on-track" && "В процессе"}
                      {loan.healthStatus === "almost-there" && "Почти погашен"}
                    </div>
                    {loan.daysUntilNextPayment > 0 &&
                      loan.daysUntilNextPayment <= 7 && (
                        <span className="text-[10px] text-amber-600 font-medium">
                          Платёж через {loan.daysUntilNextPayment} дн.
                        </span>
                      )}
                  </div>
                )}

                {/* Progress bars */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Прогресс выплаты</span>
                    <span>{Math.round(loan.progressPct)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        loan.isPaid
                          ? "bg-emerald-500"
                          : loan.isOverdue
                            ? "bg-rose-500"
                            : "bg-primary",
                      )}
                      style={{ width: `${loan.progressPct}%` }}
                    />
                  </div>
                </div>

                {loan.totalMonths > 0 && loan.totalMonths !== Infinity && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Месяцы</span>
                      <span>
                        {loan.monthsElapsed} / {loan.totalMonths}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all duration-500"
                        style={{ width: `${loan.monthProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Payment breakdown */}
                {loan.interestRate > 0 && !loan.isPaid && (
                  <div className="rounded-lg bg-muted/30 p-2.5 space-y-1.5">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Разбивка платежа
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex-1">
                        <div className="flex justify-between text-muted-foreground mb-0.5">
                          <span>Проценты</span>
                          <span className="text-amber-600 font-medium tabular-nums">
                            {Math.round(
                              loan.monthlyInterestPortion,
                            ).toLocaleString()}{" "}
                            ₽
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{
                              width: `${loan.monthlyPayment > 0 ? (loan.monthlyInterestPortion / loan.monthlyPayment) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between text-muted-foreground mb-0.5">
                          <span>Тело долга</span>
                          <span className="text-emerald-600 font-medium tabular-nums">
                            {Math.round(
                              loan.monthlyPrincipalPortion,
                            ).toLocaleString()}{" "}
                            ₽
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${loan.monthlyPayment > 0 ? (loan.monthlyPrincipalPortion / loan.monthlyPayment) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next payment countdown */}
                {!loan.isPaid && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {loan.daysUntilNextPayment > 0
                        ? `Следующий платёж через ${loan.daysUntilNextPayment} дн.`
                        : loan.daysUntilNextPayment === 0
                          ? "Платёж сегодня"
                          : `Платёж просрочен на ${Math.abs(loan.daysUntilNextPayment)} дн.`}
                    </span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        loan.daysUntilNextPayment <= 0 && "text-rose-600",
                        loan.daysUntilNextPayment > 0 &&
                          loan.daysUntilNextPayment <= 7 &&
                          "text-amber-600",
                        loan.daysUntilNextPayment > 7 &&
                          "text-muted-foreground",
                      )}
                    >
                      {new Date(loan.nextPaymentDate).toLocaleDateString(
                        "ru-RU",
                      )}
                    </span>
                  </div>
                )}

                {/* Overdue warning */}
                {loan.isOverdue && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-rose-600">
                        Просрочка {loan.overdueDays} дн.
                      </p>
                      <p className="text-[11px] text-rose-600/70 mt-0.5">
                        Следующий платёж был{" "}
                        {new Date(loan.nextPaymentDate).toLocaleDateString(
                          "ru-RU",
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Early repayment */}
                {!loan.isPaid && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={extraPayments[loan.id] || ""}
                        onChange={(e) =>
                          setExtraPayments((prev) => ({
                            ...prev,
                            [loan.id]: e.target.value,
                          }))
                        }
                        placeholder="Сумма досрочно"
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0"
                      disabled={
                        !extraPayments[loan.id] ||
                        parseFloat(extraPayments[loan.id] || "0") <= 0
                      }
                      onClick={() => handleEarlyRepayment(loan)}
                    >
                      <Coins className="h-3.5 w-3.5 mr-1" />
                      Досрочно
                    </Button>
                  </div>
                )}

                {/* Regular payment */}
                <Button
                  className="w-full"
                  size="sm"
                  variant={loan.isOverdue ? "destructive" : "default"}
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
              {editingLoan
                ? "Редактировать обязательство"
                : "Добавить обязательство"}
            </DialogTitle>
            <DialogDescription>
              {editingLoan
                ? "Измените данные обязательства"
                : "Укажите параметры кредита, рассрочки или долга"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setFormHasInterest(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  formHasInterest
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Percent className="h-3.5 w-3.5" />С процентами
              </button>
              <button
                type="button"
                onClick={() => setFormHasInterest(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  !formHasInterest
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Ban className="h-3.5 w-3.5" />
                Без процентов
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Название
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Например, Ипотека"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Сумма
                </label>
                <Input
                  type="number"
                  value={formTotal}
                  onChange={(e) => setFormTotal(e.target.value)}
                  placeholder="5 000 000"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Остаток
                </label>
                <Input
                  type="number"
                  value={formRemaining}
                  onChange={(e) => setFormRemaining(e.target.value)}
                  placeholder={formTotal || "4 200 000"}
                  className="h-9"
                />
              </div>
              {formHasInterest && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ставка %
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    placeholder="8"
                    className="h-9"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Платёж/мес
                </label>
                <Input
                  type="number"
                  value={formPayment}
                  onChange={(e) => setFormPayment(e.target.value)}
                  placeholder="45 000"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Дата начала
                </label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
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

      {/* Calculator Dialog */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Калькулятор обязательств
            </DialogTitle>
            <DialogDescription>
              Рассчитайте ежемесячный платёж или срок погашения
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setCalcHasInterest(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  calcHasInterest
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Percent className="h-3.5 w-3.5" />С процентами
              </button>
              <button
                type="button"
                onClick={() => setCalcHasInterest(false)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  !calcHasInterest
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Ban className="h-3.5 w-3.5" />
                Без процентов
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Сумма
                </label>
                <Input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="5 000 000"
                  className="h-9"
                />
              </div>
              {calcHasInterest && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Ставка %
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(e.target.value)}
                    placeholder="8"
                    className="h-9"
                  />
                </div>
              )}
              {calcMode === "payment" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Срок (мес.)
                  </label>
                  <Input
                    type="number"
                    value={calcTerm}
                    onChange={(e) => setCalcTerm(e.target.value)}
                    placeholder="120"
                    className="h-9"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Платёж/мес
                  </label>
                  <Input
                    type="number"
                    value={calcMonthly}
                    onChange={(e) => setCalcMonthly(e.target.value)}
                    placeholder="45 000"
                    className="h-9"
                  />
                </div>
              )}
            </div>

            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setCalcMode("payment")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  calcMode === "payment"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                По сроку → платёж
              </button>
              <button
                type="button"
                onClick={() => setCalcMode("term")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  calcMode === "term"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                По платежу → срок
              </button>
            </div>

            {calcResults && !("error" in calcResults) && (
              <div className="rounded-xl border bg-gradient-to-br from-muted/50 to-transparent p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Результат</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-background/80 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Ежемесячный платёж
                    </p>
                    <p className="text-lg font-bold tabular-nums text-primary">
                      {Math.round(calcResults.monthlyPayment).toLocaleString()}{" "}
                      ₽
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/80 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
                      Срок погашения
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {calcResults.payoffMonths} мес.
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {calcResults.payoffDate}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Общая стоимость
                    </p>
                    <p className="font-semibold tabular-nums">
                      {Math.round(calcResults.totalCost).toLocaleString()} ₽
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Переплата</p>
                    <p
                      className={cn(
                        "font-semibold tabular-nums",
                        calcResults.totalInterest > 0
                          ? "text-amber-600"
                          : "text-emerald-600",
                      )}
                    >
                      {Math.round(calcResults.totalInterest).toLocaleString()} ₽
                    </p>
                  </div>
                </div>

                {calcResults.totalInterest > calcResults.totalCost * 0.3 && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-600">
                      Переплата &gt;30% от суммы
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
            <Button onClick={() => setCalcOpen(false)} variant="outline">
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
