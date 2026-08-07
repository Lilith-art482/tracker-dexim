"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { isWebAuthnSupported, loginWithBiometric } from "@/lib/biometric-client";
import {
  Mail,
  Lock,
  User,
  Loader2,
  Calendar,
  DollarSign,
  ListChecks,
  StickyNote,
  Dumbbell,
  Info,
  Sun,
  Moon,
  Fingerprint,
} from "lucide-react";
import Link from "next/link";

const STRONG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const features = [
  {
    icon: Calendar,
    title: "Планнер",
    desc: "Ставь задачи по дням, управляй досками, отслеживай прогресс — шаг за шагом.",
  },
  {
    icon: DollarSign,
    title: "Финансы",
    desc: "Учитывай доходы и расходы, планируй бюджет, копи на цели.",
  },
  {
    icon: ListChecks,
    title: "Привычки",
    desc: "Формируй полезные привычки, следи за сериями и становись лучше каждый день.",
  },
  {
    icon: StickyNote,
    title: "Заметки",
    desc: "Записывай мысли, идеи и списки — всё под рукой в одном месте.",
  },
  {
    icon: Dumbbell,
    title: "Спорт и питание",
    desc: "Веди тренировки, следи за питанием и достигай физических целей.",
  },
  {
    icon: Info,
    title: "Инфо-панель",
    desc: "Погода в реальном времени, часы с настройкой часового пояса и курсы валют — всё внизу экрана.",
  },
];

export default function AuthPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
  });

  useEffect(() => {
    document.body.classList.add("grain-strong");
    return () => document.body.classList.remove("grain-strong");
  }, []);

  useEffect(() => {
    isWebAuthnSupported()
      .then(setBiometricSupported)
      .catch(() => setBiometricSupported(false));
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
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        toast.success("Вход выполнен!");
        router.push("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );

        await updateProfile(userCredential.user, {
          displayName: formData.nickname,
        });

        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            nickname: formData.nickname,
          }),
        });

        toast.success("Регистрация успешна!");
        router.push("/");
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Auth error:", err);

      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
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

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-10"
        style={{ backgroundImage: STRONG_NOISE }}
      />

      {/* Blobs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl overflow-hidden animate-float-slow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/20" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: STRONG_NOISE }}
        />
      </div>
      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl overflow-hidden animate-float-medium"
        style={{ animationDelay: "-2s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-primary/35 to-primary/15" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: STRONG_NOISE }}
        />
      </div>
      <div
        className="absolute top-1/4 right-0 w-80 h-80 rounded-full blur-3xl overflow-hidden animate-float-fast"
        style={{ animationDelay: "-4s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-primary/30 to-primary/10" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: STRONG_NOISE }}
        />
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25px, 25px) scale(1.08);
          }
          66% {
            transform: translate(35px, -15px) scale(0.92);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40px, 15px) scale(0.95);
          }
          66% {
            transform: translate(-30px, -25px) scale(1.05);
          }
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 15s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 12s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-20 flex flex-col lg:flex-row w-full min-h-screen">
        {/* ═══ MOBILE: Logo + Form + Features ═══ */}
        <div className="lg:hidden flex flex-col w-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="In Motion"
                width={32}
                height={32}
                className="h-7 w-auto"
                priority
              />
              <span className="text-lg font-bold text-foreground">
                In Motion
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/about"
                className="h-11 px-5 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all text-sm font-semibold"
              >
                О нас
              </Link>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-11 w-11 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile form */}
          <div className="flex-1 flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md">
              <div className="backdrop-blur-2xl bg-card/70 border border-border/60 rounded-3xl shadow-2xl p-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex mb-6 p-1 bg-muted/40 rounded-xl border border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Вход
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Регистрация
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <label
                        className="text-sm font-medium text-foreground"
                        htmlFor="m-nickname"
                      >
                        Ваш никнейм или имя
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          id="m-nickname"
                          type="text"
                          value={formData.nickname}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nickname: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                          placeholder="Как вас зовут?"
                          required
                          minLength={2}
                          maxLength={30}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="m-email"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="m-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="m-password"
                    >
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="m-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-3.5 px-4 font-semibold rounded-xl text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(78,110,98,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/60"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3D554A] via-[#4E6E62] to-[#5A7A6D]" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                        }}
                      />
                    </div>
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#3D554A] via-[#4E6E62] to-[#5A7A6D] opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-500 -z-10" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>
                            {isLogin ? "Входим..." : "Регистрация..."}
                          </span>
                        </>
                      ) : isLogin ? (
                        "Войти"
                      ) : (
                        "Зарегистрироваться"
                      )}
                    </span>
                  </button>
                </form>

                {isLogin && biometricSupported && (
                  <>
                    <div className="relative flex items-center gap-3 my-6">
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-xs text-muted-foreground/50 font-medium">
                        или
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      disabled={biometricBusy}
                      className="group relative w-full py-3 px-4 font-semibold rounded-xl border border-border/60 text-foreground bg-background/60 hover:bg-muted/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {biometricBusy ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Fingerprint className="h-5 w-5 text-primary" />
                        )}
                        {biometricBusy ? "Проверяем..." : "Войти по биометрии"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile features below form */}
          <div className="px-4 pb-8 space-y-4">
            <p className="text-center text-sm text-muted-foreground font-medium">
              Возможности
            </p>
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl bg-card/50 border border-border/40 p-3 space-y-2"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ DESKTOP: Left features + Right form ═══ */}
        <div className="hidden lg:flex w-full">
          {/* Left: Features */}
          <div className="w-1/2 flex flex-col justify-center px-12 xl:px-20 py-12">
            <div className="max-w-lg mx-auto w-full">
              <div className="flex items-center gap-3 mb-6">
                <Image
                  src="/logo.png"
                  alt="In Motion"
                  width={40}
                  height={40}
                  className="h-9 w-auto"
                  priority
                />
                <span className="text-2xl xl:text-3xl font-bold text-foreground leading-none">
                  In Motion
                </span>
              </div>
              <p className="text-lg xl:text-xl text-muted-foreground mb-10 leading-relaxed">
                Единое пространство для твоих задач, финансов и привычек — всё,
                чтобы оставаться на пути к целям.
              </p>

              <div className="space-y-5">
                {features.map((f) => (
                  <div key={f.title} className="flex items-start gap-4 group">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="pt-0.5">
                      <h3 className="text-foreground font-semibold mb-1 text-base">
                        {f.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="w-1/2 flex items-center justify-center p-8">
            <div className="relative w-full max-w-md">
              {/* Theme + About buttons */}
              <div className="absolute -top-14 right-0 flex items-center gap-3">
                <Link
                  href="/about"
                  className="h-11 px-5 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/90 transition-all text-sm font-semibold shadow-sm"
                >
                  О нас
                </Link>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-11 w-11 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/90 transition-all shadow-sm"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="backdrop-blur-2xl bg-card/70 border border-border/60 rounded-3xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex mb-8 p-1 bg-muted/40 rounded-xl border border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Вход
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Регистрация
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLogin && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                      <label
                        className="text-sm font-medium text-foreground"
                        htmlFor="d-nickname"
                      >
                        Ваш никнейм или имя
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          id="d-nickname"
                          type="text"
                          value={formData.nickname}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nickname: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                          placeholder="Как вас зовут?"
                          required
                          minLength={2}
                          maxLength={30}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="d-email"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="d-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="d-password"
                    >
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="d-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full py-3.5 px-4 font-semibold rounded-xl text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(78,110,98,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/60"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3D554A] via-[#4E6E62] to-[#5A7A6D]" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div
                        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                        }}
                      />
                    </div>
                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#3D554A] via-[#4E6E62] to-[#5A7A6D] opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-500 -z-10" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>
                            {isLogin ? "Входим..." : "Регистрация..."}
                          </span>
                        </>
                      ) : isLogin ? (
                        "Войти"
                      ) : (
                        "Зарегистрироваться"
                      )}
                    </span>
                  </button>
                </form>

                {isLogin && biometricSupported && (
                  <>
                    <div className="relative flex items-center gap-3 my-6">
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-xs text-muted-foreground/50 font-medium">
                        или
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>
                    <button
                      type="button"
                      onClick={handleBiometricLogin}
                      disabled={biometricBusy}
                      className="group relative w-full py-3 px-4 font-semibold rounded-xl border border-border/60 text-foreground bg-background/60 hover:bg-muted/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {biometricBusy ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Fingerprint className="h-5 w-5 text-primary" />
                        )}
                        {biometricBusy ? "Проверяем..." : "Войти по биометрии"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
