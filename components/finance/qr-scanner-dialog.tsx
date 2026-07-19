"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import type {
  FinanceAccount,
  TransactionCategory,
  TransactionType,
} from "@/lib/finance-types";
import { createTransaction } from "@/lib/finance-client";

function parseQRData(text: string): { amount: number; date: string } | null {
  const params = new URLSearchParams(text);
  const t = params.get("t");
  const s = params.get("s");
  if (!t || !s) return null;
  const amount = parseFloat(s.replace(",", "."));
  if (isNaN(amount) || amount <= 0) return null;
  const match = t.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(?:(\d{2}))?$/,
  );
  if (!match) return { amount, date: new Date().toISOString().slice(0, 16) };
  const [, y, m, d, hh, mm] = match;
  const date = `${y}-${m}-${d}T${hh}:${mm}`;
  return { amount, date };
}

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: FinanceAccount[];
  categories: TransactionCategory[];
  uid: string;
  onTransactionCreated: () => void;
}

export function QrScannerDialog({
  open,
  onOpenChange,
  accounts,
  categories,
  uid,
  onTransactionCreated,
}: QrScannerDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [step, setStep] = useState<"scan" | "form">("scan");
  const [amount, setAmount] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txAccountId, setTxAccountId] = useState("");
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [scanError, setScanError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("scan");
      setAmount("");
      setTxDate("");
      setTxAccountId("");
      setTxType("expense");
      setTxCategoryId("");
      setTxDescription("");
      setScanError("");
      scannerRef.current?.stop().catch(() => {});
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          const parsed = parseQRData(decodedText);
          if (parsed) {
            setAmount(parsed.amount.toString());
            setTxDate(parsed.date);
            setStep("form");
          } else {
            setScanError("Не удалось распознать чек. Попробуйте снова.");
          }
        },
        () => {},
      )
      .catch(() => {
        setScanError("Не удалось открыть камеру. Разрешите доступ к камере.");
      });
    return () => {
      scanner.stop().catch(() => {});
    };
  }, [open]);

  const handleSave = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }
    if (!txAccountId) {
      toast.error("Выберите счёт");
      return;
    }
    const dateValue = txDate.includes("T") ? txDate : txDate + "T12:00:00";
    setSaving(true);
    try {
      await createTransaction({
        id: crypto.randomUUID(),
        userId: uid,
        accountId: txAccountId,
        type: txType,
        categoryId:
          txCategoryId ||
          (txType === "income"
            ? "fin-cat-income-1"
            : "fin-cat-1"),
        amount: parsed,
        description: txDescription,
        tags: [],
        date: dateValue,
      });
      toast.success("Операция создана");
      onTransactionCreated();
      onOpenChange(false);
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter((c) =>
    txType === "income"
      ? c.type === "income"
      : c.type === "expense",
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "scan" ? "Сканировать QR-код" : "Новая операция"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {step === "scan" ? (
            <div className="space-y-3">
              <div
                ref={containerRef}
                id="qr-reader"
                className="w-full aspect-square bg-muted rounded-lg overflow-hidden"
              />
              {scanError && (
                <p className="text-xs text-destructive text-center">
                  {scanError}
                </p>
              )}
              {!scanError && (
                <p className="text-xs text-muted-foreground text-center">
                  Наведите камеру на QR-код чека
                </p>
              )}
              {scanError && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setScanError("");
                      scannerRef.current
                        ?.start(
                          { facingMode: "environment" },
                          { fps: 10, qrbox: { width: 250, height: 250 } },
                          (decodedText) => {
                            scannerRef.current?.stop().catch(() => {});
                            const parsed = parseQRData(decodedText);
                            if (parsed) {
                              setAmount(parsed.amount.toString());
                              setTxDate(parsed.date);
                              setStep("form");
                            } else {
                              setScanError(
                                "Не удалось распознать чек. Попробуйте снова.",
                              );
                            }
                          },
                          () => {},
                        )
                        .catch(() => {});
                    }}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Повторить
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => setStep("form")}
                  >
                    Заполнить вручную
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Счёт</Label>
                <Select
                  value={txAccountId}
                  onValueChange={(v) => v && setTxAccountId(v)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Выберите счёт" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                        <span className="text-muted-foreground ml-2">
                          {a.balance.toLocaleString()} {a.currency}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Сумма</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Тип</Label>
                  <Select
                    value={txType}
                    onValueChange={(v) => {
                      if (v) {
                        setTxType(v as TransactionType);
                        setTxCategoryId("");
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Расход</SelectItem>
                      <SelectItem value="income">Доход</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Категория</Label>
                <Select
                  value={txCategoryId}
                  onValueChange={(v) => v && setTxCategoryId(v)}
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <span className="text-base">{c.icon}</span>
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Дата и время</Label>
                <Input
                  type="datetime-local"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Описание</Label>
                <Textarea
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Необязательно"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Сохранить
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
