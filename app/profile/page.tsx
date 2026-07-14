"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  User,
  LogOut,
  Loader2,
  Save,
  ArrowLeft,
  Mail,
  CreditCard,
  Bitcoin,
  CheckCircle2,
  Crown,
  MessageCircle,
  Sparkles,
  Hash,
  Trash2,
  Star,
  Plus,
  Check,
  X,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { TARIFF_FEATURES } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TIER_ORDER = ["basic", "pro", "apex"] as const;
const BRAND_ICONS: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  mir: "MIR",
  amex: "AMEX",
  maestro: "MAESTRO",
};
const BRAND_COLORS: Record<string, string> = {
  visa: "from-blue-600 to-blue-800",
  mastercard: "from-orange-500 to-red-600",
  mir: "from-green-500 to-green-700",
  amex: "from-sky-500 to-indigo-600",
  maestro: "from-red-500 to-yellow-500",
};

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

export default function ProfilePage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [tariff, setTariff] = useState<string>("basic");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "crypto" | null>(
    null,
  );
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [autoPay, setAutoPay] = useState(false);
  const [savedCards, setSavedCards] = useState<
    Array<{
      id: string;
      brand: string;
      last4: string;
      expiryMonth: number;
      expiryYear: number;
      isDefault: boolean;
    }>
  >([]);

  // Add card form
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardAdding, setCardAdding] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/auth");
        return;
      }

      setUid(firebaseUser.uid);
      setEmail(firebaseUser.email);
      setNickname(firebaseUser.displayName || "");

      try {
        const res = await fetch(`/api/auth/profile?uid=${firebaseUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.tariff) setTariff(data.tariff);
          if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
          if (data.defaultCardId) setDefaultCardId(data.defaultCardId);
          if (typeof data.autoPay === "boolean") setAutoPay(data.autoPay);
          if (Array.isArray(data.savedCards)) setSavedCards(data.savedCards);
        }
      } catch {
        // use defaults
      }

      setInitialLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveNickname = async () => {
    if (!uid || !nickname.trim()) return;
    setSaving(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nickname.trim() });
      }
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, nickname: nickname.trim() }),
      });
      toast.success("Профиль обновлён");
    } catch {
      toast.error("Ошибка обновления профиля");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!uid) return;
    setSettingsSaving(true);
    try {
      const body: Record<string, unknown> = { uid };
      const isCrypto = paymentMethod === "crypto";
      body.paymentMethod = isCrypto ? "crypto" : "card";
      body.defaultCardId = isCrypto ? null : defaultCardId;
      body.autoPay = isCrypto ? false : autoPay;
      body.savedCards = savedCards;

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка сохранения");
        return;
      }

      const data = await res.json();
      setPaymentMethod(data.paymentMethod);
      setDefaultCardId(data.defaultCardId);
      setAutoPay(data.autoPay);
      if (data.savedCards) setSavedCards(data.savedCards);
      toast.success("Настройки оплаты сохранены");
    } catch {
      toast.error("Ошибка сохранения настроек");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleAddCard = async () => {
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 13 || digits.length > 19) {
      toast.error("Неверный номер карты");
      return;
    }
    const expParts = cardExpiry.split("/");
    if (expParts.length !== 2) {
      toast.error("Неверный срок действия");
      return;
    }
    const expMonth = parseInt(expParts[0], 10);
    const expYear = parseInt(expParts[1], 10);
    if (expMonth < 1 || expMonth > 12 || expYear < 24 || expYear > 40) {
      toast.error("Неверный срок действия");
      return;
    }

    setCardAdding(true);
    const brand = detectCardNumber(digits);
    const last4 = digits.slice(-4);
    const cardId = "card_" + Date.now();
    const isFirst = savedCards.length === 0;

    const newCard = {
      id: cardId,
      brand,
      last4,
      expiryMonth: expMonth,
      expiryYear: expYear,
      isDefault: isFirst,
    };

    const updatedCards = savedCards
      .map((c) => ({ ...c, isDefault: false }))
      .concat(newCard);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          savedCards: updatedCards,
          paymentMethod: "card",
          defaultCardId: isFirst ? cardId : defaultCardId,
          autoPay,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка");
        return;
      }

      const data = await res.json();
      setSavedCards(data.savedCards || updatedCards);
      setPaymentMethod("card");
      if (isFirst) setDefaultCardId(cardId);
      setAddDialogOpen(false);
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      toast.success("Карта добавлена");
    } catch {
      toast.error("Ошибка добавления карты");
    } finally {
      setCardAdding(false);
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    const updated = savedCards
      .filter((c) => c.id !== cardId)
      .map((c, i) => ({
        ...c,
        isDefault: c.isDefault || (i === 0 && defaultCardId === cardId),
      }));

    const newDefault =
      defaultCardId === cardId
        ? updated.length > 0
          ? updated[0].id
          : null
        : defaultCardId;

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          savedCards: updated,
          defaultCardId: newDefault,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка");
        return;
      }

      setSavedCards(updated);
      setDefaultCardId(newDefault);
      if (updated.length === 0) {
        setPaymentMethod(null);
        setAutoPay(false);
      }
      toast.success("Карта удалена");
    } catch {
      toast.error("Ошибка удаления карты");
    }
  };

  const handleSetDefaultCard = async (cardId: string) => {
    const updated = savedCards.map((c) => ({
      ...c,
      isDefault: c.id === cardId,
    }));
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          savedCards: updated,
          defaultCardId: cardId,
        }),
      });
      if (!res.ok) return;
      setSavedCards(updated);
      setDefaultCardId(cardId);
      toast.success("Карта по умолчанию изменена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Выход выполнен");
      router.push("/auth");
    } catch {
      toast.error("Ошибка выхода");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tierInfo = TARIFF_FEATURES[tariff] || TARIFF_FEATURES.basic;
  const currentTierIndex = TIER_ORDER.indexOf(
    tariff as (typeof TIER_ORDER)[number],
  );
  const defaultCard = savedCards.find((c) => c.id === defaultCardId);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ========== КОЛОНКА ПРОФИЛЯ ========== */}
          <div className="lg:col-span-2 space-y-5">
            {/* Профиль */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                      <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-bold truncate">
                      {nickname || "Пользователь"}
                    </h1>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 mt-0.5">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono tracking-tighter">
                        {uid?.slice(0, 8)}…{uid?.slice(-4)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1.5 text-xs font-medium shrink-0"
                  >
                    <Crown
                      className={cn(
                        "h-3 w-3",
                        tariff === "apex"
                          ? "text-amber-500"
                          : tariff === "pro"
                            ? "text-violet-500"
                            : "text-muted-foreground/60",
                      )}
                    />
                    {tierInfo.name}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="border-t pt-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Никнейм"
                      maxLength={30}
                      className="pr-20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 select-none">
                      {nickname.length}/30
                    </span>
                  </div>
                  <Button
                    onClick={handleSaveNickname}
                    disabled={saving || !nickname.trim()}
                    size="sm"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Сохранить
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Тариф */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown
                      className={cn(
                        "h-5 w-5",
                        tariff === "apex"
                          ? "text-amber-500"
                          : tariff === "pro"
                            ? "text-violet-500"
                            : "text-muted-foreground/60",
                      )}
                    />
                    {tierInfo.name} · {tierInfo.price}
                  </CardTitle>
                  <CardDescription>Ваш текущий тарифный план</CardDescription>
                </div>
                <Link href="/tariffs">
                  <Button variant="outline" size="sm">
                    Сменить тариф
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tierInfo.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground/80"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {currentTierIndex < TIER_ORDER.length - 1 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Link
                      href="/tariffs"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Перейти на{" "}
                      {
                        TARIFF_FEATURES[TIER_ORDER[currentTierIndex + 1]].name
                      } —{" "}
                      {TARIFF_FEATURES[TIER_ORDER[currentTierIndex + 1]].price}
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Оплата */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Способы оплаты
                </CardTitle>
                <CardDescription>
                  Управление картами и настройками списания
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Сохранённые карты */}
                {savedCards.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                      Сохранённые карты
                    </p>
                    {savedCards.map((card) => {
                      const isDefault = card.id === defaultCardId;
                      return (
                        <div
                          key={card.id}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3.5 transition-all",
                            isDefault
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/60 bg-muted/20 hover:bg-muted/40",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-14 items-center justify-center rounded-lg bg-gradient-to-br text-[9px] font-black tracking-wider text-white shadow-sm shrink-0",
                              BRAND_COLORS[card.brand] ||
                                "from-gray-600 to-gray-800",
                            )}
                          >
                            {BRAND_ICONS[card.brand] ||
                              card.brand.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                •••• {card.last4}
                              </span>
                              {isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="h-5 text-[10px] px-1.5 gap-1"
                                >
                                  <Star className="h-2.5 w-2.5 fill-current" />
                                  По умолчанию
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">
                              {String(card.expiryMonth).padStart(2, "0")}/
                              {card.expiryYear}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!isDefault && (
                              <button
                                onClick={() => handleSetDefaultCard(card.id)}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all"
                                title="Сделать картой по умолчанию"
                              >
                                <Star className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveCard(card.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                              title="Удалить карту"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Добавить карту */}
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      {savedCards.length === 0
                        ? "Добавить карту"
                        : "Добавить ещё карту"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Добавить карту</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground/80">
                          Номер карты
                        </label>
                        <div className="relative">
                          <Input
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(formatCardNumber(e.target.value))
                            }
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                            className="pl-3 pr-10"
                          />
                          {cardNumber.replace(/\s/g, "").length >= 4 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div
                                className={cn(
                                  "flex h-6 w-9 items-center justify-center rounded text-[7px] font-black tracking-wider text-white",
                                  BRAND_COLORS[
                                    detectCardNumber(
                                      cardNumber.replace(/\s/g, ""),
                                    )
                                  ],
                                )}
                              >
                                {
                                  BRAND_ICONS[
                                    detectCardNumber(
                                      cardNumber.replace(/\s/g, ""),
                                    )
                                  ]
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground/80">
                            Срок
                          </label>
                          <Input
                            value={cardExpiry}
                            onChange={(e) =>
                              setCardExpiry(formatExpiry(e.target.value))
                            }
                            placeholder="MM/YY"
                            maxLength={5}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground/80">
                            CVC
                          </label>
                          <Input
                            value={cardCvc}
                            onChange={(e) =>
                              setCardCvc(
                                e.target.value.replace(/\D/g, "").slice(0, 4),
                              )
                            }
                            placeholder="123"
                            maxLength={4}
                            type="password"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleAddCard}
                        disabled={
                          cardAdding ||
                          cardNumber.replace(/\s/g, "").length < 13 ||
                          cardExpiry.length < 4
                        }
                        className="w-full gap-1.5"
                      >
                        {cardAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        {cardAdding ? "Сохранение..." : "Сохранить карту"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground/40 text-center">
                        Данные карты надёжно зашифрованы и не передаются третьим
                        лицам
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Крипта */}
                <div className="border-t border-border/50 pt-4">
                  <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-2.5">
                    Криптовалюта
                  </p>
                  <button
                    onClick={() => {
                      setPaymentMethod("crypto");
                      setAutoPay(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3.5 transition-all",
                      paymentMethod === "crypto"
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/60 bg-muted/20 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
                      <Bitcoin className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium">Криптовалюта</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Пополнение вручную, автооплата недоступна
                      </p>
                    </div>
                    {paymentMethod === "crypto" && (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                </div>

                {/* Автооплата */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl border p-4 transition-all",
                    paymentMethod === "card" && savedCards.length > 0
                      ? "border-border/60 bg-muted/20"
                      : "border-border/30 bg-muted/10 opacity-50",
                  )}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Автоматическая оплата</p>
                    <p className="text-xs text-muted-foreground/60">
                      {paymentMethod === "crypto"
                        ? "Недоступна для криптовалюты"
                        : savedCards.length === 0
                          ? "Добавьте карту для включения"
                          : "Ежемесячное списание без вашего участия"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (paymentMethod === "card" && savedCards.length > 0) {
                        setAutoPay(!autoPay);
                      }
                    }}
                    disabled={
                      paymentMethod !== "card" || savedCards.length === 0
                    }
                    className={cn(
                      "relative h-7 w-11 rounded-full transition-all shrink-0",
                      autoPay &&
                        paymentMethod === "card" &&
                        savedCards.length > 0
                        ? "bg-primary"
                        : "bg-muted-foreground/20",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-all",
                        autoPay &&
                          paymentMethod === "card" &&
                          savedCards.length > 0
                          ? "left-[18px]"
                          : "left-0.5",
                      )}
                    />
                  </button>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                  className="w-full gap-1.5"
                  variant="default"
                >
                  {settingsSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {settingsSaving
                    ? "Сохранение..."
                    : "Сохранить настройки оплаты"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* ========== ПРАВАЯ КОЛОНКА ========== */}
          <div className="space-y-4">
            {/* Краткая сводка */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Сводка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">
                    Тариф
                  </span>
                  <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                    <Crown
                      className={cn(
                        "h-2.5 w-2.5",
                        tariff === "apex"
                          ? "text-amber-500"
                          : tariff === "pro"
                            ? "text-violet-500"
                            : "text-muted-foreground/60",
                      )}
                    />
                    {tierInfo.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">
                    Оплата
                  </span>
                  <span className="text-xs font-medium">
                    {paymentMethod === "crypto"
                      ? "Крипта"
                      : paymentMethod === "card"
                        ? "Карта"
                        : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">
                    Автооплата
                  </span>
                  <Badge
                    variant={
                      autoPay && paymentMethod === "card"
                        ? "default"
                        : "secondary"
                    }
                    className={cn(
                      "text-[10px] h-5",
                      autoPay &&
                        paymentMethod === "card" &&
                        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {autoPay && paymentMethod === "card" ? "Вкл" : "Выкл"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground/70">Карт</span>
                  <span className="text-xs font-medium">
                    {savedCards.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Навигация по разделам */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">Быстрые ссылки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link
                  href="/tariffs"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                  Управление тарифом
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Связь с разработчиками
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Настройки профиля
                </Link>
              </CardContent>
            </Card>

            {/* Доступно в тарифе */}
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-sm">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Доступно в тарифе
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {tierInfo.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-[11px] text-muted-foreground/70"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/70 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Выйти */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/30 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function detectCardNumber(num: string): string {
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^2/.test(num)) return "mir";
  if (/^3[47]/.test(num)) return "amex";
  if (/^6(?:011|5)/.test(num)) return "maestro";
  return "mastercard";
}
