"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Mail, Lock, User, Key, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

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
      // Проверка кода доступа
      if (formData.accessCode !== "demo-tracker-2026") {
        toast.error("Неверный код доступа");
        setLoading(false);
        return;
      }

      // Создание пользователя в Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Обновление displayName
      await updateProfile(userCredential.user, {
        displayName: formData.nickname,
      });

      // Сохранение профиля в Firestore через API
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      toast.success("Регистрация успешна!");
      router.push("/profile");
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Градиентный фон с зернистостью */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />
      
      {/* Плавающие круги */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Форма */}
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Создать аккаунт</h1>
            <p className="text-white/70">Закрытый доступ • Требуется код</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90" htmlFor="nickname">
                Никнейм
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="Ваше имя"
                  required
                  minLength={2}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90" htmlFor="password">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/90" htmlFor="accessCode">
                Код доступа
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
                <input
                  id="accessCode"
                  type="text"
                  value={formData.accessCode}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  placeholder="demo-tracker-2026"
                  required
                />
              </div>
              <p className="text-xs text-white/50 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Продукт в закрытом доступе
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
            <p className="text-white/70 text-sm">
              Уже есть аккаунт?{" "}
              <Link href="/auth/login" className="text-white font-medium hover:underline">
                Войти
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
