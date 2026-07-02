"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Mail, Lock, User, Key, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ThemeToggleInline() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-muted-foreground/60 hover:text-foreground"
      aria-label="Переключить тему"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

const NOISE_SVG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-tl from-primary/8 via-transparent to-primary/3 pointer-events-none" />

      {/* Full-page noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: NOISE_SVG }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--primary) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Floating gradient circles */}
      <div className="animate-float-slow absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full blur-[120px] overflow-hidden opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/15 to-transparent" />
      </div>

      <div
        className="animate-float-medium-slow absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full blur-[100px] overflow-hidden opacity-35"
        style={{ animationDelay: "-3s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-primary/20 via-primary/10 to-transparent" />
      </div>

      <div
        className="animate-float-medium absolute top-[15%] -right-32 w-[400px] h-[400px] rounded-full blur-[90px] overflow-hidden opacity-30"
        style={{ animationDelay: "-6s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-primary/15 via-primary/8 to-transparent" />
      </div>

      <div
        className="animate-float-fast absolute bottom-[20%] -left-32 w-[350px] h-[350px] rounded-full blur-[80px] overflow-hidden opacity-25"
        style={{ animationDelay: "-9s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/12 via-primary/8 to-transparent" />
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(40px, -35px) scale(1.06) rotate(2deg);
          }
          50% {
            transform: translate(-25px, 25px) scale(0.96) rotate(-1deg);
          }
          75% {
            transform: translate(30px, 15px) scale(1.02) rotate(1deg);
          }
        }
        @keyframes float-medium-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          25% {
            transform: translate(-35px, 30px) scale(1.04) rotate(-2deg);
          }
          50% {
            transform: translate(30px, -20px) scale(0.97) rotate(1deg);
          }
          75% {
            transform: translate(-20px, -30px) scale(1.03) rotate(-1deg);
          }
        }
        @keyframes float-medium {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-30px, 35px) scale(1.07) rotate(2deg);
          }
          66% {
            transform: translate(40px, -25px) scale(0.94) rotate(-2deg);
          }
        }
        @keyframes float-fast {
          0%,
          100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(50px, 20px) scale(0.95) rotate(3deg);
          }
          66% {
            transform: translate(-35px, -30px) scale(1.05) rotate(-2deg);
          }
        }
        .animate-float-slow {
          animation: float-slow 28s cubic-bezier(0.45, 0.05, 0.55, 0.95)
            infinite;
        }
        .animate-float-medium-slow {
          animation: float-medium-slow 24s cubic-bezier(0.45, 0.05, 0.55, 0.95)
            infinite;
        }
        .animate-float-medium {
          animation: float-medium 20s cubic-bezier(0.45, 0.05, 0.55, 0.95)
            infinite;
        }
        .animate-float-fast {
          animation: float-fast 16s cubic-bezier(0.45, 0.05, 0.55, 0.95)
            infinite;
        }
      `}</style>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleInline />
      </div>

      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-2xl bg-card/80 border border-border/60 rounded-3xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Создать аккаунт
            </h1>
            <p className="text-muted-foreground/60 text-sm">
              Закрытый доступ • Требуется код
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground/80"
                htmlFor="nickname"
              >
                Никнейм
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <input
                  id="nickname"
                  type="text"
                  value={formData.nickname}
                  onChange={(e) =>
                    setFormData({ ...formData, nickname: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-background/50 border border-input/60 rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  placeholder="Ваше имя"
                  required
                  minLength={2}
                  maxLength={30}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground/80"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-background/50 border border-input/60 rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground/80"
                htmlFor="password"
              >
                Пароль
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-background/50 border border-input/60 rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground/80"
                htmlFor="accessCode"
              >
                Код доступа
              </label>
              <div className="relative group">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <input
                  id="accessCode"
                  type="text"
                  value={formData.accessCode}
                  onChange={(e) =>
                    setFormData({ ...formData, accessCode: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-3 bg-background/50 border border-input/60 rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                  placeholder="demo-tracker-2026"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Продукт в закрытом доступе
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/35"
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
            <p className="text-muted-foreground/60 text-sm">
              Уже есть аккаунт?{" "}
              <Link
                href="/auth"
                className="text-primary font-medium hover:underline"
              >
                Войти
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 text-muted-foreground/40 hover:text-foreground transition-colors text-sm"
            >
              <span className="h-4 w-4">←</span>
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
