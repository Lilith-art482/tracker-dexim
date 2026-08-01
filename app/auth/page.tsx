"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Key,
  Loader2,
  Calendar,
  DollarSign,
  ListChecks,
} from "lucide-react";

const STRONG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    accessCode: "",
  });

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
        if (formData.accessCode !== "demo-tracker-2026") {
          toast.error("Неверный код доступа");
          setLoading(false);
          return;
        }

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
          body: JSON.stringify(formData),
        });

        toast.success("Регистрация успешна!");
        router.push("/about");
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
    <div className="min-h-screen flex relative overflow-hidden bg-background">
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

      <div
        className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl overflow-hidden animate-float-medium"
        style={{ animationDelay: "-6s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-primary/8" />
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

      <div className="relative z-20 flex w-full min-h-screen">
        {/* Left: Features */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-20 py-12">
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

            <div className="space-y-7">
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-foreground font-semibold mb-1 text-base">
                    Планнер
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Ставь задачи, управляй досками, отслеживай прогресс — шаг за
                    шагом.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-foreground font-semibold mb-1 text-base">
                    Финансы
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Учитывай доходы и расходы, планируй бюджет, копи на цели.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <ListChecks className="h-5 w-5 text-primary" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-foreground font-semibold mb-1 text-base">
                    Привычки
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Формируй полезные привычки, следи за сериями и становись
                    лучше каждый день.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="relative w-full max-w-md">
            <div className="backdrop-blur-2xl bg-card/70 border border-border/60 rounded-3xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Tabs */}
              <div className="flex mb-8 p-1 bg-muted/40 rounded-xl border border-border/40">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    isLogin
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                    !isLogin
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Регистрация
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="nickname"
                    >
                      Никнейм
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="nickname"
                        type="text"
                        value={formData.nickname}
                        onChange={(e) =>
                          setFormData({ ...formData, nickname: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="Ваше имя"
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
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="email"
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
                    htmlFor="password"
                  >
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="password"
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

                {!isLogin && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    <label
                      className="text-sm font-medium text-foreground"
                      htmlFor="accessCode"
                    >
                      Код доступа
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="accessCode"
                        type="text"
                        value={formData.accessCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            accessCode: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                        placeholder="demo-tracker-2026"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Wow Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full py-3.5 px-4 font-semibold rounded-xl text-white overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(78,110,98,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3D554A] via-[#4E6E62] to-[#5A7A6D] transition-all duration-500" />

                  {/* Shimmer sweep on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
                      }}
                    />
                  </div>

                  {/* Glow ring */}
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#3D554A] via-[#4E6E62] to-[#5A7A6D] opacity-0 group-hover:opacity-40 blur-lg transition-opacity duration-500 -z-10" />

                  {/* Button content */}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{isLogin ? "Входим..." : "Регистрация..."}</span>
                      </>
                    ) : isLogin ? (
                      "Войти"
                    ) : (
                      "Зарегистрироваться"
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
