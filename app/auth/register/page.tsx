"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Mail, Lock, User, Key, Loader2, CheckCircle, Sun, Moon, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", nickname: "", accessCode: "" });

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.accessCode !== "demo-tracker-2026") {
        toast.error("Неверный код доступа");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.nickname });
      await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      toast.success("Регистрация успешна!");
      router.push("/");
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === "auth/email-already-in-use") toast.error("Этот email уже зарегистрирован");
      else if (err.code === "auth/invalid-email") toast.error("Некорректный email");
      else if (err.code === "auth/weak-password") toast.error("Пароль должен быть не менее 6 символов");
      else toast.error(err.message || "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: NOISE }} />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-30">
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-10 w-10 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
          {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Back */}
      <div className="absolute top-4 left-4 z-30">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> На главную
        </Link>
      </div>

      <div className="relative z-20 w-full max-w-md mx-4">
        <div className="backdrop-blur-2xl bg-card/80 border border-border/50 rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Image src="/logo.png" alt="In Motion" width={28} height={28} className="h-7 w-auto" priority />
            </div>
            <span className="text-xl font-bold">In Motion</span>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold mb-1">Создать аккаунт</h1>
            <p className="text-xs text-muted-foreground">Закрытый доступ · Требуется код</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Никнейм</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="Ваше имя" required minLength={2} maxLength={30} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="your@email.com" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="••••••••" required minLength={6} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Код доступа</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="text" value={formData.accessCode}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border/50 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="demo-tracker-2026" required />
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Продукт в закрытом доступе
              </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Регистрация...</> : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/auth" className="text-primary font-medium hover:underline">Войти</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
          Нажимая «Зарегистрироваться», вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}
