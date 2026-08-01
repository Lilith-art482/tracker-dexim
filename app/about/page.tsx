"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon } from "lucide-react";

const STRONG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function AboutPage() {
  const { theme, setTheme } = useTheme();

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
        className="absolute top-1/3 left-1/2 w-72 h-72 rounded-full blur-3xl overflow-hidden animate-float-fast"
        style={{ animationDelay: "-4s" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-primary/10" />
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

      <div className="relative z-20 flex flex-col w-full min-h-screen">
        {/* Header */}
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
              className="h-9 px-3 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors text-xs font-medium"
            >
              Вход
            </Link>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full">
            {/* Hero */}
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Image
                  src="/logo.png"
                  alt="In Motion"
                  width={56}
                  height={56}
                  className="h-14 w-auto"
                  priority
                />
                <span className="text-4xl font-bold text-foreground">
                  In Motion
                </span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Приложение для тех, кто хочет жить осознанно, двигаться к целям
                и держать всё под контролем.
              </p>
            </div>

            {/* Card */}
            <div className="backdrop-blur-2xl bg-card/70 border border-border/60 rounded-3xl shadow-2xl p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
              <h2 className="text-xl font-bold text-foreground mb-6">
                О проекте
              </h2>

              <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">In Motion</strong> — это
                  персональное пространство для управления задачами, финансами,
                  привычками и заметками. Мы создали его для людей, которые
                  ценят порядок и хотят видеть прогресс каждый день.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <h3 className="text-foreground font-semibold">Планнер</h3>
                    <p className="text-xs">
                      Ставьте задачи по дням, управляйте досками и отслеживайте
                      прогресс.
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <h3 className="text-foreground font-semibold">Финансы</h3>
                    <p className="text-xs">
                      Учитывайте доходы и расходы, планируйте бюджет.
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <h3 className="text-foreground font-semibold">Привычки</h3>
                    <p className="text-xs">
                      Формируйте полезные привычки и следите за сериями.
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <h3 className="text-foreground font-semibold">Заметки</h3>
                    <p className="text-xs">
                      Записывайте мысли, идеи и списки — всё под рукой.
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <h3 className="text-foreground font-semibold">
                      Спорт и питание
                    </h3>
                    <p className="text-xs">
                      Ведите тренировки и следите за питанием.
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border/40 p-4 space-y-2">
                    <h3 className="text-foreground font-semibold">
                      Инфо-панель
                    </h3>
                    <p className="text-xs">
                      Погода, часы с настройкой часового пояса и курсы валют.
                    </p>
                  </div>
                </div>

                <p>
                  Мы верим, что инструменты должны помогать, а не отвлекать.
                  Поэтому In Motion сделан минималистичным, быстрым и удобным —
                  без лишнего шума.
                </p>

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
