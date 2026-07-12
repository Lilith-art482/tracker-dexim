"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Key,
  Loader2,
  CheckCircle,
  Calendar,
  DollarSign,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

const STRONG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function RegisterPage() {
  const router = useRouter();
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
      router.push("/");
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Register error:", err);

      if (err.code === "auth/email-already-in-use") {
        toast.error("Этот email уже зарегистрирован");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Некорректный email");
      } else if (err.code === "auth/weak-password") {
        toast.error("Пароль должен быть не менее 6 символов");
      } else {
        toast.error(err.message || "Ошибка регистрации. Попробуйте ещё раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0a0f0d]">
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-10"
        style={{ backgroundImage: STRONG_NOISE }}
      />

      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl overflow-hidden animate-float-slow">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4E6E62]/40 to-[#4E6E62]/20" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: STRONG_NOISE }}
        />
      </div>

      <div
        className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl overflow-hidden animate-float-medium"
        style={{ animationDelay: "-2s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-[#4E6E62]/35 to-[#4E6E62]/15" />
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
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 15s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-20 flex w-full min-h-screen">
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 xl:px-20 py-12">
          <div className="max-w-lg mx-auto w-full">
            <h1 className="text-4xl xl:text-5xl font-bold text-[#e8eeeb] mb-6 tracking-tight">
              In Motion
            </h1>
            <p className="text-lg xl:text-xl text-[#c8d5ce] mb-10 leading-relaxed">
              Единое пространство для твоих задач, финансов и привычек — всё,
              чтобы оставаться на пути к целям.
            </p>

            <div className="space-y-7">
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-[#4E6E62]/20 flex items-center justify-center shrink-0 group-hover:bg-[#4E6E62]/30 transition-colors">
                  <Calendar className="h-5 w-5 text-[#4E6E62]" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[#e8eeeb] font-semibold mb-1 text-base">
                    Планнер
                  </h3>
                  <p className="text-[#8fa89b] text-sm leading-relaxed">
                    Ставь задачи, управляй досками, отслеживай прогресс — шаг за
                    шагом.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-[#4E6E62]/20 flex items-center justify-center shrink-0 group-hover:bg-[#4E6E62]/30 transition-colors">
                  <DollarSign className="h-5 w-5 text-[#4E6E62]" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[#e8eeeb] font-semibold mb-1 text-base">
                    Финансы
                  </h3>
                  <p className="text-[#8fa89b] text-sm leading-relaxed">
                    Учитывай доходы и расходы, планируй бюджет, копи на цели.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-[#4E6E62]/20 flex items-center justify-center shrink-0 group-hover:bg-[#4E6E62]/30 transition-colors">
                  <ListChecks className="h-5 w-5 text-[#4E6E62]" />
                </div>
                <div className="pt-0.5">
                  <h3 className="text-[#e8eeeb] font-semibold mb-1 text-base">
                    Привычки
                  </h3>
                  <p className="text-[#8fa89b] text-sm leading-relaxed">
                    Формируй полезные привычки, следи за сериями и становись
                    лучше каждый день.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
          <div className="relative w-full max-w-md">
            <div className="backdrop-blur-2xl bg-[#121814]/70 border border-[#4E6E62]/30 rounded-3xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#e8eeeb] mb-2">
                  Создать аккаунт
                </h1>
                <p className="text-[#4E6E62]/70 text-sm">
                  Закрытый доступ • Требуется код
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-[#c8d5ce]"
                    htmlFor="nickname"
                  >
                    Никнейм
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                    <input
                      id="nickname"
                      type="text"
                      value={formData.nickname}
                      onChange={(e) =>
                        setFormData({ ...formData, nickname: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                      placeholder="Ваше имя"
                      required
                      minLength={2}
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-[#c8d5ce]"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-[#c8d5ce]"
                    htmlFor="password"
                  >
                    Пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium text-[#c8d5ce]"
                    htmlFor="accessCode"
                  >
                    Код доступа
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                    <input
                      id="accessCode"
                      type="text"
                      value={formData.accessCode}
                      onChange={(e) =>
                        setFormData({ ...formData, accessCode: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                      placeholder="demo-tracker-2026"
                      required
                    />
                  </div>
                  <p className="text-xs text-[#4E6E62]/70 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Продукт в закрытом доступе
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#4E6E62] to-[#3D554A] text-white font-semibold rounded-xl hover:from-[#5A7A6D] hover:to-[#4E6E62] focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4E6E62]/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Регистрация...</span>
                    </>
                  ) : (
                    "Зарегистрироваться"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[#4E6E62]/70 text-sm">
                  Уже есть аккаунт?{" "}
                  <Link
                    href="/auth"
                    className="text-[#4E6E62] font-medium hover:underline"
                  >
                    Войти
                  </Link>
                </p>
              </div>

              <div className="mt-6">
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 text-[#4E6E62]/50 hover:text-[#4E6E62] transition-colors text-sm"
                >
                  <span className="h-4 w-4">←</span>
                  На главную
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
