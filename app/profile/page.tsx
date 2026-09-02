"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { SecurityCard } from "@/components/profile/security-card";
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
  ShieldCheck,
  AlertTriangle,
  Gift,
  Timer,
  CalendarDays,
  Copy,
  XCircle,
  Camera,
  Check,
  Users,
  Binoculars,
  Award,
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

const REFERRAL_TIERS = [
  {
    name: "Scout",
    desc: "1–4 приглашённых друга",
    icon: <Binoculars className="h-4 w-4" />,
    ready: false,
  },
  {
    name: "Spark",
    desc: "5–14 приглашённых друзей",
    icon: <Sparkles className="h-4 w-4" />,
    ready: false,
  },
  {
    name: "Ambassador",
    desc: "15+ приглашённых друзей",
    icon: <Award className="h-4 w-4" />,
    ready: false,
  },
] as const;
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
  const [avatar, setAvatar] = useState("");
  const [gender, setGender] = useState<string>("");
  const [copiedUid, setCopiedUid] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);
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
          if (data.deleted) {
            toast.error("Ваш аккаунт был удалён");
            await signOut(auth);
            router.push("/auth");
            return;
          }
          if (data.tariff) setTariff(data.tariff);
          if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
          if (data.defaultCardId) setDefaultCardId(data.defaultCardId);
          if (typeof data.autoPay === "boolean") setAutoPay(data.autoPay);
          if (Array.isArray(data.savedCards)) setSavedCards(data.savedCards);
          if (data.avatar) setAvatar(data.avatar);
          if (data.gender) setGender(data.gender);
          if (data.deletionScheduledAt && data.deletionDate) {
            setPendingDeletion({
              deletionDate: data.deletionDate,
              promoCode: data.promoCode?.code || null,
            });
          }
        }
      } catch {
        // use defaults
      }

      try {
        const promoRes = await fetch(
          `/api/auth/promo-codes?uid=${firebaseUser.uid}`,
        );
        if (promoRes.ok) {
          const promoData = await promoRes.json();
          if (Array.isArray(promoData.promoCodes)) {
            setPromoCodes(promoData.promoCodes);
          }
        }
      } catch {
        // ignore
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Файл слишком большой (макс 2MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        const base64 = canvas.toDataURL("image/jpeg", 0.3);
        setAvatar(base64);
        try {
          await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, avatar: base64 }),
          });
          toast.success("Фото обновлено");
        } catch {
          toast.error("Ошибка сохранения фото");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenderChange = async (value: string) => {
    setGender(value);
    if (!uid) return;
    try {
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, gender: value }),
      });
      toast.success("Пол сохранён");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleCopyUid = () => {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    toast.success("ID скопирован");
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleProfileLogout = async () => {
    await signOut(auth);
    router.push("/");
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

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{
    deletionDate: string;
    promoCode: string | null;
  } | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<{
    deletionDate: string;
    promoCode: string | null;
  } | null>(null);
  const [promoCodes, setPromoCodes] = useState<
    Array<{
      code: string;
      discountPercent: number;
      validUntil: string | null;
      used: boolean;
      expired?: boolean;
      description?: string;
      source?: string;
    }>
  >([]);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Выход выполнен");
      router.push("/auth");
    } catch {
      toast.error("Ошибка выхода");
    }
  };

  const handleDeleteAccount = async () => {
    if (!uid) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, reason: deleteReason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка");
        return;
      }
      const data = await res.json();
      setDeleteResult({
        deletionDate: data.deletionDate,
        promoCode: data.promoCode,
      });
      setPendingDeletion({
        deletionDate: data.deletionDate,
        promoCode: data.promoCode,
      });
      toast.success("Запрос на удаление принят");
    } catch {
      toast.error("Ошибка");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!uid) return;
    setCancellingDeletion(true);
    try {
      const res = await fetch("/api/auth/cancel-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка");
        return;
      }
      setPendingDeletion(null);
      setDeleteOpen(false);
      setDeleteResult(null);
      toast.success("Удаление отменено. Промокод сохранён.");
    } catch {
      toast.error("Ошибка");
    } finally {
      setCancellingDeletion(false);
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
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => avatarFileRef.current?.click()}
                    className="relative h-14 w-14 rounded-full flex items-center justify-center cursor-pointer shrink-0 overflow-hidden shadow-md group/avatar"
                    style={{ background: avatar ? "none" : "linear-gradient(135deg, var(--primary), var(--primary) / 0.7)" }}
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-7 w-7 text-primary-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <input ref={avatarFileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold truncate">{nickname || "Без имени"}</p>
                    <p className="text-xs text-muted-foreground truncate">{email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">{uid?.slice(0, 12)}...</span>
                      <button onClick={handleCopyUid} className="flex h-5 w-5 items-center justify-center rounded text-primary hover:bg-primary/10 transition-colors">
                        {copiedUid ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleProfileLogout} className="shrink-0 gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 h-8 text-xs">
                    <LogOut className="h-3.5 w-3.5" /> Выйти
                  </Button>
                </div>
                <div className="border-t border-border/40 mt-4 pt-4">
                  <div className="flex gap-2 mb-2.5">
                    <div className="relative flex-1">
                      <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Ваше имя" maxLength={30} className="pr-12 h-8 text-sm" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/30">{nickname.length}/30</span>
                    </div>
                    <Button onClick={handleSaveNickname} disabled={saving || !nickname.trim()} size="sm" className="h-8 px-3">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleGenderChange("male")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all", gender === "male" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground")}>
                      <User className="h-3 w-3" /> Мужской
                    </button>
                    <button onClick={() => handleGenderChange("female")} className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all", gender === "female" ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground")}>
                      <Users className="h-3 w-3" /> Женский
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Безопасность */}
            {uid && <SecurityCard uid={uid} />}

            {/* Реферальная программа */}
            <Card>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2.5">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Реферальная программа</p>
                    <p className="text-xs text-muted-foreground/70">
                      Приглашайте друзей и открывайте новые уровни
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="border-t pt-4 space-y-2">
                {REFERRAL_TIERS.map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground/60">
                          {t.desc}
                        </p>
                      </div>
                    </div>
                    {t.ready ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 shrink-0"
                      >
                        Доступно
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 shrink-0 text-muted-foreground/60"
                      >
                        В разработке
                      </Badge>
                    )}
                  </div>
                ))}
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
              <CardContent className="space-y-3">
                {tierInfo.features.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 text-[11px] text-muted-foreground/70"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500/70 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}

                <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
                  <Link href="/tariffs">
                    <Button variant="outline" size="sm" className="w-full">
                      Сменить тариф
                    </Button>
                  </Link>
                  {currentTierIndex < TIER_ORDER.length - 1 && (
                    <Link
                      href="/tariffs"
                      className="inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      Перейти на{" "}
                      {
                        TARIFF_FEATURES[TIER_ORDER[currentTierIndex + 1]].name
                      } —{" "}
                      {TARIFF_FEATURES[TIER_ORDER[currentTierIndex + 1]].price}
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Мои промокоды */}
            {promoCodes.filter((pc) => !pc.expired).length > 0 && (
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-amber-500" />
                    Мои промокоды
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {promoCodes
                    .filter((pc) => !pc.expired)
                    .map((pc, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-lg border p-2.5 space-y-1",
                        pc.expired
                          ? "border-border/50 bg-muted/30"
                          : "border-amber-200/40 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <code
                          className={cn(
                            "text-xs font-mono font-bold tracking-wider",
                            pc.expired
                              ? "text-muted-foreground/60"
                              : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          {pc.code}
                        </code>
                        {pc.expired ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 px-1 text-muted-foreground/60"
                          >
                            Истёк
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/50">
                            -{pc.discountPercent}%
                          </span>
                        )}
                      </div>
                      {pc.description && (
                        <p className="text-[10px] text-muted-foreground/60">
                          {pc.description}
                        </p>
                      )}
                      {pc.validUntil && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {pc.expired ? (
                            "срок истёк"
                          ) : (
                            <>
                              до{" "}
                              {new Date(pc.validUntil).toLocaleDateString(
                                "ru-RU",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </>
                          )}
                        </div>
                      )}
                      {pc.used && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] h-4 px-1"
                        >
                          Использован
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Выйти */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/30 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Выйти из аккаунта
            </button>

            {/* Удалить аккаунт */}
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/30 py-2.5 text-xs font-medium text-muted-foreground/50 hover:text-rose-500/70 hover:border-rose-200/40 dark:hover:border-rose-900/30 dark:hover:bg-rose-950/10 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {pendingDeletion ? "Отменить удаление" : "Удалить аккаунт"}
            </button>
          </div>
        </div>
      </div>

      {/* Delete account modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              {pendingDeletion ? "Удаление запланировано" : "Удаление аккаунта"}
            </DialogTitle>
          </DialogHeader>

          {/* State: just submitted — show result first */}
          {deleteResult ? (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center text-center py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-3">
                  <Gift className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="text-base font-semibold">Запрос принят</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Аккаунт будет удалён через 30 дней.
                </p>
              </div>

              {deleteResult.promoCode && (
                <div className="rounded-xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold">Ваш промокод</p>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2.5 border border-amber-200/40 dark:border-amber-800/30">
                    <code className="text-sm font-mono font-bold tracking-wider text-amber-700 dark:text-amber-400 flex-1 select-all">
                      {deleteResult.promoCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(deleteResult.promoCode!);
                        toast.success("Промокод скопирован");
                      }}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 shrink-0"
                    >
                      Копировать
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    262 ₽ вместо 349 ₽ за первый месяц PRO. Промокод привязан к
                    вашему аккаунту и действует до даты удаления.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Дата удаления</span>
                  <span className="font-medium">
                    {new Date(deleteResult.deletionDate).toLocaleDateString(
                      "ru-RU",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteResult(null);
                }}
              >
                Понятно
              </Button>
            </div>
          ) : pendingDeletion ? (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center text-center py-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 mb-3">
                  <Timer className="h-7 w-7 text-amber-500" />
                </div>
                <p className="text-base font-semibold">
                  Запрос на удаление активен
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ваш аккаунт будет удалён через{" "}
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(pendingDeletion.deletionDate).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24),
                    ),
                  )}{" "}
                  дн.
                </p>
              </div>

              {pendingDeletion.promoCode && (
                <div className="rounded-xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold">Ваш промокод</p>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2.5 border border-amber-200/40 dark:border-amber-800/30">
                    <code className="text-sm font-mono font-bold tracking-wider text-amber-700 dark:text-amber-400 flex-1 select-all">
                      {pendingDeletion.promoCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          pendingDeletion.promoCode!,
                        );
                        toast.success("Промокод скопирован");
                      }}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 shrink-0"
                    >
                      Копировать
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    262 ₽ вместо 349 ₽ за первый месяц PRO. Промокод сохранится
                    даже после отмены удаления.
                  </p>
                </div>
              )}

              <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Дата удаления</span>
                  <span className="font-medium">
                    {new Date(pendingDeletion.deletionDate).toLocaleDateString(
                      "ru-RU",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                {pendingDeletion.promoCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Промокод активен до
                    </span>
                    <span className="font-medium text-amber-600">
                      {new Date(
                        pendingDeletion.deletionDate,
                      ).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Осталось</span>
                  <span className="font-medium text-rose-500">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(pendingDeletion.deletionDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )}{" "}
                    дн.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Link href="/tariffs">
                  <Button variant="default" className="w-full gap-1.5">
                    <Crown className="h-4 w-4" />
                    Перейти к тарифам
                  </Button>
                </Link>
                <Button
                  onClick={handleCancelDeletion}
                  disabled={cancellingDeletion}
                  variant="outline"
                  className="w-full gap-1.5"
                >
                  {cancellingDeletion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {cancellingDeletion ? "Отменяем..." : "Отменить удаление"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/50 text-center">
                Промокод останется активным до указанной даты, даже если вы
                отмените удаление.
              </p>
            </div>
          ) : (
            /* State 2 or 3: first-time vs repeat delete */
            <div className="space-y-4 pt-1">
              {promoCodes.length === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Нам правда важно понять, почему вы уходите — чтобы мы могли
                    исправиться и сделать приложение удобнее.
                  </p>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Расскажите, что пошло не так (или чего не хватило), и в
                    благодарность мы отправим вам:
                  </p>

                  <div className="space-y-2.5 rounded-xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/[0.02] border border-emerald-200/40 dark:border-emerald-800/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0 mt-0.5">
                        <Gift className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Гайд «Как навести порядок в финансах за 7 дней»
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          С чёткими шагами, чек-листами и таблицами для
                          планирования
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
                        <Crown className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Промокод на 25% скидки на первый месяц PRO
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          262 ₽ вместо 349 ₽ — промокод привяжется к вашему
                          аккаунту
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground/60">
                    Без спама. Просто спасибо за честность.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground/80">
                      Что вас не устроило? (пара слов — уже помощь)
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Например: не хватило интеграций или запутался в интерфейсе..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="w-full gap-1.5"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                      {deleting
                        ? "Отправляем..."
                        : "Отправить и получить подарки"}
                    </Button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="text-xs text-muted-foreground/40 hover:text-rose-500/70 transition-colors py-1"
                    >
                      Не хочу подарки, просто удалить аккаунт
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center py-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 mb-3">
                      <AlertTriangle className="h-7 w-7 text-rose-500" />
                    </div>
                    <p className="text-base font-semibold">Уверены?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Вы уже получали промокод при предыдущем запросе. При
                      повторном удалении подарки не положены.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground/80">
                      Расскажите, что не устроило
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Например: не хватило функций или нашёл альтернативу..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    variant="destructive"
                    className="w-full gap-1.5"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    {deleting ? "Отправляем..." : "Удалить аккаунт"}
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
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
