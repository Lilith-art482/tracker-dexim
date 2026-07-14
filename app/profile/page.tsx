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
} from "lucide-react";
import Link from "next/link";
import { TARIFF_FEATURES } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

const TIER_ORDER = ["basic", "pro", "apex"] as const;

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
  const [autoPay, setAutoPay] = useState(false);

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
          if (typeof data.autoPay === "boolean") setAutoPay(data.autoPay);
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
        await updateProfile(auth.currentUser, {
          displayName: nickname.trim(),
        });
      }

      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          nickname: nickname.trim(),
        }),
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
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          paymentMethod:
            autoPay && paymentMethod === "crypto" ? null : paymentMethod,
          autoPay: paymentMethod === "crypto" ? false : autoPay,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка сохранения");
        return;
      }

      const data = await res.json();
      setPaymentMethod(data.paymentMethod);
      setAutoPay(data.autoPay);
      toast.success("Настройки оплаты сохранены");
    } catch {
      toast.error("Ошибка сохранения настроек");
    } finally {
      setSettingsSaving(false);
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

  const handlePaymentMethodChange = (method: "card" | "crypto") => {
    setPaymentMethod(method);
    if (method === "crypto") setAutoPay(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  const tierInfo = TARIFF_FEATURES[tariff] || TARIFF_FEATURES.basic;
  const currentTierIndex = TIER_ORDER.indexOf(
    tariff as (typeof TIER_ORDER)[number],
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>На главную</span>
          </Link>
        </div>

        <div className="space-y-4">
          {/* Шапка профиля */}
          <div className="backdrop-blur-xl bg-card/60 border border-border/60 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shrink-0">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">
                  {nickname || "Пользователь"}
                </h1>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 mt-0.5">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono">
                    {uid?.slice(0, 8)}...{uid?.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Никнейм */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="flex-1 bg-background/50 border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Никнейм"
                maxLength={30}
              />
              <button
                onClick={handleSaveNickname}
                disabled={saving || !nickname.trim()}
                className="h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Сохранить
              </button>
            </div>
          </div>

          {/* Тариф */}
          <div className="backdrop-blur-xl bg-card/60 border border-border/60 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
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
                <span className="text-sm font-semibold">{tierInfo.name}</span>
                <span className="text-[11px] text-muted-foreground/60">
                  {tierInfo.price}
                </span>
              </div>
              <Link
                href="/tariffs"
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Сменить тариф
              </Link>
            </div>

            <div className="grid gap-1.5">
              {tierInfo.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-xs text-muted-foreground/80"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Следующий тариф */}
            {currentTierIndex < TIER_ORDER.length - 1 && (
              <Link
                href="/tariffs"
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-200/40 dark:border-violet-800/40 text-xs font-medium text-violet-700 dark:text-violet-300 hover:from-violet-600/20 hover:to-purple-600/20 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  Перейти на{" "}
                  {TARIFF_FEATURES[TIER_ORDER[currentTierIndex + 1]].name}
                </span>
              </Link>
            )}
          </div>

          {/* Оплата */}
          <div className="backdrop-blur-xl bg-card/60 border border-border/60 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-sm font-semibold mb-4">Способ оплаты</h2>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handlePaymentMethodChange("card")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
                  paymentMethod === "card"
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <CreditCard className="h-4 w-4" />
                Карта
              </button>
              <button
                onClick={() => handlePaymentMethodChange("crypto")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
                  paymentMethod === "crypto"
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Bitcoin className="h-4 w-4" />
                Крипта
              </button>
            </div>

            {/* Автооплата */}
            <div
              className={cn(
                "flex items-center justify-between rounded-xl px-4 py-3 transition-all",
                paymentMethod === "crypto"
                  ? "bg-muted/20 opacity-50"
                  : "bg-muted/30",
              )}
            >
              <div>
                <p className="text-sm font-medium">Автооплата</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                  {paymentMethod === "crypto"
                    ? "Недоступна для крипты — продлевайте вручную"
                    : "Ежемесячное списание без участия"}
                </p>
              </div>
              <button
                onClick={() =>
                  !(paymentMethod === "crypto") && setAutoPay(!autoPay)
                }
                disabled={paymentMethod === "crypto"}
                className={cn(
                  "relative h-6 w-10 rounded-full transition-all",
                  autoPay && paymentMethod !== "crypto"
                    ? "bg-primary"
                    : "bg-muted-foreground/20",
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
                    autoPay && paymentMethod !== "crypto"
                      ? "left-[18px]"
                      : "left-0.5",
                  )}
                />
              </button>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="mt-3 w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {settingsSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Сохранить настройки оплаты
            </button>
          </div>

          {/* Связь с разработчиком */}
          <Link
            href="/contact"
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-4 hover:bg-muted/40 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Связь с разработчиками</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Вопросы, идеи, предложения
              </p>
            </div>
          </Link>

          {/* Выход */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 dark:border-rose-900/30 bg-card/60 backdrop-blur-xl p-4 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  );
}
