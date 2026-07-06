"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Landmark,
  CreditCard,
  TrendingUp,
  PiggyBank,
  Coins,
  Loader2,
} from "lucide-react";
import type { FinanceAccount } from "@/lib/finance-types";
import { mockFinanceAccounts } from "@/lib/finance-mock";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ACCOUNT_TYPE_ICONS: Record<string, React.ElementType> = {
  cash: Coins,
  card: CreditCard,
  crypto: TrendingUp,
  investment: Landmark,
  savings: PiggyBank,
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: "Наличные",
  card: "Карта",
  crypto: "Криптовалюта",
  investment: "Инвестиции",
  savings: "Сбережения",
};

function getNextId(accounts: FinanceAccount[]): string {
  const max = accounts.reduce((m, a) => {
    const n = parseInt(a.id.replace("fin-acc-", ""), 10);
    return n > m ? n : m;
  }, 0);
  return `fin-acc-${max + 1}`;
}

export function FinanceAccounts() {
  const [accounts, setAccounts] =
    useState<FinanceAccount[]>(mockFinanceAccounts);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<FinanceAccount | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<FinanceAccount["type"]>("cash");
  const [formBalance, setFormBalance] = useState("");
  const [formCurrency, setFormCurrency] = useState("RUB");

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDescription, setTransferDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const uid = auth.currentUser?.uid || "user-1";

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

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const resetForm = () => {
    setFormName("");
    setFormType("cash");
    setFormBalance("");
    setFormCurrency("RUB");
  };

  const openEdit = (account: FinanceAccount) => {
    setEditAccount(account);
    setFormName(account.name);
    setFormType(account.type);
    setFormBalance(String(account.balance));
    setFormCurrency(account.currency);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formBalance.trim()) return;
    setSaving(true);
    const balance = parseFloat(formBalance);
    if (isNaN(balance)) {
      setSaving(false);
      return;
    }
    try {
      const isEdit = editAccount && editOpen;
      const body = {
        id: isEdit ? editAccount!.id : getNextId(accounts),
        userId: uid,
        name: formName.trim(),
        type: formType,
        balance,
        currency: formCurrency,
      };
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch("/api/finance/accounts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const saved: FinanceAccount = await res.json();
        setAccounts((prev) => {
          if (isEdit) {
            return prev.map((a) => (a.id === saved.id ? saved : a));
          }
          return [...prev, saved];
        });
        if (isEdit) setEditOpen(false);
        else setAddOpen(false);
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
      const res = await fetch("/api/finance/accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
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
    if (fromAcc.balance < amount) {
      setSaving(false);
      return;
    }

    try {
      const txBody = {
        id: `fin-tx-${Date.now()}`,
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

      const fromBody = { id: transferFrom, balance: fromAcc.balance - amount };
      await fetch("/api/finance/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fromBody),
      });

      const toBody = { id: transferTo, balance: toAcc.balance + amount };
      await fetch("/api/finance/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toBody),
      });

      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id === transferFrom)
            return { ...a, balance: a.balance - amount };
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
        <div>
          <h2 className="text-lg font-semibold">Счета и кошельки</h2>
          <p className="text-sm text-muted-foreground">
            Общий баланс:{" "}
            <span className="font-semibold text-foreground">
              {totalBalance.toLocaleString()} ₽
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetForm();
              setTransferOpen(true);
            }}
          >
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Перевод
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Добавить счёт
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const Icon = ACCOUNT_TYPE_ICONS[account.type] || Wallet;
          return (
            <Card key={account.id} size="sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm">{account.name}</CardTitle>
                </div>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {account.balance.toLocaleString()} {account.currency}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Новый счёт</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Название счёта"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select
                value={formType}
                onValueChange={(v) =>
                  v && setFormType(v as FinanceAccount["type"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Баланс</Label>
              <Input
                type="number"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Валюта</Label>
              <Input
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                placeholder="RUB"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formBalance.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Редактировать счёт</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Название счёта"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Тип</Label>
              <Select
                value={formType}
                onValueChange={(v) =>
                  v && setFormType(v as FinanceAccount["type"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Баланс</Label>
              <Input
                type="number"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Валюта</Label>
              <Input
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                placeholder="RUB"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formBalance.trim()}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Сохранить
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
              <Select
                value={transferFrom}
                onValueChange={(v) => v && setTransferFrom(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
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
              <Select
                value={transferTo}
                onValueChange={(v) => v && setTransferTo(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите счёт" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== transferFrom)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.balance.toLocaleString()} {a.currency})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Сумма</Label>
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Описание (необязательно)</Label>
              <Input
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                placeholder="Назначение перевода"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTransferOpen(false)}
              disabled={saving}
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
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Перевести
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
