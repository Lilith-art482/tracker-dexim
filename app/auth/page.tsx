"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Mail, Lock, User, Key, Loader2, Sparkles } from "lucide-react";

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
        // Вход
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Вход выполнен!");
        router.push("/");
      } else {
        // Регистрация
        if (formData.accessCode !== "demo-tracker-2026") {
          toast.error("Неверный код доступа");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await updateProfile(userCredential.user, {
          displayName: formData.nickname,
        });

        // Сохранение в Firestore
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        toast.success("Регистрация успешна!");
        router.push("/");
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Auth error:", err);
      
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0a0f0d]">
      {/* Сетка на фоне */}
      <div 
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #4E6E62 1px, transparent 1px),
            linear-gradient(to bottom, #4E6E62 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      
      {/* Анимированные круги с зернистостью */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl overflow-hidden animate-float-slow">
        <div className="absolute inset-0 bg-gradient-to-br from-[#4E6E62]/40 to-[#4E6E62]/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl overflow-hidden animate-float-medium" style={{ animationDelay: '-2s' }}>
        <div className="absolute inset-0 bg-gradient-to-tl from-[#4E6E62]/35 to-[#4E6E62]/15" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full blur-3xl overflow-hidden animate-float-fast" style={{ animationDelay: '-4s' }}>
        <div className="absolute inset-0 bg-gradient-to-l from-[#4E6E62]/30 to-[#4E6E62]/10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="absolute bottom-1/3 left-0 w-64 h-64 rounded-full blur-3xl overflow-hidden animate-float-medium" style={{ animationDelay: '-6s' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#4E6E62]/25 to-[#4E6E62]/8" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* CSS анимации для кругов */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% {
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
          0%, 100% {
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
          0%, 100% {
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

      {/* Форма */}
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-2xl bg-[#121814]/70 border border-[#4E6E62]/30 rounded-3xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Логотип */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#4E6E62] to-[#3D554A] text-white shadow-lg">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>

          {/* Переключатель */}
          <div className="flex mb-8 p-1 bg-[#1a2320]/60 rounded-xl border border-[#4E6E62]/20">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-[#4E6E62] text-white shadow-sm'
                  : 'text-[#4E6E62]/70 hover:text-[#4E6E62]'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-[#4E6E62] text-white shadow-sm'
                  : 'text-[#4E6E62]/70 hover:text-[#4E6E62]'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-sm font-medium text-[#c8d5ce]" htmlFor="nickname">
                  Никнейм
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                  <input
                    id="nickname"
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                    placeholder="Ваше имя"
                    required
                    minLength={2}
                    maxLength={30}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#c8d5ce]" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#c8d5ce]" htmlFor="password">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-sm font-medium text-[#c8d5ce]" htmlFor="accessCode">
                  Код доступа
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#4E6E62]" />
                  <input
                    id="accessCode"
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#0f1411]/60 border border-[#4E6E62]/30 rounded-xl text-[#e8eeeb] placeholder:text-[#4E6E62]/50 focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 focus:border-transparent transition-all"
                    placeholder="demo-tracker-2026"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#4E6E62] to-[#3D554A] text-white font-semibold rounded-xl hover:from-[#5A7A6D] hover:to-[#4E6E62] focus:outline-none focus:ring-2 focus:ring-[#4E6E62]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4E6E62]/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isLogin ? 'Входим...' : 'Регистрация...'}</span>
                </>
              ) : (
                isLogin ? 'Войти' : 'Зарегистрироваться'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
