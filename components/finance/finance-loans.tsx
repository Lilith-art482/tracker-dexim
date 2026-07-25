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
  Gavel,
  Home,
  Check,
  Flag,
  Banknote,
} from "lucide-react";
import type { Loan, ObligationType, FinanceAccount } from "@/lib/finance-types";
import {
  getLoansByUser,
  createLoan,
  updateLoan,
  deleteLoan,
  createCategory,
  getAccountsByUser,
  createTransaction,
} from "@/lib/finance-client";
import {
  getCurrencySymbol,
  convert,
  getCachedRates,
  getDisplayCurrency,
} from "@/lib/exchange-rates";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

const OBLIGATION_LABELS: Record<ObligationType, string> = {
  credit: "Кредит",
  enforcement: "Исп.производство",
  utilities: "ЖКУ",
  fine: "Штраф",
};

const OBLIGATION_ICONS: Record<ObligationType, typeof Landmark> = {
  credit: Landmark,
  enforcement: Gavel,
  utilities: Home,
  fine: Ban,
};

const CATEGORY_ICONS: Record<ObligationType, string> = {
  credit: "Landmark",
  enforcement: "Gavel",
  utilities: "Home",
  fine: "Ban",
};

const CATEGORY_COLORS: Record<ObligationType, string> = {
  credit: "#3b82f6",
  enforcement: "#f59e0b",
  utilities: "#10b981",
  fine: "#ef4444",
};

const ACCOUNT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  cash: { label: "Наличные", icon: Coins, color: "text-emerald-600 bg-emerald-500/10" },
  card: { label: "Карта", icon: CreditCard, color: "text-blue-600 bg-blue-500/10" },
  crypto: { label: "Криптовалюта", icon: Wallet, color: "text-orange-600 bg-orange-500/10" },
  investment: { label: "Инвестиции", icon: TrendingDown, color: "text-purple-600 bg-purple-500/10" },
  savings: { label: "Сбережения", icon: Wallet, color: "text-sky-600 bg-sky-500/10" },
  deposit: { label: "Вклад", icon: Landmark, color: "text-rose-600 bg-rose-500/10" },
};

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

  const [formObligationType, setFormObligationType] =
    useState<ObligationType>("credit");
  const [formName, setFormName] = useState("");
  const [formTotal, setFormTotal] = useState("");
  const [formRemaining, setFormRemaining] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formPayment, setFormPayment] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formHasInterest, setFormHasInterest] = useState(true);
  const [formRepaymentType, setFormRepaymentType] = useState<
    "monthly" | "lumpSum"
  >("monthly");
  const [formDueDate, setFormDueDate] = useState("");

  const [formEnforcementFee, setFormEnforcementFee] = useState("");
  const [formOfficialIncome, setFormOfficialIncome] = useState("");
  const [formUnofficialIncome, setFormUnofficialIncome] = useState("");
  const [formFsspPercent, setFormFsspPercent] = useState("");
  const [formOverdueMonths, setFormOverdueMonths] = useState("0");
  const [formPenalties, setFormPenalties] = useState("");
  const [formDiscountDeadline, setFormDiscountDeadline] = useState("");
  const [formDiscountAmount, setFormDiscountAmount] = useState("");
  const [formComment, setFormComment] = useState("");

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

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentComment, setPaymentComment] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);

  useEffect(() => {
    if (formObligationType !== "enforcement") return;
    const income = parseFloat(formOfficialIncome);
    const pct = parseFloat(formFsspPercent);
    const unofficial = parseFloat(formUnofficialIncome);
    if (!isNaN(income) && !isNaN(pct) && income > 0 && pct > 0) {
      setFormPayment(
        String(
          Math.round(
            (income * pct) / 100 + (isNaN(unofficial) ? 0 : unofficial),
          ),
        ),
      );
    }
  }, [
    formOfficialIncome,
    formFsspPercent,
    formObligationType,
    formUnofficialIncome,
  ]);

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

  useEffect(() => {
    getAccountsByUser(uid).then(setAccounts).catch(() => {});
  }, [uid]);

  const resetForm = useCallback(() => {
    setFormObligationType("credit");
    setFormName("");
    setFormTotal("");
    setFormRemaining("");
    setFormRate("");
    setFormPayment("");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormDueDate("");
    setFormHasInterest(true);
    setFormRepaymentType("monthly");
    setFormEnforcementFee("");
    setFormOfficialIncome("");
    setFormUnofficialIncome("");
    setFormFsspPercent("");
    setFormOverdueMonths("0");
    setFormPenalties("");
    setFormDiscountDeadline("");
    setFormDiscountAmount("");
    setFormComment("");
  }, []);

  const openAddDialog = useCallback(() => {
    resetForm();
    setEditingLoan(null);
    setDialogOpen(true);
  }, [resetForm]);

  const openEditDialog = useCallback((loan: Loan) => {
    setEditingLoan(loan);
    setFormObligationType(loan.obligationType || "credit");
    setFormName(loan.name);
    setFormTotal(String(loan.totalAmount));
    setFormRemaining(String(loan.remainingAmount));
    setFormRate(String(loan.interestRate));
    setFormPayment(String(loan.monthlyPayment));
    setFormStartDate(loan.createdAt.split("T")[0]);
    setFormHasInterest(loan.interestRate > 0);
    setFormRepaymentType(loan.repaymentType);
    setFormDueDate(loan.dueDate || "");
    setFormEnforcementFee(
      loan.enforcementFee ? String(loan.enforcementFee) : "",
    );
    setFormOfficialIncome(
      loan.officialIncome ? String(loan.officialIncome) : "",
    );
    setFormUnofficialIncome(
      loan.unofficialIncome ? String(loan.unofficialIncome) : "",
    );
    setFormFsspPercent(loan.fsspPercent ? String(loan.fsspPercent) : "");
    setFormOverdueMonths(String(loan.overdueMonths || 0));
    setFormPenalties(loan.penalties ? String(loan.penalties) : "");
    setFormDiscountDeadline(loan.discountDeadline || "");
    setFormDiscountAmount(
      loan.discountAmount ? String(loan.discountAmount) : "",
    );
    setFormComment(loan.comment || "");
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingLoan(null);
  }, []);

  const handleSave = async () => {
    if (!formName) {
      toast.error("Заполните название");
      return;
    }

    const totalAmount = parseFloat(formTotal) || 0;
    const remainingAmount = parseFloat(formRemaining) || totalAmount;
    const monthlyPayment = parseFloat(formPayment) || 0;
    const interestRate =
      formObligationType === "credit" && formHasInterest
        ? parseFloat(formRate) || 0
        : 0;
    const overdueMonths =
      formObligationType === "credit" ? parseInt(formOverdueMonths) || 0 : 0;
    const repaymentType: "monthly" | "lumpSum" =
      formObligationType === "enforcement"
        ? "monthly"
        : formObligationType === "fine"
          ? "lumpSum"
          : formRepaymentType;
    const dueDate =
      formRepaymentType === "lumpSum" || formObligationType === "fine"
        ? formDueDate || undefined
        : undefined;
    const nextPaymentDate =
      formRepaymentType === "lumpSum" || formObligationType === "fine"
        ? formDueDate || new Date().toISOString().split("T")[0]
        : formStartDate || new Date().toISOString().split("T")[0];

    const toastId = toast.loading("Сохраняем...");

    const loanData: Partial<
      Omit<Loan, "id" | "userId" | "createdAt" | "updatedAt">
    > = {
      name: formName,
      totalAmount,
      remainingAmount,
      interestRate,
      monthlyPayment,
      repaymentType,
      dueDate,
      nextPaymentDate,
      obligationType: formObligationType,
      overdueMonths:
        formObligationType === "credit" ? overdueMonths : undefined,
      penalties:
        formObligationType === "utilities" && formPenalties
          ? parseFloat(formPenalties)
          : undefined,
      discountDeadline:
        formObligationType === "fine" && formDiscountDeadline
          ? formDiscountDeadline
          : undefined,
      discountPercent:
        formObligationType === "fine" && formDiscountAmount
          ? parseFloat(formDiscountAmount)
          : undefined,
      discountAmount:
        formObligationType === "fine" && formDiscountAmount && totalAmount
          ? Math.round((totalAmount * parseFloat(formDiscountAmount)) / 100)
          : undefined,
      comment:
        formObligationType === "fine" && formComment ? formComment : undefined,
      enforcementFee:
        formObligationType === "enforcement" && formEnforcementFee
          ? parseFloat(formEnforcementFee)
          : undefined,
      officialIncome:
        formObligationType === "enforcement" && formOfficialIncome
          ? parseFloat(formOfficialIncome)
          : undefined,
      unofficialIncome:
        formObligationType === "enforcement" && formUnofficialIncome
          ? parseFloat(formUnofficialIncome)
          : undefined,
      fsspPercent:
        formObligationType === "enforcement" && formFsspPercent
          ? parseFloat(formFsspPercent)
          : undefined,
    };

    try {
      const isNew = !editingLoan;
      const loanId = editingLoan ? editingLoan.id : crypto.randomUUID();

      let savedLoan: Loan;
      if (editingLoan) {
        savedLoan = await updateLoan(loanId, loanData);
      } else {
        savedLoan = await createLoan({
          id: loanId,
          userId: uid,
          ...loanData,
        } as Loan);
      }

      try {
        const category = await createCategory({
          userId: uid,
          name: formName,
          icon: CATEGORY_ICONS[formObligationType],
          type: "expense",
          color: CATEGORY_COLORS[formObligationType],
        });
        savedLoan = await updateLoan(loanId, { categoryId: category.id });
      } catch {
        console.error("Failed to create category");
      }

      setLoans((prev) =>
        isNew
          ? [...prev, savedLoan]
          : prev.map((l) => (l.id === loanId ? savedLoan : l)),
      );
      toast.success("Готово", { id: toastId });
      closeDialog();
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    }
  };

  const handleMakePayment = (loan: Loan) => {
    const defaultAmount =
      loan.repaymentType === "lumpSum"
        ? loan.remainingAmount
        : loan.monthlyPayment;
    setPaymentLoan(loan);
    setPaymentAmount(String(Math.round(defaultAmount)));
    setPaymentAccountId("");
    setPaymentComment("");
    setPaymentOpen(true);
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

  const handleEarlyRepayment = (loan: Loan) => {
    const extra = parseFloat(extraPayments[loan.id] || "0");
    if (!extra || extra <= 0) {
      toast.error("Укажите сумму досрочного погашения");
      return;
    }
    setPaymentLoan(loan);
    setPaymentAmount(String(extra));
    setPaymentAccountId("");
    setPaymentComment("");
    setPaymentOpen(true);
  };

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [accounts],
  );

  const handleConfirmPayment = async () => {
    if (!paymentLoan || !paymentAccountId || !paymentAmount.trim()) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPaymentSaving(true);
    const toastId = toast.loading("Проводим платёж...");

    try {
      const expenseCat = paymentLoan.categoryId || "";

      await createTransaction({
        id: crypto.randomUUID(),
        userId: uid,
        accountId: paymentAccountId,
        type: "expense",
        categoryId: expenseCat,
        amount,
        description: paymentComment.trim() || `Оплата: ${paymentLoan.name}`,
        tags: ["obligation-payment", paymentLoan.obligationType],
        date: new Date().toISOString().split("T")[0] + "T" + new Date().toISOString().split("T")[1].slice(0, 8),
      });

      const newRemaining = Math.max(0, paymentLoan.remainingAmount - amount);
      const updated = await updateLoan(paymentLoan.id, {
        remainingAmount: newRemaining,
      });
      setLoans((prev) => prev.map((l) => (l.id === paymentLoan.id ? updated : l)));
      setAccounts((prev) =>
        prev.map((a) => (a.id === paymentAccountId ? { ...a, balance: a.balance - amount } : a)),
      );

      setPaymentOpen(false);
      setPaymentLoan(null);
      setPaymentAccountId("");
      setPaymentComment("");
      setExtraPayments((prev) => ({ ...prev, [paymentLoan.id]: "" }));
      toast.success("Платёж проведён", { id: toastId });
    } catch {
      toast.error("Ошибка сети", { id: toastId });
    } finally {
      setPaymentSaving(false);
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
        const isLumpSum = loan.repaymentType === "lumpSum";
        const paidAmount = loan.totalAmount - loan.remainingAmount;
        const progressPct =
          loan.totalAmount > 0
            ? Math.min((paidAmount / loan.totalAmount) * 100, 100)
            : 0;
        const isPaid = loan.remainingAmount <= 0;

        const overdueDays = isPaid ? 0 : (loan.overdueMonths || 0) * 30;
        const isOverdue = !isPaid && (loan.overdueMonths || 0) > 0;

        let totalMonths: number;
        let monthsRemaining: number;
        let monthsElapsed: number;
        let monthProgressPct: number;
        let totalInterest: number;
        let interestPaid: number;
        let totalCost: number;
        let monthlyInterestPortion: number;
        let monthlyPrincipalPortion: number;
        let daysUntilNextPayment: number;
        let healthStatus: string;
        let daysRemaining: number | null;
        let daysElapsed: number | null;
        let totalDays: number | null;
        let dayProgressPct: number | null;

        if (isLumpSum) {
          totalMonths = 0;
          monthsRemaining = 0;
          monthsElapsed = 0;
          monthProgressPct = 0;
          totalInterest = isPaid ? 0 : 0;
          interestPaid = 0;
          totalCost = loan.totalAmount;
          monthlyInterestPortion = 0;
          monthlyPrincipalPortion = 0;

          const dueDate = new Date(
            loan.dueDate || loan.nextPaymentDate + "T00:00:00Z",
          );
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffMs = dueDate.getTime() - today.getTime();
          daysUntilNextPayment = Math.ceil(diffMs / 86400000);

          const created = new Date(loan.createdAt + "T00:00:00Z");
          created.setHours(0, 0, 0, 0);
          const totalDiffMs = dueDate.getTime() - created.getTime();
          totalDays = Math.ceil(totalDiffMs / 86400000);
          const elapsedMs = today.getTime() - created.getTime();
          daysElapsed = Math.ceil(elapsedMs / 86400000);
          daysRemaining = daysUntilNextPayment;
          dayProgressPct =
            totalDays && totalDays > 0
              ? Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
              : 0;

          healthStatus = isPaid
            ? "paid"
            : isOverdue
              ? "critical"
              : daysRemaining <= 7
                ? "early"
                : dayProgressPct > 75
                  ? "almost-there"
                  : "on-track";
        } else {
          totalMonths = calcMonths(
            loan.totalAmount,
            loan.interestRate,
            loan.monthlyPayment,
          );
          monthsRemaining = calcMonths(
            loan.remainingAmount,
            loan.interestRate,
            loan.monthlyPayment,
          );
          monthsElapsed =
            totalMonths === Infinity ? 0 : totalMonths - monthsRemaining;
          monthProgressPct =
            totalMonths > 0 && totalMonths !== Infinity
              ? Math.min((monthsElapsed / totalMonths) * 100, 100)
              : 0;
          totalInterest =
            totalMonths === Infinity
              ? Infinity
              : loan.monthlyPayment * totalMonths - loan.totalAmount;
          const interestPaidRatio =
            totalMonths > 0 && totalMonths !== Infinity
              ? 1 - monthsRemaining / totalMonths
              : loan.totalAmount > 0
                ? paidAmount / loan.totalAmount
                : 0;
          interestPaid =
            totalInterest === Infinity
              ? 0
              : Math.max(0, totalInterest * interestPaidRatio);
          totalCost =
            totalMonths === Infinity
              ? Infinity
              : loan.monthlyPayment * totalMonths;

          monthlyInterestPortion =
            loan.interestRate > 0 && loan.remainingAmount > 0
              ? (loan.remainingAmount * (loan.interestRate / 100)) / 12
              : 0;
          monthlyPrincipalPortion = isPaid
            ? 0
            : Math.max(0, loan.monthlyPayment - monthlyInterestPortion);

          const nextPayDate = new Date(loan.nextPaymentDate + "T00:00:00Z");
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffMs = nextPayDate.getTime() - today.getTime();
          daysUntilNextPayment = Math.ceil(diffMs / 86400000);
          daysRemaining = null;
          daysElapsed = null;
          totalDays = null;
          dayProgressPct = null;

          healthStatus = isPaid
            ? "paid"
            : isOverdue
              ? "critical"
              : progressPct < 25
                ? "early"
                : progressPct > 75
                  ? "almost-there"
                  : "on-track";
        }

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
          isLumpSum,
          daysRemaining,
          daysElapsed,
          totalDays,
          dayProgressPct,
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
    () =>
      enrichedLoans.reduce(
        (s, l) => (l.repaymentType === "monthly" ? s + l.monthlyPayment : s),
        0,
      ),
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
                  Добавьте кредит, рассрочку, долг или другое обязательство
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
                          {loan.overdueMonths} мес.
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {loan.penalties ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-5 font-normal text-rose-600 border-rose-200 dark:border-rose-800"
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          Пени {loan.penalties.toLocaleString()} ₽
                        </Badge>
                      ) : null}
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
                      {loan.isLumpSum ? (
                        <span className="text-xs text-muted-foreground">
                          Единовременно
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {loan.monthlyPayment.toLocaleString()} ₽/мес
                        </span>
                      )}
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

                {loan.isLumpSum && loan.totalDays && loan.totalDays > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>До даты погашения</span>
                      <span>
                        {loan.daysRemaining != null
                          ? `осталось ${loan.daysRemaining} дн.`
                          : ""}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          loan.daysRemaining != null && loan.daysRemaining <= 7
                            ? "bg-rose-400"
                            : "bg-sky-400",
                        )}
                        style={{ width: `${loan.dayProgressPct}%` }}
                      />
                    </div>
                  </div>
                ) : loan.totalMonths > 0 && loan.totalMonths !== Infinity ? (
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
                ) : null}

                {/* Fine details */}
                {loan.obligationType === "fine" && !loan.isPaid && (
                  <div className="space-y-1.5">
                    {loan.discountDeadline && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Скидка до</span>
                        <span className="font-medium tabular-nums">
                          {new Date(
                            loan.discountDeadline + "T00:00:00Z",
                          ).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    )}
                    {loan.discountPercent ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-600 font-medium">
                          Скидка {loan.discountPercent}%
                        </span>
                        {loan.discountAmount ? (
                          <span className="font-semibold tabular-nums text-emerald-600">
                            −{loan.discountAmount.toLocaleString()} ₽
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {loan.comment && (
                      <p className="text-xs text-muted-foreground italic">
                        {loan.comment}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment breakdown */}
                {loan.interestRate > 0 && !loan.isPaid && !loan.isLumpSum && (
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
                {!loan.isPaid &&
                  (loan.obligationType === "credit" ||
                    (loan.obligationType !== "enforcement" &&
                      loan.dueDate)) && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {loan.isLumpSum
                          ? loan.daysUntilNextPayment > 0
                            ? `До погашения ${loan.daysUntilNextPayment} дн.`
                            : loan.daysUntilNextPayment === 0
                              ? "Дата погашения сегодня"
                              : `Просрочено на ${Math.abs(loan.daysUntilNextPayment)} дн.`
                          : loan.daysUntilNextPayment > 0
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
                        {new Date(
                          loan.isLumpSum
                            ? loan.dueDate || loan.nextPaymentDate
                            : loan.nextPaymentDate,
                        ).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  )}

                {/* Overdue warning */}
                {loan.isOverdue && (
                  <div className="flex items-start gap-2 rounded-lg bg-rose-500/10 p-2.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-rose-600">
                        Просрочка {loan.overdueMonths} мес.
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

                {/* Partial payment */}
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
                        placeholder={
                          loan.obligationType === "fine"
                            ? "Сумма частичной оплаты"
                            : "Сумма досрочно"
                        }
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
                      {loan.obligationType === "fine"
                        ? "Оплатить"
                        : "Досрочно"}
                    </Button>
                  </div>
                )}

                {/* Regular payment */}
                {loan.isLumpSum && loan.obligationType !== "fine" ? (
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
                      : `Погасить ${Math.round(loan.remainingAmount).toLocaleString()} ₽`}
                  </Button>
                ) : (
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
                      : loan.obligationType === "enforcement" ||
                          loan.obligationType === "fine"
                        ? `Погасить полностью ${Math.round(loan.remainingAmount).toLocaleString()} ₽`
                        : `Внести ${loan.monthlyPayment.toLocaleString()} ₽`}
                  </Button>
                )}
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
        <DialogContent className="sm:max-w-lg">
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
            {/* Obligation type toggle */}
            <div className="flex rounded-lg border p-0.5 bg-muted/30">
              {(Object.keys(OBLIGATION_LABELS) as ObligationType[]).map(
                (type) => {
                  const Icon = OBLIGATION_ICONS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormObligationType(type)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                        formObligationType === type
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {OBLIGATION_LABELS[type]}
                    </button>
                  );
                },
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
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

            {/* Amount / Remaining */}
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Credit: interest rate toggle + input */}
            {formObligationType === "credit" &&
              formRepaymentType === "monthly" && (
                <>
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
                </>
              )}

            {/* Enforcement-specific fields */}
            {formObligationType === "enforcement" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Сбор ИП
                    </label>
                    <Input
                      type="number"
                      value={formEnforcementFee}
                      onChange={(e) => setFormEnforcementFee(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      % взыскания
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formFsspPercent}
                      onChange={(e) => setFormFsspPercent(e.target.value)}
                      placeholder="50"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Доход офиц.
                    </label>
                    <Input
                      type="number"
                      value={formOfficialIncome}
                      onChange={(e) => setFormOfficialIncome(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Доход неофиц.
                    </label>
                    <Input
                      type="number"
                      value={formUnofficialIncome}
                      onChange={(e) => setFormUnofficialIncome(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Платёж/мес (рассчитано)
                  </label>
                  <Input
                    type="number"
                    value={formPayment}
                    onChange={(e) => setFormPayment(e.target.value)}
                    placeholder="—"
                    className="h-9"
                  />
                </div>
              </>
            )}

            {/* Utilities-specific fields */}
            {formObligationType === "utilities" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Пени (при наличии)
                  </label>
                  <Input
                    type="number"
                    value={formPenalties}
                    onChange={(e) => setFormPenalties(e.target.value)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>

                <div className="flex rounded-lg border p-0.5 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setFormRepaymentType("monthly")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      formRepaymentType === "monthly"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Ежемесячно
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRepaymentType("lumpSum")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      formRepaymentType === "lumpSum"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Единовременно
                  </button>
                </div>

                {formRepaymentType === "monthly" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Платёж/мес
                    </label>
                    <Input
                      type="number"
                      value={formPayment}
                      onChange={(e) => setFormPayment(e.target.value)}
                      placeholder="5 000"
                      className="h-9"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Дата погашения (по желанию)
                    </label>
                    <Input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}
              </>
            )}

            {/* Fine-specific fields */}
            {formObligationType === "fine" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Срок оплаты общий
                    </label>
                    <Input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Скидка до
                    </label>
                    <Input
                      type="date"
                      value={formDiscountDeadline}
                      onChange={(e) => setFormDiscountDeadline(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                {formDiscountDeadline && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Скидка, %
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formDiscountAmount}
                      onChange={(e) => setFormDiscountAmount(e.target.value)}
                      placeholder="50"
                      className="h-9"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Комментарий
                  </label>
                  <Input
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Примечание"
                    className="h-9"
                  />
                </div>
              </>
            )}

            {/* Credit: repayment type toggle */}
            {formObligationType === "credit" && (
              <>
                <div className="flex rounded-lg border p-0.5 bg-muted/30">
                  <button
                    type="button"
                    onClick={() => setFormRepaymentType("monthly")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      formRepaymentType === "monthly"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Ежемесячно
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRepaymentType("lumpSum")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                      formRepaymentType === "lumpSum"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Единовременно
                  </button>
                </div>

                {/* Credit: Monthly payment / Due date */}
                {formRepaymentType === "monthly" ? (
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
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Дата погашения
                    </label>
                    <Input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}

                {/* Credit: Start date for monthly */}
                {formRepaymentType === "monthly" && (
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
                )}

                {/* Credit: Overdue months */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Кол-во просроченных платежей
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formOverdueMonths}
                    onChange={(e) => setFormOverdueMonths(e.target.value)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
              </>
            )}
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

      {/* Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-4xl overflow-hidden p-0 gap-0">
          <div className="relative bg-gradient-to-br from-emerald-600/10 via-transparent to-sky-600/5 p-6 pb-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_70%)]" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-md shadow-emerald-500/20">
                <Banknote className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Оплата по обязательству
                </DialogTitle>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {paymentLoan?.name || ""}
                  {paymentLoan?.obligationType && (
                    <span className="ml-1.5 text-muted-foreground/50">
                      · {OBLIGATION_LABELS[paymentLoan.obligationType]}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Сумма */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold">
                Сумма оплаты
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="h-12 bg-muted/20 border-border/40 text-xl font-bold tabular-nums pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/60">
                  {paymentAccountId
                    ? getCurrencySymbol(
                        accounts.find((a) => a.id === paymentAccountId)?.currency || "RUB",
                      )
                    : "₽"}
                </span>
              </div>
              {(() => {
                const selAcc = accounts.find((a) => a.id === paymentAccountId);
                if (!selAcc) return null;
                const amt = parseFloat(paymentAmount);
                if (isNaN(amt) || amt <= 0) return null;
                const rates = getCachedRates();
                if (!rates) return null;
                const dc = getDisplayCurrency();
                if (selAcc.currency === dc) return null;
                const converted = convert(amt, selAcc.currency, dc, rates);
                return (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 mt-1">
                    <span className="tabular-nums font-medium">
                      ≈ {converted.toLocaleString(undefined, { maximumFractionDigits: 2 })}{" "}
                      {getCurrencySymbol(dc)} {dc}
                    </span>
                  </div>
                );
              })()}
              {paymentLoan && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
                  <span>Остаток: {paymentLoan.remainingAmount.toLocaleString()} ₽</span>
                  {paymentLoan.repaymentType !== "lumpSum" && (
                    <>
                      <span>·</span>
                      <span>Платёж/мес: {paymentLoan.monthlyPayment.toLocaleString()} ₽</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Счёт */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Счёт списания
              </Label>
              <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {sortedAccounts.map((a) => {
                  const cfg = ACCOUNT_TYPE_CONFIG[a.type] || ACCOUNT_TYPE_CONFIG.cash;
                  const Icon = cfg.icon;
                  const selected = paymentAccountId === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setPaymentAccountId(a.id)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                        selected
                          ? "border-sky-300 bg-sky-50/60 dark:bg-sky-950/20 dark:border-sky-700 shadow-sm ring-1 ring-sky-200 dark:ring-sky-800"
                          : "border-border/50 hover:border-muted-foreground/30 hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          cfg.color,
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium truncate leading-tight">
                            {a.name}
                          </span>
                          {a.priority && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
                                a.priority === "high" &&
                                  "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                                a.priority === "medium" &&
                                  "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
                                a.priority === "low" &&
                                  "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
                              )}
                            >
                              <Flag className="h-2 w-2" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5">
                          #{a.sortOrder != null ? a.sortOrder + 1 : "—"} ·{" "}
                          {cfg.label}
                        </p>
                        <p className="text-[11px] font-medium text-foreground/80 leading-tight mt-1 tabular-nums">
                          {a.balance.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {a.currency}
                        </p>
                      </div>
                      {selected && (
                        <div className="h-5 w-5 rounded-full bg-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {sortedAccounts.length === 0 && (
                  <div className="col-span-2 py-6 text-center text-xs text-muted-foreground/60">
                    Нет доступных счетов
                  </div>
                )}
              </div>
            </div>

            {/* Комментарий */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold">
                Комментарий
              </Label>
              <Textarea
                value={paymentComment}
                onChange={(e) => setPaymentComment(e.target.value)}
                placeholder={
                  paymentLoan?.obligationType === "credit"
                    ? "Номер кредита, сумма и т.д."
                    : paymentLoan?.obligationType === "utilities"
                      ? "Номер квитанции ЖКУ"
                      : paymentLoan?.obligationType === "fine"
                        ? "Номер постановления о штрафе"
                        : "Номер исполнительного производства"
                }
                rows={2}
                className="bg-muted/20 border-border/40 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/40 px-5 py-3 bg-muted/10">
            <div className="text-xs text-muted-foreground/50">
              {paymentAccountId &&
                paymentAmount.trim() &&
                parseFloat(paymentAmount) > 0 && (
                  <>
                    {accounts.find((a) => a.id === paymentAccountId)?.name} →{" "}
                    {paymentLoan?.name}
                  </>
                )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaymentOpen(false)}
                disabled={paymentSaving}
                className="h-9"
              >
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmPayment}
                disabled={
                  paymentSaving ||
                  !paymentAccountId ||
                  !paymentAmount.trim() ||
                  parseFloat(paymentAmount) <= 0
                }
                className="h-9 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white shadow-sm"
              >
                {paymentSaving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                <Banknote className="h-3.5 w-3.5 mr-1.5" />
                Оплатить
              </Button>
            </div>
          </div>
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
