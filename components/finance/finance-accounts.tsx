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
  Check,
} from "lucide-react";
import type { FinanceAccount } from "@/lib/finance-types";
import { CURRENCIES } from "@/lib/finance-types";
import { auth } from "@/lib/firebase";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AccountType = FinanceAccount["type"];
const CARD_TYPES = [
  { value: "debit" as const, label: "Дебетовая" },
  { value: "credit" as const, label: "Кредитная" },
  { value: "business" as const, label: "Бизнес" },
];
const CRYPTO_COINS = [
  "BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "XRP", "ADA", "DOT", "AVAX", "DOGE", "MATIC", "TRX", "TON", "LINK", "UNI",
];

const TYPE_CONFIG: Record<AccountType, { label: string; icon: React.ElementType; color: string }> = {
  cash: { label: "Наличные", icon: Coins, color: "text-emerald-600 bg-emerald-500/10" },
  card: { label: "Карта", icon: CreditCard, color: "text-blue-600 bg-blue-500/10" },
  crypto: { label: "Криптовалюта", icon: Bitcoin, color: "text-orange-600 bg-orange-500/10" },
  investment: { label: "Инвестиции", icon: TrendingUp, color: "text-purple-600 bg-purple-500/10" },
  savings: { label: "Сбережения", icon: PiggyBank, color: "text-sky-600 bg-sky-500/10" },
  deposit: { label: "Вклад", icon: Building2, color: "text-rose-600 bg-rose-500/10" },
};

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.label.toLowerCase().includes(search.toLowerCase()),
    ),
    [search],
  );

  const selected = CURRENCIES.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="outline" role="combobox" className="w-full justify-between text-sm font-normal">
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-base">{selected.symbol}</span>
              <span>{selected.code}</span>
            </span>
          ) : (
            "Выберите валюту"
          )}
          <ChevronDown className="h-3.5 w-3.5 ml-auto opacity-50" />
        </Button>
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
          <p className="text-xs text-muted-foreground py-2 text-center">Ничего не найдено</p>
        ) : (
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
            {filtered
              .reduce<{ type: string; label: string; items: (typeof CURRENCIES)[number][] }[]>(
                (groups, c) => {
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
                },
                [],
              )
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
                      <span className="text-base w-5 text-center">{c.symbol}</span>
                      <span className="font-medium">{c.code}</span>
                      <span className="text-xs text-muted-foreground truncate">{c.label}</span>
                      {value === c.code && <Check className="h-3.5 w-3.5 ml-auto" />}
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("card");
  const [formBalance, setFormBalance] = useState("");
  const [formCurrency, setFormCurrency] = useState("RUB");
  const [formCardType, setFormCardType] = useState<"debit" | "credit" | "business">("debit");
  const [formCryptoCoin, setFormCryptoCoin] = useState("BTC");
  const [formWalletName, setFormWalletName] = useState("");
  const [formWalletAddress, setFormWalletAddress] = useState("");
  const [formInterestRate, setFormInterestRate] = useState("");
  const [formTermMonths, setFormTermMonths] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formShowCalc, setFormShowCalc] = useState(false);

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");

  const [quickAccount, setQuickAccount] = useState<FinanceAccount | null>(null);
  const [quickType, setQuickType] = useState<"add" | "withdraw">("add");
  const [quickAmount, setQuickAmount] = useState("");

  const uid = auth.currentUser?.uid || "user-1";
  const dialogTitle = editId ? "Редактировать счёт" : "Новый счёт";

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/accounts?uid=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch {
      console.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  useEffect(() => {
    const lastType = localStorage.getItem("finance_last_account_type") as AccountType | null;
    const lastCurrency = localStorage.getItem("finance_last_account_currency");
    if (lastType && TYPE_CONFIG[lastType]) setFormType(lastType);
    if (lastCurrency) setFormCurrency(lastCurrency);
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormType(localStorage.getItem("finance_last_account_type") as AccountType || "card");
    setFormBalance("");
    setFormCurrency(localStorage.getItem("finance_last_account_currency") || "RUB");
    setFormCardType("debit");
    setFormCryptoCoin("BTC");
    setFormWalletName("");
    setFormWalletAddress("");
    setFormInterestRate("");
    setFormTermMonths("");
    setFormStartDate("");
    setFormNotes("");
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
    setFormCurrency(account.currency);
    setFormCardType(account.cardType || "debit");
    setFormCryptoCoin(account.cryptoCoin || "BTC");
    setFormWalletName(account.walletName || "");
    setFormWalletAddress(account.walletAddress || "");
    setFormInterestRate(account.interestRate ? String(account.interestRate) : "");
    setFormTermMonths(account.termMonths ? String(account.termMonths) : "");
    setFormStartDate(account.startDate || "");
    setFormNotes(account.notes || "");
    setFormShowCalc(false);
    setEditId(account.id);
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!formName.trim() || !formBalance.trim()) return;
    setSaving(true);
    const balance = parseFloat(formBalance);
    if (isNaN(balance)) { setSaving(false); return; }

    localStorage.setItem("finance_last_account_type", formType);
    localStorage.setItem("finance_last_account_currency", formCurrency);

    const body: Record<string, unknown> = {
      userId: uid,
      name: formName.trim(),
      type: formType,
      balance,
      currency: formCurrency,
      notes: formNotes || undefined,
    };

    if (formType === "card") body.cardType = formCardType;
    if (formType === "crypto") {
      body.cryptoCoin = formCryptoCoin;
      body.walletName = formWalletName || undefined;
      body.walletAddress = formWalletAddress || undefined;
    }
    if (formType === "deposit") {
      body.interestRate = formInterestRate ? parseFloat(formInterestRate) : undefined;
      body.termMonths = formTermMonths ? parseInt(formTermMonths) : undefined;
      body.startDate = formStartDate || undefined;
    }

    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId
        ? `/api/finance/accounts?id=${editId}`
        : "/api/finance/accounts";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved: FinanceAccount = await res.json();
        setAccounts((prev) => {
          if (editId) return prev.map((a) => (a.id === saved.id ? saved : a));
          return [...prev, saved];
        });
        setDialogOpen(false);
        resetForm();
      }
    } catch {
      console.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/accounts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      console.error("Failed to delete account");
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount.trim()) return;
    if (transferFrom === transferTo) return;
    setSaving(true);
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) { setSaving(false); return; }

    const fromAcc = accounts.find((a) => a.id === transferFrom);
    const toAcc = accounts.find((a) => a.id === transferTo);
    if (!fromAcc || !toAcc || fromAcc.balance < amount) { setSaving(false); return; }

    try {
      const txBody = {
        userId: uid,
        accountId: transferFrom,
        type: "transfer" as const,
        categoryId: "fin-cat-9",
        amount,
        description: transferDescription.trim() || "Перевод между счетами",
        tags: ["transfer"],
        date: new Date().toISOString().split("T")[0],
      };
      const txRes = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txBody),
      });
      if (!txRes.ok) return;

      await fetch(`/api/finance/accounts?id=${transferFrom}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: fromAcc.balance - amount, userId: uid }),
      });
      await fetch(`/api/finance/accounts?id=${transferTo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ balance: toAcc.balance + amount, userId: uid }),
      });

      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === transferFrom) return { ...a, balance: a.balance - amount };
          if (a.id === transferTo) return { ...a, balance: a.balance + amount };
          return a;
        }),
      );
      setTransferOpen(false);
      setTransferFrom("");
      setTransferTo("");
      setTransferAmount("");
      setTransferDescription("");
    } catch {
      console.error("Failed to transfer");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAmount = useCallback(async () => {
    if (!quickAccount || !quickAmount) return;
    const amount = parseFloat(quickAmount);
    if (isNaN(amount) || amount <= 0) return;

    const delta = quickType === "add" ? amount : -amount;
    const newBalance = quickAccount.balance + delta;
    if (newBalance < 0) return;

    try {
      await Promise.all([
        fetch(`/api/finance/accounts?id=${quickAccount.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ balance: newBalance, userId: uid }),
        }),
        fetch("/api/finance/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: uid,
            accountId: quickAccount.id,
            type: quickType === "add" ? "income" : "expense",
            categoryId: quickType === "add" ? "fin-cat-9" : "fin-cat-8",
            amount,
            description: quickType === "add" ? "Пополнение счёта" : "Снятие со счёта",
            tags: [quickType === "add" ? "topup" : "withdrawal"],
            date: new Date().toISOString().split("T")[0],
          }),
        }),
      ]);

      setAccounts((prev) =>
        prev.map((a) => (a.id === quickAccount.id ? { ...a, balance: newBalance } : a)),
      );
      setQuickAccount(null);
      setQuickAmount("");
    } catch {
      console.error("Failed to update balance");
    }
  }, [quickAccount, quickType, quickAmount]);

  const projectedBalance = useMemo(() => {
    if (formType !== "deposit" || !formBalance || !formInterestRate || !formTermMonths) return null;
    const p = parseFloat(formBalance);
    const r = parseFloat(formInterestRate) / 100 / 12;
    const n = parseInt(formTermMonths);
    if (isNaN(p) || isNaN(r) || isNaN(n) || p <= 0 || r <= 0 || n <= 0) return null;
    const projected = p * Math.pow(1 + r, n);
    const earned = projected - p;
    return { projected: Math.round(projected), earned: Math.round(earned) };
  }, [formType, formBalance, formInterestRate, formTermMonths]);

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Счета и кошельки</h2>
          <p className="text-sm text-muted-foreground">
            Общий баланс:{" "}
            <span className="font-semibold text-foreground">{totalBalance.toLocaleString()} ₽</span>
            {" · "}
            <span className="text-xs">{accounts.length} счетов</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setTransferOpen(true); }}>
            <ArrowRightLeft className="h-4 w-4 mr-1.5" />
            Перевод
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Добавить счёт
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const cfg = TYPE_CONFIG[account.type] || TYPE_CONFIG.cash;
          const Icon = cfg.icon;
          return (
            <Card key={account.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", cfg.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(account)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(account.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xl font-bold tabular-nums">
                  {account.balance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{account.currency}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {account.cardType && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {CARD_TYPES.find((c) => c.value === account.cardType)?.label}
                    </Badge>
                  )}
                  {account.cryptoCoin && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {account.cryptoCoin}
                    </Badge>
                  )}
                  {account.interestRate != null && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                      {account.interestRate}%
                    </Badge>
                  )}
                  {account.walletName && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 truncate max-w-[120px]">
                      {account.walletName}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <div className="flex border-t">
                <button
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/5 transition-colors rounded-bl-xl"
                  onClick={() => { setQuickAccount(account); setQuickType("add"); setQuickAmount(""); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Пополнить
                </button>
                <div className="w-px bg-border" />
                <button
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/5 transition-colors rounded-br-xl"
                  onClick={() => { setQuickAccount(account); setQuickType("withdraw"); setQuickAmount(""); }}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  Снять
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md text-xs",
                TYPE_CONFIG[formType]?.color,
              )}>
                {(() => { const Icon = TYPE_CONFIG[formType]?.icon || Wallet; return <Icon className="h-3.5 w-3.5" />; })()}
              </span>
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Название</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Например: Т-Банк" />
              </div>
              <div className="space-y-1.5 w-[130px]">
                <Label className="text-xs">Тип</Label>
                <Select value={formType} onValueChange={(v) => v && setFormType(v as AccountType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TYPE_CONFIG) as [AccountType, typeof TYPE_CONFIG[AccountType]][]).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <cfg.icon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formType === "card" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Тип карты</Label>
                <div className="flex gap-2">
                  {CARD_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      className={cn(
                        "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                        formCardType === ct.value
                          ? "border-blue-500 bg-blue-500/10 text-blue-600"
                          : "border-input hover:bg-muted",
                      )}
                      onClick={() => setFormCardType(ct.value)}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formType === "crypto" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Монета</Label>
                  <Select value={formCryptoCoin} onValueChange={(v) => v && setFormCryptoCoin(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRYPTO_COINS.map((coin) => (
                        <SelectItem key={coin} value={coin}>{coin}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Название кошелька</Label>
                  <Input value={formWalletName} onChange={(e) => setFormWalletName(e.target.value)} placeholder="MetaMask, Ledger..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Адрес кошелька</Label>
                  <Input value={formWalletAddress} onChange={(e) => setFormWalletAddress(e.target.value)} placeholder="0x..." className="font-mono text-xs" />
                </div>
              </>
            )}

            {formType === "deposit" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ставка % годовых</Label>
                    <Input
                      type="number"
                      value={formInterestRate}
                      onChange={(e) => setFormInterestRate(e.target.value)}
                      placeholder="8"
                      step="0.1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Срок (мес.)</Label>
                    <Input
                      type="number"
                      value={formTermMonths}
                      onChange={(e) => setFormTermMonths(e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Дата открытия</Label>
                  <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                </div>
                {projectedBalance && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-500/5 p-3 space-y-1.5">
                    <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                      <Percent className="h-3 w-3" />
                      Прогноз доходности
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Начальная сумма</span>
                      <span>{parseFloat(formBalance).toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Проценты за срок</span>
                      <span className="text-emerald-600 font-medium">+{projectedBalance.earned.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1 border-t border-emerald-200">
                      <span>Итоговая сумма</span>
                      <span>{projectedBalance.projected.toLocaleString()} ₽</span>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Баланс</Label>
                <Input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Валюта</Label>
                <CurrencySelect value={formCurrency} onChange={setFormCurrency} />
              </div>
            </div>

            {(formType !== "deposit" && formType !== "crypto") && (
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  Комментарий
                </Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Заметки по счёту..."
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setDialogOpen(false); resetForm(); }} disabled={saving}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !formName.trim() || !formBalance.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editId ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Перевод между счетами</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Откуда</Label>
              <Select value={transferFrom} onValueChange={(v) => v && setTransferFrom(v)}>
                <SelectTrigger><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} {a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Куда</Label>
              <Select value={transferTo} onValueChange={(v) => v && setTransferTo(v)}>
                <SelectTrigger><SelectValue placeholder="Выберите счёт" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter((a) => a.id !== transferFrom).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString()} {a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Сумма</Label>
              <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Описание</Label>
              <Input value={transferDescription} onChange={(e) => setTransferDescription(e.target.value)} placeholder="Назначение перевода" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setTransferOpen(false)} disabled={saving}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleTransfer} disabled={saving || !transferFrom || !transferTo || !transferAmount.trim() || transferFrom === transferTo}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Перевести
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!quickAccount} onOpenChange={(open) => { if (!open) { setQuickAccount(null); setQuickAmount(""); } }}>
        <DialogContent className="sm:max-w-xs">
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
              {quickAccount?.name} · Баланс: {quickAccount?.balance.toLocaleString()} {quickAccount?.currency}
            </p>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
            {quickAccount && quickAmount && (
              <div className="rounded-lg bg-muted/50 p-2.5 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Было</span>
                  <span>{quickAccount.balance.toLocaleString()} {quickAccount.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{quickType === "add" ? "Пополнение" : "Снятие"}</span>
                  <span className={quickType === "add" ? "text-emerald-600" : "text-rose-600"}>
                    {quickType === "add" ? "+" : "-"}{parseFloat(quickAmount || "0").toLocaleString()} {quickAccount.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                  <span>Итог</span>
                  <span>
                    {(quickType === "add"
                      ? quickAccount.balance + parseFloat(quickAmount || "0")
                      : quickAccount.balance - parseFloat(quickAmount || "0")
                    ).toLocaleString()} {quickAccount.currency}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setQuickAccount(null); setQuickAmount(""); }}>
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleQuickAmount}
              disabled={!quickAmount || parseFloat(quickAmount) <= 0 || !!(quickType === "withdraw" && quickAccount && parseFloat(quickAmount) > quickAccount.balance)}
            >
              {quickType === "add" ? "Пополнить" : "Снять"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
