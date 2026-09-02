"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  isWebAuthnSupported,
  loginWithBiometric,
} from "@/lib/biometric-client";
import {
  Mail,
  Lock,
  User,
  Loader2,
  Fingerprint,
  Shield,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const NeonFlow = dynamic(() => import("@/components/ui/neon-flow").then(m => ({ default: m.NeonFlow })), { ssr: false });

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AuthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", nickname: "" });

  const [gaStep, setGaStep] = useState(false);
  const [gaCode, setGaCode] = useState("");
  const [gaLoading, setGaLoading] = useState(false);
  const [gaError, setGaError] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    isWebAuthnSupported().then(setBiometricSupported).catch(() => setBiometricSupported(false));
  }, []);

  const handleBiometricLogin = async () => {
    setBiometricBusy(true);
    try {
      const result = await loginWithBiometric();
      if (!result.success) {
        toast.error(result.error || "Не удалось войти по биометрии");
        return;
      }
      toast.success("Вход выполнен!");
      router.push("/");
    } catch {
      toast.error("Ошибка входа по биометрии");
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth, formData.email, formData.password,
        );

        try {
          const idToken = await userCredential.user.getIdToken();
          const res = await fetch(`/api/auth/totp?uid=${encodeURIComponent(userCredential.user.uid)}`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          const data = await res.json();

          if (data.enabled) {
            setPendingCredentials({ email: formData.email, password: formData.password });
            setGaStep(true);
            setLoading(false);
            return;
          }
        } catch {}

        toast.success("Вход выполнен!");
        router.push("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth, formData.email, formData.password,
        );
        await updateProfile(userCredential.user, { displayName: formData.nickname });
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, nickname: formData.nickname }),
        });
        toast.success("Регистрация успешна!");
        router.push("/");
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        toast.error("Неверный email или пароль");
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("Этот email уже зарегистрирован");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Некорректный email");
      } else if (err.code === "auth/weak-password") {
        toast.error("Пароль должен быть не менее 6 символов");
      } else {
        toast.error(err.message || "Ошибка. Попробуйте ещё раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCredentials || !auth.currentUser?.uid) return;
    setGaLoading(true);
    setGaError("");

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/auth/totp/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: auth.currentUser.uid,
          token: gaCode,
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Вход выполнен!");
        router.push("/");
      } else {
        setGaError("Неверный код. Попробуйте ещё раз.");
      }
    } catch {
      setGaError("Ошибка проверки. Проверьте соединение.");
    } finally {
      setGaLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden dark">
      {/* NeonFlow — always dark */}
      <div className="absolute inset-0 z-0">
        <NeonFlow />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>На главную</span>
        </Link>
      </div>

      {/* Auth Card */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="w-full max-w-[400px] mx-4 backdrop-blur-2xl bg-white/70 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl p-6">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center">
              <span className="text-sm font-bold text-black dark:text-white">IM</span>
            </div>
            <span className="text-sm font-semibold text-black dark:text-white tracking-wide">In Motion</span>
          </div>

          {!gaStep ? (
            <>
              {/* Tabs */}
              <div className="flex mb-5 p-0.5 bg-black/10 dark:bg-white/10 rounded-lg border border-black/10 dark:border-white/10">
                <button onClick={() => setIsLogin(true)}
                  className={cn(
                    "flex-1 py-2 rounded-md text-xs font-medium transition-all",
                    isLogin ? "bg-white dark:bg-white/15 text-black dark:text-white shadow-sm" : "text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80",
                  )}>
                  Вход
                </button>
                <button onClick={() => setIsLogin(false)}
                  className={cn(
                    "flex-1 py-2 rounded-md text-xs font-medium transition-all",
                    !isLogin ? "bg-white dark:bg-white/15 text-black dark:text-white shadow-sm" : "text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80",
                  )}>
                  Регистрация
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {!isLogin && (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-[11px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">Имя</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/30 dark:text-white/30" />
                      <input type="text" value={formData.nickname}
                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        className="w-full pl-9 pr-4 py-2.5 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/30 transition-all"
                        placeholder="Как вас зовут?" required minLength={2} maxLength={30} />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/30 dark:text-white/30" />
                    <input type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/30 transition-all"
                      placeholder="your@email.com" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">Пароль</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-black/30 dark:text-white/30" />
                    <input type="password" value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-xl text-sm text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/30 transition-all"
                      placeholder="••••••••" required minLength={6} />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4">
                  {loading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {isLogin ? "Входим..." : "Регистрация..."}</>
                  ) : isLogin ? "Войти" : "Зарегистрироваться"}
                </button>
              </form>

              {isLogin && biometricSupported && (
                <>
                  <div className="relative flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                    <span className="text-[10px] text-black/30 dark:text-white/30 uppercase tracking-wider">или</span>
                    <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
                  </div>
                  <button onClick={handleBiometricLogin} disabled={biometricBusy}
                    className="w-full py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-medium text-black/60 dark:text-white/60 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {biometricBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Fingerprint className="h-3.5 w-3.5 text-primary" />}
                    {biometricBusy ? "Проверяем..." : "Войти по биометрии"}
                  </button>
                </>
              )}
            </>
          ) : (
            /* GA Verification */
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-black dark:text-white" />
                </div>
                <h2 className="text-sm font-bold text-black dark:text-white mb-1">Двухфакторная аутентификация</h2>
                <p className="text-[11px] text-black/50 dark:text-white/50">
                  Введите код из приложения Google Authenticator
                </p>
              </div>

              <form onSubmit={handleGaVerify} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-black/50 dark:text-white/50 uppercase tracking-wider">Код</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    value={gaCode} onChange={(e) => { setGaCode(e.target.value.replace(/\D/g, "")); setGaError(""); }}
                    className={cn(
                      "w-full px-4 py-3 bg-black/10 dark:bg-white/10 border rounded-xl text-center text-xl font-mono font-bold tracking-[0.4em] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 transition-all",
                      gaError
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : "border-black/10 dark:border-white/10 focus:ring-black/20 dark:focus:ring-white/30",
                    )}
                    placeholder="000000" required autoFocus />
                  {gaError && (
                    <p className="text-[11px] text-red-400 text-center mt-1">{gaError}</p>
                  )}
                </div>

                <button type="submit" disabled={gaLoading || gaCode.length !== 6}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {gaLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Проверяем...</> : "Подтвердить"}
                </button>

                <button type="button" onClick={() => { setGaStep(false); setGaCode(""); setPendingCredentials(null); }}
                  className="w-full py-2 rounded-xl text-xs font-medium text-black/50 dark:text-white/50 hover:text-black/80 dark:hover:text-white/80 hover:bg-black/10 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft className="h-3 w-3" /> Назад к входу
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
