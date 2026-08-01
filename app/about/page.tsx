"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  ArrowLeft,
  Sun,
  Moon,
  Crown,
  HelpCircle,
  MessageCircle,
  Calendar,
  DollarSign,
  ListChecks,
  StickyNote,
  Dumbbell,
  Cloud,
} from "lucide-react";

const STRONG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const NAV_ITEMS = [
  { href: "/tariffs", label: "Тарифы", icon: Crown, color: "text-amber-600" },
  { href: "/faq", label: "FAQ", icon: HelpCircle, color: "text-purple-600" },
  { href: "/contact", label: "Контакты", icon: MessageCircle, color: "text-rose-600" },
];

const FEATURES = [
  { icon: Calendar, title: "Планнер", desc: "Ставьте задачи по дням, управляйте досками и отслеживайте прогресс." },
  { icon: DollarSign, title: "Финансы", desc: "Учитывайте доходы и расходы, планируйте бюджет." },
  { icon: ListChecks, title: "Привычки", desc: "Формируйте полезные привычки и следите за сериями." },
  { icon: StickyNote, title: "Заметки", desc: "Записывайте мысли, идеи и списки — всё под рукой." },
  { icon: Dumbbell, title: "Спорт и питание", desc: "Ведите тренировки и следите за питанием." },
  { icon: Cloud, title: "Инфо-панель", desc: "Погода, часы с настройкой часового пояса и курсы валют." },
];

export default function AboutPage() {
  const { theme, setTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none z-10"
        style={{ backgroundImage: STRONG_NOISE }}
      />

      {/* Blobs */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl overflow-hidden animate-float-slow">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/20" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: STRONG_NOISE }} />
      </div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl overflow-hidden animate-float-medium" style={{ animationDelay: "-2s" }}>
        <div className="absolute inset-0 bg-gradient-to-tl from-primary/35 to-primary/15" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: STRONG_NOISE }} />
      </div>
      <div className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full blur-3xl overflow-hidden animate-float-fast" style={{ animationDelay: "-4s" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-primary/10" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: STRONG_NOISE }} />
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 25px) scale(1.08); }
          66% { transform: translate(35px, -15px) scale(0.92); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, 15px) scale(0.95); }
          66% { transform: translate(-30px, -25px) scale(1.05); }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-float-medium { animation: float-medium 15s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 12s ease-in-out infinite; }
      `}</style>

      <div className="relative z-20 flex flex-col w-full min-h-screen">
        {/* Header - only for authenticated users */}
        {isAuthenticated && (
          <div className="flex items-center justify-between px-6 py-5">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-11 w-11 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Not authenticated header */}
        {!isAuthenticated && (
          <div className="flex items-center justify-between px-6 py-5">
            <Link
              href="/auth"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="h-11 px-5 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all text-sm font-semibold"
              >
                Вход
              </Link>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-11 w-11 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full">
            {/* Hero */}
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Image src="/logo.png" alt="In Motion" width={56} height={56} className="h-14 w-auto" priority />
                <span className="text-4xl font-bold text-foreground">In Motion</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Приложение для тех, кто хочет жить осознанно, двигаться к целям и держать всё под контролем.
              </p>
            </div>

            {/* Main Card */}
            <div className="backdrop-blur-2xl bg-card/70 border border-border/60 rounded-3xl shadow-2xl p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              <h2 className="text-xl font-bold text-foreground mb-6">О проекте</h2>

              <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">In Motion</strong> — это персональное пространство для управления задачами, финансами, привычками и заметками. Мы создали его для людей, которые ценят порядок и хотят видеть прогресс каждый день.
                </p>

                {/* Features grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FEATURES.map((f) => (
                    <div key={f.title} className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <f.icon className="h-4 w-4 text-primary" />
                        <h3 className="text-foreground font-semibold">{f.title}</h3>
                      </div>
                      <p className="text-xs">{f.desc}</p>
                    </div>
                  ))}
                </div>

                <p>
                  Мы верим, что инструменты должны помогать, а не отвлекать. Поэтому In Motion сделан минималистичным, быстрым и удобным — без лишнего шума.
                </p>

                {/* Navigation links */}
                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground/60 mb-3">Полезные ссылки</p>
                  <div className="grid grid-cols-3 gap-2">
                    {NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border/40 p-3 hover:bg-muted/50 transition-colors group"
                      >
                        <item.icon className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-xs font-medium text-foreground">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <p className="text-xs text-muted-foreground/60">
                    Сделано с заботой о вашем времени и прогрессе.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
