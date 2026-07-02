"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  Key,
  Loader2,
  CalendarCheck,
  Wallet,
  Target,
  Users,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function ThemeToggleInline() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-foreground/40 hover:text-foreground"
      aria-label="Переключить тему"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

const features = [
  { icon: CalendarCheck, label: "Планнер" },
  { icon: Wallet, label: "Финансовый трекер" },
  { icon: Target, label: "Челленджи" },
  { icon: Users, label: "Командная работа" },
];

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
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Glow from top-left */}
      <div
        className="absolute -top-64 -left-64 w-[900px] h-[900px] rounded-full blur-[150px] pointer-events-none opacity-25 dark:opacity-30"
        style={{
          background:
            "radial-gradient(circle, #4E6E62 0%, #4E6E62 30%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[40%] -left-32 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-15 dark:opacity-20"
        style={{
          background: "radial-gradient(circle, #4E6E62 0%, transparent 60%)",
        }}
      />

      {/* Noise overlay - dark only */}
      <div
        className="hidden dark:block absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleInline />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="flex w-full max-w-5xl flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: info block */}
          <div className="flex-1 max-w-lg space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Продуктивность нового уровня
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
                Отслеживайте,
                <br />
                планируйте,
                <br />
                <span className="text-primary">достигайте</span>
              </h1>
              <p className="text-lg text-muted-foreground/80 leading-relaxed">
                Умный трекер привычек и задач. Всё в одном месте — личные цели,
                финансы, челленджи и командные проекты.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {features.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-4 py-3.5 transition-colors hover:bg-card/70"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <Link
                href="/auth"
                className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                ← Уже есть аккаунт? Войти
              </Link>
            </div>
          </div>

          {/* Right: form */}
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl p-8 shadow-xl">
              <div className="text-center mb-7">
                <h1 className="text-2xl font-bold text-foreground">
                  Создать аккаунт
                </h1>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Закрытый доступ • Требуется код
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                        setFormData({
                          ...formData,
                          nickname: e.target.value,
                        })
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
                        setFormData({
                          ...formData,
                          accessCode: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-background/50 border border-input/60 rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                      placeholder="Код доступа"
                    />
                  </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
