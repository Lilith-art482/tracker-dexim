"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Landmark,
  CreditCard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Coins,
  Loader2,
  Building2,
  Bitcoin,
  Percent,
  Calendar,
  FileText,
  Search,
  ChevronDown,
  ArrowDown,
  Check,
  MoreVertical,
  Eye,
  ChartLine,
  Clock,
  DollarSign,
  Link2,
  GripVertical,
  Flag,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from "lucide-react";
import type {
  FinanceAccount,
  TransactionCategory,
  Loan as LoanType,
} from "@/lib/finance-types";
import { CURRENCIES } from "@/lib/finance-types";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getUSDTtoRUB,
  convertToRUB,
  getDisplayCurrency,
  getCachedRates,
  convert,
  computeCryptoAmount,
} from "@/lib/exchange-rates";
import {
  getAccountsByUser,
  createAccount,
  updateAccount as updateAccountModel,
  deleteAccount,
  createTransaction,
  getCategoriesByUser,
  createCategory,
  getLoansByUser,
  createLoan,
  updateLoan as updateLoanModel,
} from "@/lib/finance-client";
import { toast } from "sonner";

type AccountType = FinanceAccount["type"];
const CARD_TYPES = [
  { value: "debit" as const, label: "Дебетовая" },
  { value: "credit" as const, label: "Кредитная" },
  { value: "business" as const, label: "Бизнес" },
];
const CRYPTO_COINS = CURRENCIES.filter((c) => c.type === "crypto").map(
  (c) => c.code,
);

const TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: React.ElementType; color: string }
> = {
  cash: {
    label: "Наличные",
    icon: Coins,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  card: {
    label: "Карта",
    icon: CreditCard,
    color: "text-blue-600 bg-blue-500/10",
  },
  crypto: {
    label: "Криптовалюта",
    icon: Bitcoin,
    color: "text-orange-600 bg-orange-500/10",
  },
  investment: {
    label: "Инвестиции",
    icon: TrendingUp,
    color: "text-purple-600 bg-purple-500/10",
  },
  savings: {
    label: "Сбережения",
    icon: PiggyBank,
    color: "text-sky-600 bg-sky-500/10",
  },
  deposit: {
    label: "Вклад",
    icon: Building2,
    color: "text-rose-600 bg-rose-500/10",
  },
};

function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const selected = CURRENCIES.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-8 data-placeholder:text-muted-foreground dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
        {selected ? (
          <span className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded border bg-background text-[10px] font-medium shrink-0">
              {selected.symbol}
            </span>
            <span className="font-medium text-xs">{selected.code}</span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">Выберите валюту</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Поиск валюты..."
            className="pl-8 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Ничего не найдено
          </p>
        ) : (
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
            {filtered
              .reduce<
                {
                  type: string;
                  label: string;
                  items: (typeof CURRENCIES)[number][];
                }[]
              >((groups, c) => {
                const last = groups[groups.length - 1];
                if (last && last.type === c.type) {
                  last.items.push(c);
                } else {
                  groups.push({
                    type: c.type,
                    label: c.type === "fiat" ? "Фиат" : "Криптовалюта",
                    items: [c],
                  });
                }
                return groups;
              }, [])
              .map((group) => (
                <div key={group.type}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
                    {group.label}
                  </p>
                  {group.items.map((c) => (
                    <button
                      key={c.code}
                      className={cn(
                        "flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors",
                        value === c.code
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground",
                      )}
                      onClick={() => {
                        onChange(c.code);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <span className="text-base w-5 text-center">
                        {c.symbol}
                      </span>
                      <span className="font-medium">{c.code}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {c.label}
                      </span>
                      {value === c.code && (
                        <Check className="h-3.5 w-3.5 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function FinanceAccounts() {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usdtRate, setUsdtRate] = useState<number>(90);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("card");
  const [formBalance, setFormBalance] = useState("");
  const [formCurrency, setFormCurrency] = useState("RUB");
  const [formCardType, setFormCardType] = useState<
    "debit" | "credit" | "business"
  >("debit");
  const [formCryptoCoin, setFormCryptoCoin] = useState("BTC");
  const [formWalletName, setFormWalletName] = useState("");
  const [formWalletAddress, setFormWalletAddress] = useState("");
  const [formInterestRate, setFormInterestRate] = useState("");
  const [formTermMonths, setFormTermMonths] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formCapitalize, setFormCapitalize] = useState(true);
  const [formGracePeriod, setFormGracePeriod] = useState("");
  const [formPriority, setFormPriority] = useState<string>("none");
  const [formUrl, setFormUrl] = useState("");
  const [formShowCalc, setFormShowCalc] = useState(false);
  const [depositCalc, setDepositCalc] = useState<FinanceAccount | null>(null);

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");

  const [percentPresets, setPercentPresets] = useState<number[]>([
    25, 50, 75, 100,
  ]);
  const [amountPresets, setAmountPresets] = useState<
    { value: number; currency: string }[]
  >([]);
  const [presetsEditOpen, setPresetsEditOpen] = useState(false);

  const [quickAccount, setQuickAccount] = useState<FinanceAccount | null>(null);
  const [quickType, setQuickType] = useState<"add" | "withdraw">("add");
  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategoryId, setQuickCategoryId] = useState("");
  const [quickTags, setQuickTags] = useState("");
  const [quickDescription, setQuickDescription] = useState("");
  const [quickLinkLoan, setQuickLinkLoan] = useState(false);
  const [quickLoanId, setQuickLoanId] = useState("");
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [loans, setLoans] = useState<LoanType[]>([]);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [filterMin, setFilterMin] = useState("");
  const [filterMax, setFilterMax] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [sortBalance, setSortBalance] = useState<"none" | "asc" | "desc">(
    "none",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSaving, setNewCatSaving] = useState(false);

  // New loan creation fields (shown when quickLinkLoan is on for income)
  const [newLoanName, setNewLoanName] = useState("");
  const [newLoanTotal, setNewLoanTotal] = useState("");
  const [newLoanRate, setNewLoanRate] = useState("");
  const [newLoanMonthly, setNewLoanMonthly] = useState("");
  const [newLoanNextPayment, setNewLoanNextPayment] = useState("");

  const uid = auth.currentUser?.uid || "user-1";
  const dialogTitle = editId ? "Редактировать счёт" : "Новый счёт";

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats, ln] = await Promise.all([
        getAccountsByUser(uid),
        getCategoriesByUser(uid),
        getLoansByUser(uid),
      ]);
      setAccounts(data);
      setCategories(cats);
      setLoans(ln);

      const rate = await getUSDTtoRUB();
      setUsdtRate(rate);
    } catch (e) {
      console.error("Failed to load accounts:", e);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const lastType = localStorage.getItem(
      "finance_last_account_type",
    ) as AccountType | null;
    const lastCurrency = localStorage.getItem("finance_last_account_currency");
    if (lastType && TYPE_CONFIG[lastType]) setFormType(lastType);
    if (lastCurrency) setFormCurrency(lastCurrency);
  }, []);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormType(
      (localStorage.getItem("finance_last_account_type") as AccountType) ||
        "card",
    );
    setFormBalance("");
    setFormCurrency(
      localStorage.getItem("finance_last_account_currency") || "RUB",
    );
    setFormCardType("debit");
    setFormCryptoCoin("BTC");
    setFormWalletName("");
    setFormWalletAddress("");
    setFormInterestRate("");
    setFormTermMonths("");
    setFormStartDate("");
    setFormNotes("");
    setFormCapitalize(true);
    setFormGracePeriod("");
    setFormUrl("");
    setFormPriority("none");
    setFormShowCalc(false);
    setEditId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setDialogOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((account: FinanceAccount) => {
    setFormName(account.name);
    setFormType(account.type);
    setFormBalance(String(account.balance));
    if (
      account.type === "crypto" &&
      account.cryptoAmount != null &&
      account.cryptoCoin
    ) {
      const rates = getCachedRates();
      if (rates) {
        const dynamicBalance = convert(
          account.cryptoAmount,
          account.cryptoCoin,
          account.currency,
          rates,
        );
        setFormBalance(String(dynamicBalance));
      }
    }
    setFormCurrency(account.currency);
    setFormCardType(account.cardType || "debit");
    setFormCryptoCoin(account.cryptoCoin || "BTC");
    setFormWalletName(account.walletName || "");
    setFormWalletAddress(account.walletAddress || "");
    setFormInterestRate(
      account.interestRate ? String(account.interestRate) : "",
    );
    setFormTermMonths(account.termMonths ? String(account.termMonths) : "");
    setFormStartDate(account.startDate || "");
    setFormNotes(account.notes || "");
    setFormCapitalize(account.capitalizeInterest ?? true);
    setFormGracePeriod(
      account.gracePeriodDays ? String(account.gracePeriodDays) : "",
    );
    setFormUrl(account.url || "");
    setFormPriority(account.priority || "none");
    setFormShowCalc(false);
    setEditId(account.id);
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!formName.trim() || !formBalance.trim()) return;
    setSaving(true);
    const balance = parseFloat(formBalance);
    if (isNaN(balance)) {
      setSaving(false);
      return;
    }

    localStorage.setItem("finance_last_account_type", formType);
    localStorage.setItem("finance_last_account_currency", formCurrency);

    const body: Record<string, unknown> = {
      userId: uid,
      name: formName.trim(),
      type: formType,
      balance,
      currency: formCurrency,
    };
    if (formNotes) body.notes = formNotes;
    if (formUrl) body.url = formUrl;
    if (formPriority && formPriority !== "none") body.priority = formPriority;

    if (formType === "card") {
      body.cardType = formCardType;
      if (formCardType === "credit" && formGracePeriod) {
        body.gracePeriodDays = parseInt(formGracePeriod);
      }
    }
    if (formType === "crypto") {
      body.cryptoCoin = formCryptoCoin;
      if (formWalletName) body.walletName = formWalletName;
      if (formWalletAddress) body.walletAddress = formWalletAddress;
      const rates = getCachedRates();
      if (rates) {
        body.cryptoAmount = computeCryptoAmount(
          balance,
          formCryptoCoin,
          formCurrency,
          rates,
        );
      }
    }
    if (formType === "deposit" || formType === "savings") {
      if (formInterestRate) body.interestRate = parseFloat(formInterestRate);
      if (formTermMonths) body.termMonths = parseInt(formTermMonths);
      if (formStartDate) body.startDate = formStartDate;
      body.capitalizeInterest = formCapitalize;
    }

    if (!editId) {
      body.sortOrder =
        accounts.length > 0
          ? Math.max(...accounts.map((a) => a.sortOrder ?? 0)) + 1
          : 0;
    }

    try {
      let saved: FinanceAccount;
      if (editId) {
        const { userId: _, ...updates } = body;
        saved = await updateAccountModel(
          editId,
          updates as Parameters<typeof updateAccountModel>[1],
        );
      } else {
        saved = await createAccount({
          id: crypto.randomUUID(),
          ...body,
        } as Parameters<typeof createAccount>[0]);
      }
      setAccounts((prev) => {
        if (editId) return prev.map((a) => (a.id === saved.id ? saved : a));
        return [...prev, saved];
      });
      setDialogOpen(false);
      resetForm();
    } catch (e) {
      console.error("Failed to save account:", e);
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = accounts.findIndex((a) => a.id === active.id);
    const newIndex = accounts.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(accounts, oldIndex, newIndex);
    const updated = reordered.map((a, i) => ({ ...a, sortOrder: i }));
    setAccounts(updated);
    try {
      await Promise.all(
        updated.map((a, i) => updateAccountModel(a.id, { sortOrder: i })),
      );
    } catch (e) {
      console.error("Failed to persist sort order:", e);
      fetchAccounts();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Failed to delete account:", e);
    }
  };

  const accountBalance = useCallback((acc: FinanceAccount): number => {
    if (acc.type === "crypto" && acc.cryptoCoin && acc.cryptoAmount != null) {
      const rates = getCachedRates();
      if (rates)
        return convert(acc.cryptoAmount, acc.cryptoCoin, acc.currency, rates);
    }
    return acc.balance;
  }, []);

  const totalBalance = accounts.reduce(
    (sum, a) => sum + convertToRUB(accountBalance(a), a.currency, usdtRate),
    0,
  );

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    [accounts],
  );

  const filteredAccounts = useMemo(() => {
    let list = sortedAccounts;
    const min = filterMin ? parseFloat(filterMin) : NaN;
    const max = filterMax ? parseFloat(filterMax) : NaN;
    if (!isNaN(min) || !isNaN(max) || filterPriority !== "all") {
      const rates = getCachedRates();
      const displayCurrency = getDisplayCurrency();
      list = list.filter((a) => {
        if (
          filterPriority !== "all" &&
          (a.priority || "none") !== filterPriority
        )
          return false;
        if (!rates) return true;
        const effectiveBalance = accountBalance(a);
        const converted = convert(
          effectiveBalance,
          a.currency,
          displayCurrency,
          rates,
        );
        if (!isNaN(min) && converted < min) return false;
        if (!isNaN(max) && converted > max) return false;
        return true;
      });
    }

    if (sortBalance !== "none") {
      const rates = getCachedRates();
      const displayCurrency = getDisplayCurrency();
      list = [...list].sort((a, b) => {
        const aVal = rates
          ? convert(accountBalance(a), a.currency, displayCurrency, rates)
          : accountBalance(a);
        const bVal = rates
          ? convert(accountBalance(b), b.currency, displayCurrency, rates)
          : accountBalance(b);
        return sortBalance === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return list;
  }, [
    sortedAccounts,
    filterMin,
    filterMax,
    filterPriority,
    sortBalance,
    accountBalance,
  ]);

  const computeCryptoUpdate = useCallback(
    (
      acc: FinanceAccount,
      newBalance: number,
    ): { balance: number; cryptoAmount?: number } => {
      if (acc.type === "crypto" && acc.cryptoCoin) {
        const rates = getCachedRates();
        if (rates) {
          const rateToCurrency = convert(
            1,
            acc.cryptoCoin,
            acc.currency,
            rates,
          );
          if (rateToCurrency > 0) {
            return {
              balance: newBalance,
              cryptoAmount: newBalance / rateToCurrency,
            };
          }
        }
      }
      return { balance: newBalance };
    },
    [],
  );

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount.trim()) return;
    if (transferFrom === transferTo) return;
    setSaving(true);
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      setSaving(false);
      return;
    }

    const fromAcc = accounts.find((a) => a.id === transferFrom);
    const toAcc = accounts.find((a) => a.id === transferTo);
    if (!fromAcc || !toAcc) {
      setSaving(false);
      return;
    }

    const fromDynamicBalance = accountBalance(fromAcc);
    if (fromDynamicBalance < amount) {
      setSaving(false);
      return;
    }

    try {
      await createTransaction({
        id: crypto.randomUUID(),
        userId: uid,
        accountId: transferFrom,
        type: "transfer",
        categoryId: "fin-cat-9",
        amount,
        description: transferDescription.trim() || "Перевод между счетами",
        tags: ["transfer"],
        date: new Date().toISOString().split("T")[0],
      });

      const fromUpdate = computeCryptoUpdate(
        fromAcc,
        fromDynamicBalance - amount,
      );
      const toUpdate = computeCryptoUpdate(
        toAcc,
        accountBalance(toAcc) + amount,
      );

      await updateAccountModel(transferFrom, fromUpdate);
      await updateAccountModel(transferTo, toUpdate);

      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === transferFrom) return { ...a, ...fromUpdate };
          if (a.id === transferTo) return { ...a, ...toUpdate };
          return a;
        }),
      );
      setTransferOpen(false);
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount("");
      setTransferDescription("");
    } catch (e) {
      console.error("Failed to transfer:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCardTransfer = useCallback((account: FinanceAccount) => {
    setTransferFrom(account.id);
    setTransferTo("");
    setTransferAmount("");
    setTransferDescription("");
    setTransferOpen(true);
  }, []);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, "user_settings", uid);
    getDoc(ref).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.percentPresets) setPercentPresets(data.percentPresets);
      if (data.amountPresets) setAmountPresets(data.amountPresets);
    });
  }, [uid]);

  const handleQuickAmount = useCallback(async () => {
    if (!quickAccount || !quickAmount) return;
    const amount = parseFloat(quickAmount);
    if (isNaN(amount) || amount <= 0) return;

    const delta = quickType === "add" ? amount : -amount;
    const currentBalance = accountBalance(quickAccount);
    const newBalance = currentBalance + delta;
    if (newBalance < 0) return;

    const cat = categories.find((c) => c.id === quickCategoryId);
    const desc =
      quickDescription.trim() ||
      (cat
        ? quickType === "add"
          ? `Пополнение — ${quickAccount.name} (${cat.name})`
          : `Списание — ${quickAccount.name} (${cat.name})`
        : quickType === "add"
          ? `Пополнение — ${quickAccount.name}`
          : `Списание — ${quickAccount.name}`);
    const tags = quickTags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await createTransaction({
        id: crypto.randomUUID(),
        userId: uid,
        accountId: quickAccount.id,
        type: quickType === "add" ? "income" : "expense",
        categoryId:
          quickCategoryId || (quickType === "add" ? "fin-cat-9" : "fin-cat-8"),
        amount,
        description: desc,
        tags:
          tags.length > 0
            ? tags
            : [quickType === "add" ? "topup" : "withdrawal"],
        date: new Date().toISOString().split("T")[0],
      });

      // Handle loan integration
      if (quickLinkLoan) {
        if (quickType === "add") {
          // Income — create a new loan
          if (newLoanName && newLoanTotal) {
            await createLoan({
              id: crypto.randomUUID(),
              userId: uid,
              name: newLoanName.trim(),
              totalAmount: parseFloat(newLoanTotal),
              interestRate: parseFloat(newLoanRate) || 0,
              monthlyPayment: parseFloat(newLoanMonthly) || 0,
              remainingAmount: parseFloat(newLoanTotal),
              nextPaymentDate:
                newLoanNextPayment || new Date().toISOString().split("T")[0],
              repaymentType: "monthly",
              obligationType: "credit",
              overdueMonths: 0,
            });
          }
        } else {
          // Expense — update existing loan remaining amount
          if (quickLoanId) {
            const loan = loans.find((l) => l.id === quickLoanId);
            if (loan) {
              await updateLoanModel(quickLoanId, {
                remainingAmount: Math.max(0, loan.remainingAmount - amount),
              });
            }
          }
        }
      }

      const update = computeCryptoUpdate(quickAccount, newBalance);
      await updateAccountModel(quickAccount.id, update);

      setAccounts((prev) =>
        prev.map((a) => (a.id === quickAccount.id ? { ...a, ...update } : a)),
      );
      setQuickAccount(null);
      setQuickAmount("");
      setQuickCategoryId("");
      setQuickTags("");
      setQuickDescription("");
      setQuickLinkLoan(false);
      setQuickLoanId("");
      setNewLoanName("");
      setNewLoanTotal("");
      setNewLoanRate("");
      setNewLoanMonthly("");
      setNewLoanNextPayment("");
    } catch (e) {
      console.error("Failed to update balance:", e);
    }
  }, [
    quickAccount,
    quickType,
    quickAmount,
    quickCategoryId,
    quickTags,
    quickDescription,
    quickLinkLoan,
    quickLoanId,
    newLoanName,
    newLoanTotal,
    newLoanRate,
    newLoanMonthly,
    newLoanNextPayment,
    categories,
    loans,
    uid,
  ]);

  const projectedBalance = useMemo(() => {
    if (
      (formType !== "deposit" && formType !== "savings") ||
      !formBalance ||
      !formInterestRate ||
      !formTermMonths
    )
      return null;
    const p = parseFloat(formBalance);
    const r = parseFloat(formInterestRate) / 100 / 12;
    const n = parseInt(formTermMonths);
    if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || r <= 0 || n <= 0)
      return null;
    const projected = p * Math.pow(1 + r, n);
    const earned = projected - p;
    return { projected: Math.round(projected), earned: Math.round(earned) };
  }, [formType, formBalance, formInterestRate, formTermMonths]);

  const depositProjections = useCallback((account: FinanceAccount) => {
    if (
      (account.type !== "deposit" && account.type !== "savings") ||
      !account.interestRate ||
      !account.termMonths
    )
      return null;
    const p = account.balance;
    const annualRate = account.interestRate / 100;
    const months = account.termMonths;
    const startDate = account.startDate
      ? new Date(account.startDate + "T00:00:00Z")
      : null;
    const now = new Date();

    const periods = [
      { label: "в день", perYear: 365 },
      { label: "в неделю", perYear: 52 },
      { label: "в месяц", perYear: 12 },
      { label: "в квартал", perYear: 4 },
      { label: "в полгода", perYear: 2 },
      { label: "в год", perYear: 1 },
    ] as const;

    const perPeriod = periods.map((per) => ({
      label: per.label,
      earning: Math.round(p * (annualRate / per.perYear)),
    }));

    const capitalize = account.capitalizeInterest ?? true;
    let projectedEnd: number;
    let earnedTotal: number;
    if (capitalize) {
      const ratePerMonth = annualRate / 12;
      projectedEnd = Math.round(p * Math.pow(1 + ratePerMonth, months));
      earnedTotal = projectedEnd - p;
    } else {
      earnedTotal = Math.round(p * annualRate * (months / 12));
      projectedEnd = p + earnedTotal;
    }

    let currentEarned = 0;
    if (startDate) {
      const daysElapsed = Math.floor(
        (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const clampedDays = Math.max(0, Math.min(daysElapsed, months * 30));
      currentEarned = Math.round(p * annualRate * (clampedDays / 365));
    }

    return {
      initialBalance: p,
      annualRate: account.interestRate,
      termMonths: months,
      perPeriod,
      capitalize,
      currentEarned,
      projectedEnd,
      earnedTotal,
    };
  }, []);

  function SortableAccountCard({
    account: a,
    onTransfer,
  }: {
    account: FinanceAccount;
    onTransfer: (account: FinanceAccount) => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: a.id });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.cash;
    const Icon = cfg.icon;
    const isDepositOrSavings = a.type === "deposit" || a.type === "savings";
    const projections = isDepositOrSavings ? depositProjections(a) : null;

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(isDragging && "shadow-lg")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/40 hover:text-muted-foreground transition-colors -ml-0.5 shrink-0"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    cfg.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-medium truncate flex items-center gap-2">
                  {a.name}
                  {a.priority && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                        a.priority === "high" &&
                          "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                        a.priority === "medium" &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
                        a.priority === "low" &&
                          "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
                      )}
                    >
                      <Flag className="h-2 w-2" />
                      {a.priority === "high"
                        ? "Высокий"
                        : a.priority === "medium"
                          ? "Средний"
                          : "Низкий"}
                    </span>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.sortOrder != null ? `#${a.sortOrder + 1} · ` : ""}
                  {cfg.label}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 -mr-1 -mt-1 outline-none">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => openEdit(a)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(a.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            {a.type === "crypto" && a.cryptoCoin && a.cryptoAmount != null ? (
              <>
                {(() => {
                  const rates = getCachedRates();
                  const dynamicBalance = rates
                    ? convert(a.cryptoAmount, a.cryptoCoin, a.currency, rates)
                    : a.balance;
                  return (
                    <>
                      <p className="text-xl font-bold tabular-nums">
                        {dynamicBalance.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {a.currency}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.cryptoAmount.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{" "}
                        {a.cryptoCoin}
                      </p>
                    </>
                  );
                })()}
              </>
            ) : (
              <p className="text-xl font-bold tabular-nums">
                {a.balance.toLocaleString()}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {a.currency}
                </span>
              </p>
            )}
            {(() => {
              const displayCurrency = getDisplayCurrency();
              if (a.currency === displayCurrency) return null;
              const rates = getCachedRates();
              if (!rates) return null;
              const amount =
                a.type === "crypto" && a.cryptoCoin && a.cryptoAmount != null
                  ? convert(a.cryptoAmount, a.cryptoCoin, a.currency, rates)
                  : a.balance;
              const converted = convert(
                amount,
                a.currency,
                displayCurrency,
                rates,
              );
              if (converted === amount) return null;
              return (
                <p className="text-xs text-muted-foreground/60 mt-0.5 tabular-nums">
                  ≈{" "}
                  {converted.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  {displayCurrency}
                </p>
              );
            })()}
          </div>
          <div className="min-h-[1.25rem]">
            {a.type === "card" && a.cardType && (
              <span className="text-xs text-muted-foreground">
                {CARD_TYPES.find((c) => c.value === a.cardType)?.label ||
                  a.cardType}
              </span>
            )}
            {a.type === "crypto" && (
              <span className="text-xs text-muted-foreground">
                {a.cryptoCoin}
                {a.walletName && ` · ${a.walletName}`}
                {a.walletAddress && a.walletAddress.length > 12 && (
                  <span className="font-mono text-[10px] text-muted-foreground/60 ml-1.5">
                    {a.walletAddress.slice(0, 4)}...{a.walletAddress.slice(-4)}
                  </span>
                )}
              </span>
            )}
            {isDepositOrSavings && a.interestRate != null && (
              <button
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 transition-colors"
                onClick={() => setDepositCalc(a)}
              >
                <Percent className="h-3 w-3" />
                {a.interestRate}% годовых
                {a.termMonths && ` · ${a.termMonths} мес.`}
                <ChartLine className="h-3 w-3 ml-0.5" />
              </button>
            )}
            {a.type === "deposit" && a.interestRate == null && (
              <span className="text-xs text-muted-foreground">Вклад</span>
            )}
            {a.type === "card" &&
              a.cardType === "credit" &&
              a.gracePeriodDays && (
                <span className="text-xs text-muted-foreground">
                  Грейс {a.gracePeriodDays} дн.
                </span>
              )}
            {a.type === "investment" && (
              <span className="text-xs text-muted-foreground">
                Инвестиционный счёт
              </span>
            )}
            {a.type === "savings" && a.interestRate == null && (
              <span className="text-xs text-muted-foreground">
                Сберегательный счёт
              </span>
            )}
            {a.type === "cash" && (
              <span className="text-xs text-muted-foreground">
                Наличные средства
              </span>
            )}
            {a.url && (
              <div className="mt-1.5">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                >
                  <Link2 className="h-3 w-3" />
                  {a.url
                    .replace(/^https?:\/\//, "")
                    .replace(/\/.*$/, "")
                    .slice(0, 30)}
                </a>
              </div>
            )}
          </div>
        </CardContent>
        <Separator />
        <div className="flex">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/5 transition-colors rounded-bl-xl"
            onClick={() => {
              setQuickAccount(a);
              setQuickType("add");
              setQuickAmount("");
              setQuickCategoryId("");
              setQuickTags("");
              setQuickDescription("");
              setQuickLinkLoan(false);
              setQuickLoanId("");
              setNewLoanName("");
              setNewLoanTotal("");
              setNewLoanRate("");
              setNewLoanMonthly("");
              setNewLoanNextPayment("");
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Пополнить
          </button>
          <div className="w-px bg-border" />
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-500/5 transition-colors rounded-br-xl"
            onClick={() => {
              setQuickAccount(a);
              setQuickType("withdraw");
              setQuickAmount("");
              setQuickCategoryId("");
              setQuickTags("");
              setQuickDescription("");
              setQuickLinkLoan(false);
              setQuickLoanId("");
              setNewLoanName("");
              setNewLoanTotal("");
              setNewLoanRate("");
              setNewLoanMonthly("");
              setNewLoanNextPayment("");
            }}
          >
            <TrendingDown className="h-3.5 w-3.5" />
            Снять
          </button>
          <div className="w-px bg-border" />
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-indigo-600 hover:bg-indigo-500/5 transition-colors rounded-br-xl"
            onClick={() => onTransfer(a)}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Перевести
          </button>
        </div>
      </Card>
    );
  }

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
          <h2 className="text-lg font-semibold">Счета и кошельки</h2>
          <p className="text-sm text-muted-foreground">
            Общий баланс:{" "}
            <span className="font-semibold text-foreground">
              {Math.round(totalBalance).toLocaleString()} ₽
            </span>
            {" · "}
            <span className="text-xs">{accounts.length} счетов</span>
            {" · "}
            <span className="text-[10px]">
              {getDisplayCurrency()} — {usdtRate.toFixed(2)} ₽
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(showFilters && "bg-muted")}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Фильтр
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              setTransferOpen(true);
            }}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            Перевод
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Добавить счёт
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-muted/20 border border-border/40">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
              Мин. сумма
            </Label>
            <Input
              type="number"
              value={filterMin}
              onChange={(e) => setFilterMin(e.target.value)}
              placeholder="0"
              className="h-9 w-28 text-xs bg-background/60 border-border/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
              Макс. сумма
            </Label>
            <Input
              type="number"
              value={filterMax}
              onChange={(e) => setFilterMax(e.target.value)}
              placeholder="∞"
              className="h-9 w-28 text-xs bg-background/60 border-border/40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
              Приоритет
            </Label>
            <Select
              value={filterPriority}
              onValueChange={(v) => v && setFilterPriority(v)}
            >
              <SelectTrigger className="h-9 w-32 text-xs bg-background/60 border-border/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="none">Без приоритета</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-semibold">
              Сортировка
            </Label>
            <button
              onClick={() =>
                setSortBalance((prev) =>
                  prev === "none" ? "desc" : prev === "desc" ? "asc" : "none",
                )
              }
              className={cn(
                "h-9 px-3 text-xs rounded-md border bg-background/60 border-border/40 flex items-center gap-1.5 transition-colors",
                sortBalance !== "none" && "border-primary/40 bg-primary/5",
              )}
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortBalance === "none"
                ? "По балансу"
                : sortBalance === "desc"
                  ? "Больше → меньше"
                  : "Меньше → больше"}
            </button>
          </div>
          {(filterMin ||
            filterMax ||
            filterPriority !== "all" ||
            sortBalance !== "none") && (
            <button
              onClick={() => {
                setFilterMin("");
                setFilterMax("");
                setFilterPriority("all");
                setSortBalance("none");
              }}
              className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors mb-0.5"
            >
              <X className="h-3 w-3" />
              Сбросить
            </button>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedAccounts.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map((account) => (
              <SortableAccountCard
                key={account.id}
                account={account}
                onTransfer={handleCardTransfer}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Deposit projection dialog */}
      <Dialog
        open={!!depositCalc}
        onOpenChange={(open) => {
          if (!open) setDepositCalc(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-600" />
              Расчёт доходности
            </DialogTitle>
            {depositCalc && (
              <p className="text-sm text-muted-foreground">
                {depositCalc.name} · {depositCalc.balance.toLocaleString()}{" "}
                {depositCalc.currency}
              </p>
            )}
          </DialogHeader>
          {depositCalc &&
            (() => {
              const proj = depositProjections(depositCalc);
              if (!proj) return null;
              return (
                <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Ставка
                      </p>
                      <p className="text-lg font-bold text-rose-600">
                        {proj.annualRate}%
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Срок
                      </p>
                      <p className="text-lg font-bold">
                        {proj.termMonths} мес.
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/30 px-3 py-2 text-xs text-center text-muted-foreground">
                    {proj.capitalize
                      ? "Проценты капитализируются ежемесячно"
                      : "Проценты без капитализации"}
                  </div>

                  {proj.currentEarned > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-500/5 p-3">
                      <p className="text-xs text-muted-foreground">
                        Заработано сейчас
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        +{proj.currentEarned.toLocaleString()}{" "}
                        {depositCalc.currency}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <ChartLine className="h-3 w-3" />
                      Начисление процентов
                    </p>
                    <div className="space-y-1.5">
                      {proj.perPeriod.map((per) => (
                        <div
                          key={per.label}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                        >
                          <span className="text-sm">{per.label}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-emerald-600">
                              +{per.earning.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {depositCalc.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-emerald-500/10 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Начальная сумма
                      </span>
                      <span className="font-medium">
                        {proj.initialBalance.toLocaleString()}{" "}
                        {depositCalc.currency}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Проценты за {proj.termMonths} мес.
                      </span>
                      <span className="font-semibold text-emerald-600">
                        +{proj.earnedTotal.toLocaleString()}{" "}
                        {depositCalc.currency}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Итого за срок</span>
                      <span className="text-emerald-600">
                        {proj.projectedEnd.toLocaleString()}{" "}
                        {depositCalc.currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl text-sm shadow-sm",
                  TYPE_CONFIG[formType]?.color,
                  formType === "cash" && "bg-emerald-500/10 text-emerald-600",
                  formType === "card" && "bg-blue-500/10 text-blue-600",
                  formType === "crypto" && "bg-amber-500/10 text-amber-600",
                  formType === "investment" &&
                    "bg-violet-500/10 text-violet-600",
                  formType === "savings" && "bg-cyan-500/10 text-cyan-600",
                  formType === "deposit" && "bg-rose-500/10 text-rose-600",
                )}
              >
                {(() => {
                  const Icon = TYPE_CONFIG[formType]?.icon || Wallet;
                  return <Icon className="h-4 w-4" />;
                })()}
              </span>
              <div>
                <p className="text-base">{dialogTitle}</p>
                <p className="text-xs text-muted-foreground font-normal">
                  {formType === "cash" && "Наличные средства"}
                  {formType === "card" && "Банковская карта"}
                  {formType === "crypto" && "Криптовалютный кошелёк"}
                  {formType === "investment" && "Инвестиционный счёт"}
                  {formType === "savings" && "Сберегательный счёт"}
                  {formType === "deposit" && "Депозит / Вклад"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Type selector as horizontal cards */}
            <div className="flex gap-1.5 flex-wrap">
              {(
                Object.entries(TYPE_CONFIG) as [
                  AccountType,
                  (typeof TYPE_CONFIG)[AccountType],
                ][]
              ).map(([key, cfg]) => {
                const IconEl = cfg.icon;
                const isActive = formType === key;
                return (
                  <button
                    key={key}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200",
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                        : "border-input hover:bg-accent hover:border-muted-foreground/20 text-muted-foreground",
                    )}
                    onClick={() => setFormType(key)}
                  >
                    <IconEl className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Основное */}
            <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Основное
                </span>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Название счёта</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Например: Т-Банк"
                  className="h-9"
                />
              </div>
            </div>

            {formType === "card" && (
              <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                    <CreditCard className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Карта
                  </span>
                </div>
                <div className="flex gap-2">
                  {CARD_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-200",
                        formCardType === ct.value
                          ? "border-blue-500 bg-blue-500/10 text-blue-600 shadow-sm ring-1 ring-blue-500/20"
                          : "border-input hover:bg-accent hover:border-muted-foreground/20",
                      )}
                      onClick={() => setFormCardType(ct.value)}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
                {formCardType === "credit" && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Label className="text-xs font-medium">
                      Грейс-период (дней)
                    </Label>
                    <Input
                      type="number"
                      value={formGracePeriod}
                      onChange={(e) => setFormGracePeriod(e.target.value)}
                      placeholder="120"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            )}

            {formType === "crypto" && (
              <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                    <Coins className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Кошелёк
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Монета</Label>
                  <Select
                    value={formCryptoCoin}
                    onValueChange={(v) => v && setFormCryptoCoin(v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_COINS.map((coin) => (
                        <SelectItem key={coin} value={coin}>
                          {coin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Название кошелька
                    </Label>
                    <Input
                      value={formWalletName}
                      onChange={(e) => setFormWalletName(e.target.value)}
                      placeholder="MetaMask..."
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Адрес кошелька
                    </Label>
                    <Input
                      value={formWalletAddress}
                      onChange={(e) => setFormWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {(formType === "deposit" || formType === "savings") && (
              <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/10 text-rose-600">
                    <Percent className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                    Условия
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Ставка % годовых
                    </Label>
                    <Input
                      type="number"
                      value={formInterestRate}
                      onChange={(e) => setFormInterestRate(e.target.value)}
                      placeholder="8"
                      step="0.1"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Срок (мес.)</Label>
                    <Input
                      type="number"
                      value={formTermMonths}
                      onChange={(e) => setFormTermMonths(e.target.value)}
                      placeholder="12"
                      className="h-9"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border border-input transition-colors",
                      formCapitalize
                        ? "bg-primary border-primary"
                        : "group-hover:border-muted-foreground/40",
                    )}
                  >
                    {formCapitalize && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium">
                      Капитализация процентов
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Сложный процент
                    </p>
                  </div>
                </label>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Дата открытия</Label>
                  <Input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                {projectedBalance && (
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 p-4 space-y-2">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Прогноз доходности
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Начальная сумма
                      </span>
                      <span className="tabular-nums">
                        {parseFloat(formBalance).toLocaleString()} ₽
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Проценты за срок
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        +{projectedBalance.earned.toLocaleString()} ₽
                      </span>
                    </div>
                    <Separator className="bg-emerald-200/50 dark:bg-emerald-900/50" />
                    <div className="flex justify-between text-sm font-semibold tabular-nums">
                      <span>Итоговая сумма</span>
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {projectedBalance.projected.toLocaleString()} ₽
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Баланс и валюта */}
            <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                  <DollarSign className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Баланс и валюта
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3 space-y-1.5">
                  <Label className="text-xs font-medium">Сумма</Label>
                  <Input
                    type="number"
                    value={formBalance}
                    onChange={(e) => setFormBalance(e.target.value)}
                    placeholder="0"
                    className="h-9 text-base font-semibold tabular-nums"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium">Валюта</Label>
                  <CurrencySelect
                    value={formCurrency}
                    onChange={setFormCurrency}
                  />
                </div>
              </div>
            </div>

            {/* Ссылка */}
            <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/10 text-sky-600">
                  <Link2 className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Ссылка
                </span>
              </div>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://example.com/reference"
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Ссылка на оригинал счёта, скачанную выписку или заметку
              </p>
            </div>

            {/* Заметки (для всех, кроме депозитов) */}
            <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted-foreground/10 text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Заметки
                </span>
              </div>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Дополнительная информация по счёту..."
                rows={2}
                className="resize-none"
              />
            </div>
            {/* Приоритет */}
            <div className="rounded-xl border bg-card shadow-xs p-4 space-y-3">
              <div className="flex items-center gap-2.5 pb-1 border-b border-border/50">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-orange-600">
                  <Flag className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Приоритет
                </span>
              </div>
              <div className="flex gap-2">
                {[
                  {
                    value: "none",
                    label: "Нет",
                    color: "bg-muted-foreground/10 text-muted-foreground",
                  },
                  {
                    value: "low",
                    label: "Низкий",
                    color: "bg-green-500/10 text-green-600",
                  },
                  {
                    value: "medium",
                    label: "Средний",
                    color: "bg-amber-500/10 text-amber-600",
                  },
                  {
                    value: "high",
                    label: "Высокий",
                    color: "bg-red-500/10 text-red-600",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-200",
                      formPriority === opt.value
                        ? "border-current ring-1 ring-current/20 " + opt.color
                        : "border-input hover:bg-accent hover:border-muted-foreground/20 text-muted-foreground",
                    )}
                    onClick={() => setFormPriority(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formBalance.trim()}
              className="min-w-[100px]"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editId ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-4xl overflow-hidden p-0 gap-0">
          <div className="relative bg-gradient-to-br from-indigo-600/10 via-transparent to-rose-600/5 p-6 pb-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_70%)]" />
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 shadow-md shadow-indigo-500/20">
                <ArrowRightLeft className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Перевод между счетами
                </DialogTitle>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Быстрый перевод средств
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Откуда */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Откуда
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {sortedAccounts.map((a) => {
                  const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.cash;
                  const Icon = cfg.icon;
                  const selected = transferFrom === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => {
                        setTransferFrom(a.id);
                        setTransferTo(transferTo === a.id ? "" : transferTo);
                      }}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                        selected
                          ? "border-rose-300 bg-rose-50/60 dark:bg-rose-950/20 dark:border-rose-700 shadow-sm ring-1 ring-rose-200 dark:ring-rose-800"
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
                          {accountBalance(a).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {a.currency}
                        </p>
                      </div>
                      {selected && (
                        <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center -my-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-rose-100 dark:from-indigo-950/40 dark:to-rose-950/40 border border-border/30">
                <ArrowDown className="h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>

            {/* Куда */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Куда
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
                {sortedAccounts
                  .filter((a) => a.id !== transferFrom)
                  .map((a) => {
                    const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.cash;
                    const Icon = cfg.icon;
                    const selected = transferTo === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setTransferTo(a.id)}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all",
                          selected
                            ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-700 shadow-sm ring-1 ring-emerald-200 dark:ring-emerald-800"
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
                            {accountBalance(a).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {a.currency}
                          </p>
                        </div>
                        {selected && (
                          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Сумма */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold">
                  Сумма
                </Label>
                <button
                  onClick={() => setPresetsEditOpen(!presetsEditOpen)}
                  className="text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Пресеты
                </button>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0"
                  className="h-12 bg-muted/20 border-border/40 text-xl font-bold tabular-nums pr-28"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {(() => {
                    const fromAcc = accounts.find((a) => a.id === transferFrom);
                    if (!fromAcc) return null;
                    const amt = parseFloat(transferAmount);
                    if (isNaN(amt) || amt <= 0) return null;
                    const rates = getCachedRates();
                    if (!rates) return null;
                    const displayCurrency = getDisplayCurrency();
                    if (fromAcc.currency === displayCurrency) return null;
                    const converted = convert(
                      amt,
                      fromAcc.currency,
                      displayCurrency,
                      rates,
                    );
                    return (
                      <span className="text-xs text-muted-foreground/50 tabular-nums font-medium">
                        ≈{" "}
                        {converted.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {displayCurrency}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {percentPresets.map((pct, i) => {
                  const fromAcc = accounts.find((a) => a.id === transferFrom);
                  const bal = fromAcc ? accountBalance(fromAcc) : 0;
                  const val = (bal * pct) / 100;
                  return (
                    <button
                      key={i}
                      onClick={() => setTransferAmount(val.toFixed(2))}
                      disabled={!transferFrom || bal <= 0}
                      className="flex-1 min-w-[50px] py-1.5 text-[11px] font-medium rounded-lg border border-border/40 text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed tabular-nums"
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>

              {/* Пресеты сумм */}
              <div className="space-y-1.5">
                {presetsEditOpen ? (
                  <div className="space-y-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-semibold">
                        Настройка пресетов
                      </span>
                    </div>

                    {/* Проценты */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 flex items-center gap-1">
                          <Percent className="h-3 w-3" /> Проценты
                        </span>
                        <button
                          onClick={() => {
                            const next = [...percentPresets, 0].slice(0, 4);
                            setPercentPresets(next);
                            setDoc(
                              doc(db, "user_settings", uid),
                              { percentPresets: next },
                              { merge: true },
                            );
                          }}
                          disabled={percentPresets.length >= 4}
                          className="text-[10px] text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-30"
                        >
                          + Добавить
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {percentPresets.map((p, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <input
                              type="number"
                              value={p || ""}
                              onChange={(e) => {
                                const next = percentPresets.map((pp, j) =>
                                  j === i
                                    ? parseFloat(e.target.value) || 0
                                    : pp,
                                );
                                setPercentPresets(next);
                              }}
                              className="w-16 h-7 rounded-md border border-border/40 bg-muted/20 px-2 text-xs tabular-nums text-center outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span className="text-xs text-muted-foreground/50">
                              %
                            </span>
                            <button
                              onClick={() => {
                                const next = percentPresets.filter(
                                  (_, j) => j !== i,
                                );
                                setPercentPresets(next);
                                setDoc(
                                  doc(db, "user_settings", uid),
                                  { percentPresets: next },
                                  { merge: true },
                                );
                              }}
                              className="rounded p-0.5 text-muted-foreground/40 hover:text-rose-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Суммы */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground/60 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Суммы
                        </span>
                        <button
                          onClick={() => {
                            const next = [
                              ...amountPresets,
                              { value: 0, currency: "RUB" },
                            ].slice(0, 4);
                            setAmountPresets(next);
                            setDoc(
                              doc(db, "user_settings", uid),
                              { amountPresets: next },
                              { merge: true },
                            );
                          }}
                          disabled={amountPresets.length >= 4}
                          className="text-[10px] text-emerald-600 hover:text-emerald-500 transition-colors disabled:opacity-30"
                        >
                          + Добавить
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {amountPresets.map((p, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <input
                              type="number"
                              value={p.value || ""}
                              onChange={(e) => {
                                const next = amountPresets.map((pp, j) =>
                                  j === i
                                    ? {
                                        ...pp,
                                        value: parseFloat(e.target.value) || 0,
                                      }
                                    : pp,
                                );
                                setAmountPresets(next);
                              }}
                              className="w-20 h-7 rounded-md border border-border/40 bg-muted/20 px-2 text-xs tabular-nums text-center outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <select
                              value={p.currency}
                              onChange={(e) => {
                                const next = amountPresets.map((pp, j) =>
                                  j === i
                                    ? { ...pp, currency: e.target.value }
                                    : pp,
                                );
                                setAmountPresets(next);
                              }}
                              className="h-7 rounded-md border border-border/40 bg-muted/20 px-1 text-[10px] outline-none focus:border-indigo-400"
                            >
                              {CURRENCIES.filter(
                                (c) => c.type === "fiat" || c.type === "crypto",
                              )
                                .slice(0, 20)
                                .map((c) => (
                                  <option key={c.code} value={c.code}>
                                    {c.code}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => {
                                const next = amountPresets.filter(
                                  (_, j) => j !== i,
                                );
                                setAmountPresets(next);
                                setDoc(
                                  doc(db, "user_settings", uid),
                                  { amountPresets: next },
                                  { merge: true },
                                );
                              }}
                              className="rounded p-0.5 text-muted-foreground/40 hover:text-rose-500 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-1 pt-1">
                      <button
                        onClick={() => {
                          setDoc(
                            doc(db, "user_settings", uid),
                            { percentPresets, amountPresets },
                            { merge: true },
                          );
                          setPresetsEditOpen(false);
                        }}
                        className="flex-1 py-1 text-[10px] font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                      >
                        Сохранить
                      </button>
                      <button
                        onClick={() => setPresetsEditOpen(false)}
                        className="flex-1 py-1 text-[10px] font-medium rounded-md border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : amountPresets.length > 0 ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {amountPresets.map((p, i) => {
                      const fromAcc = accounts.find(
                        (a) => a.id === transferFrom,
                      );
                      let val = p.value;
                      if (
                        p.currency &&
                        fromAcc &&
                        p.currency !== fromAcc.currency
                      ) {
                        const rates = getCachedRates();
                        if (rates) {
                          val = convert(
                            p.value,
                            p.currency,
                            fromAcc.currency,
                            rates,
                          );
                        }
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => setTransferAmount(val.toFixed(2))}
                          disabled={!transferFrom || val <= 0}
                          className="flex-1 min-w-[60px] py-1.5 text-[11px] font-medium rounded-lg border border-border/40 text-muted-foreground/70 hover:bg-muted/30 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed tabular-nums"
                        >
                          {p.value.toLocaleString()} {p.currency}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Описание */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground/70 uppercase tracking-wider font-semibold">
                Описание
              </Label>
              <Input
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="Назначение перевода"
                className="h-10 bg-muted/20 border-border/40 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/40 px-5 py-3 bg-muted/10">
            <div className="text-xs text-muted-foreground/50">
              {transferFrom && transferTo && transferFrom !== transferTo && (
                <>
                  {accounts.find((a) => a.id === transferFrom)?.name} →{" "}
                  {accounts.find((a) => a.id === transferTo)?.name}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTransferOpen(false)}
                disabled={saving}
                className="h-9"
              >
                Отмена
              </Button>
              <Button
                size="sm"
                onClick={handleTransfer}
                disabled={
                  saving ||
                  !transferFrom ||
                  !transferTo ||
                  !transferAmount.trim() ||
                  transferFrom === transferTo
                }
                className="h-9 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-sm"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                Перевести
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!quickAccount}
        onOpenChange={(open) => {
          if (!open) {
            setQuickAccount(null);
            setQuickAmount("");
            setQuickCategoryId("");
            setQuickTags("");
            setQuickDescription("");
            setQuickLinkLoan(false);
            setQuickLoanId("");
            setNewLoanName("");
            setNewLoanTotal("");
            setNewLoanRate("");
            setNewLoanMonthly("");
            setNewLoanNextPayment("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {quickType === "add" ? (
                <Plus className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-600" />
              )}
              {quickType === "add" ? "Пополнить" : "Снять со счёта"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {quickAccount?.name} · Баланс:{" "}
              {quickAccount?.balance.toLocaleString()} {quickAccount?.currency}
            </p>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Сумма</Label>
              <Input
                type="number"
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="0"
                min={1}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Категория</Label>
                {!newCatOpen && (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => setNewCatOpen(true)}
                  >
                    + Новая
                  </button>
                )}
              </div>
              {newCatOpen ? (
                <div className="flex gap-2">
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Название категории"
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    disabled={!newCatName.trim() || newCatSaving}
                    onClick={async () => {
                      if (!newCatName.trim()) return;
                      setNewCatSaving(true);
                      try {
                        const created = await createCategory({
                          userId: uid,
                          name: newCatName.trim(),
                          icon:
                            quickType === "add"
                              ? "trending-up"
                              : "trending-down",
                          type: quickType === "add" ? "income" : "expense",
                          color: quickType === "add" ? "emerald" : "rose",
                        });
                        setCategories((prev) => [...prev, created]);
                        setQuickCategoryId(created.id);
                        setNewCatName("");
                        setNewCatOpen(false);
                      } catch {
                        toast.error("Ошибка создания категории");
                      } finally {
                        setNewCatSaving(false);
                      }
                    }}
                  >
                    {newCatSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "ОК"
                    )}
                  </Button>
                </div>
              ) : (
                <Select
                  value={quickCategoryId}
                  onValueChange={(v) => v && setQuickCategoryId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(
                        (c) =>
                          c.type ===
                          (quickType === "add" ? "income" : "expense"),
                      )
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Описание</Label>
              <Textarea
                value={quickDescription}
                onChange={(e) => setQuickDescription(e.target.value)}
                placeholder={
                  quickType === "add"
                    ? "Например: Аванс, Пополнение карты..."
                    : "Например: Продукты, Коммунальные..."
                }
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Теги</Label>
              <Input
                value={quickTags}
                onChange={(e) => setQuickTags(e.target.value)}
                placeholder="тег1, тег2"
              />
            </div>

            {/* Loan integration */}
            {quickType === "add" ? (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={quickLinkLoan}
                    onChange={(e) => setQuickLinkLoan(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-xs font-medium">
                    Оформить как кредит
                  </span>
                </label>
                {quickLinkLoan && (
                  <div className="rounded-lg border p-3 space-y-2.5 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      Новый кредит
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-[10px]">Название</Label>
                      <Input
                        value={newLoanName}
                        onChange={(e) => setNewLoanName(e.target.value)}
                        placeholder="Например: Потребительский кредит"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Сумма</Label>
                        <Input
                          type="number"
                          value={newLoanTotal}
                          onChange={(e) => setNewLoanTotal(e.target.value)}
                          placeholder="0"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Ставка %</Label>
                        <Input
                          type="number"
                          value={newLoanRate}
                          onChange={(e) => setNewLoanRate(e.target.value)}
                          placeholder="15"
                          className="h-7 text-xs"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">Платёж/мес</Label>
                        <Input
                          type="number"
                          value={newLoanMonthly}
                          onChange={(e) => setNewLoanMonthly(e.target.value)}
                          placeholder="0"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px]">След. платёж</Label>
                        <Input
                          type="date"
                          value={newLoanNextPayment}
                          onChange={(e) =>
                            setNewLoanNextPayment(e.target.value)
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              loans.length > 0 && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quickLinkLoan}
                      onChange={(e) => setQuickLinkLoan(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs font-medium">
                      Погашение кредита
                    </span>
                  </label>
                  {quickLinkLoan && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Кредит</Label>
                      <Select
                        value={quickLoanId}
                        onValueChange={(v) => v && setQuickLoanId(v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите кредит" />
                        </SelectTrigger>
                        <SelectContent>
                          {loans.map((l) => (
                            <SelectItem key={l.id} value={l.id}>
                              {l.name} — остаток{" "}
                              {l.remainingAmount.toLocaleString()} ₽
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {quickLoanId &&
                        (() => {
                          const loan = loans.find((l) => l.id === quickLoanId);
                          return loan ? (
                            <div className="rounded-lg bg-muted/30 p-2 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Всего
                                </span>
                                <span>
                                  {loan.totalAmount.toLocaleString()} ₽
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Остаток
                                </span>
                                <span>
                                  {loan.remainingAmount.toLocaleString()} ₽
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  После оплаты
                                </span>
                                <span className="font-medium">
                                  {Math.max(
                                    0,
                                    loan.remainingAmount -
                                      (parseFloat(quickAmount) || 0),
                                  ).toLocaleString()}{" "}
                                  ₽
                                </span>
                              </div>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  )}
                </div>
              )
            )}

            {quickAccount && quickAmount && (
              <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Было</span>
                  <span>
                    {quickAccount.balance.toLocaleString()}{" "}
                    {quickAccount.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {quickType === "add" ? "Пополнение" : "Снятие"}
                  </span>
                  <span
                    className={
                      quickType === "add" ? "text-emerald-600" : "text-rose-600"
                    }
                  >
                    {quickType === "add" ? "+" : "-"}
                    {parseFloat(quickAmount || "0").toLocaleString()}{" "}
                    {quickAccount.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                  <span>Итог</span>
                  <span>
                    {(quickType === "add"
                      ? quickAccount.balance + parseFloat(quickAmount || "0")
                      : quickAccount.balance - parseFloat(quickAmount || "0")
                    ).toLocaleString()}{" "}
                    {quickAccount.currency}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuickAccount(null);
                setQuickAmount("");
                setQuickCategoryId("");
                setQuickTags("");
                setQuickDescription("");
                setQuickLinkLoan(false);
                setQuickLoanId("");
                setNewLoanName("");
                setNewLoanTotal("");
                setNewLoanRate("");
                setNewLoanMonthly("");
                setNewLoanNextPayment("");
              }}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleQuickAmount}
              disabled={
                !quickAmount ||
                parseFloat(quickAmount) <= 0 ||
                !!(
                  quickType === "withdraw" &&
                  quickAccount &&
                  parseFloat(quickAmount) > quickAccount.balance
                )
              }
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {quickType === "add" ? "Пополнить" : "Снять"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
