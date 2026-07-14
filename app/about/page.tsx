"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileText,
  Cookie,
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Gift,
  Crown,
  Trash2,
  AlertTriangle,
  Check,
  Bot,
  Target,
  Heart,
  Users,
  BarChart3,
  ListChecks,
  DollarSign,
  Calendar,
  MessageCircle,
  Zap,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PRIVACY_POLICY,
  COOKIE_POLICY,
  CONSENT_REVOKE_INFO,
  CONSENT_INFO,
} from "@/lib/documents";
import AiChat from "@/components/ai-chat";

const FEATURES = [
  {
    icon: BarChart3,
    label: "Финансы",
    desc: "Управляйте счетами, транзакциями, бюджетом, целями и долгами в одном месте. Следите за здоровьем бюджета и стройте прогнозы.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: ListChecks,
    label: "Задачи и проекты",
    desc: "Канбан-доски с drag-and-drop, личные и командные задачи, дедлайны, приоритеты и архив. Для одного или целой команды.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Heart,
    label: "Привычки",
    desc: "Отслеживайте привычки, отмечайте выполнение, следите за сериями и прогрессом. Достижения и награды за регулярность.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Bot,
    label: "AI-помощник",
    desc: "Задавайте вопросы на естественном языке — AI анализирует ваши данные и даёт советы по задачам, финансам и привычкам.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Zap,
    label: "Быстрый старт",
    desc: "Начните работу за минуту: регистрация по коду доступа, интуитивный интерфейс, онбординг для новых пользователей.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Lock,
    label: "Конфиденциальность",
    desc: "Данные принадлежат только вам. Мы не продаём их третьим лицам, не показываем рекламу и не используем тёмные паттерны.",
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
];

const VALUES = [
  {
    icon: Heart,
    label: "Прозрачность",
    desc: "Честно рассказываем, какие данные собираем и зачем. Без тёмных паттернов и запутанных формулировок.",
    color: "text-rose-500",
  },
  {
    icon: ShieldCheck,
    label: "Конфиденциальность",
    desc: "Данные пользователей принадлежат только им. Мы не продаём их третьим лицам и не используем для рекламы.",
    color: "text-green-500",
  },
  {
    icon: Sparkles,
    label: "Минимализм",
    desc: "Каждая функция решает конкретную задачу. Если функцию можно не добавлять — мы её не добавляем.",
    color: "text-emerald-500",
  },
  {
    icon: Users,
    label: "Доступность",
    desc: "У нас есть бесплатный тариф с полноценным функционалом. Хорошие инструменты должны быть доступны каждому.",
    color: "text-blue-500",
  },
];

export default function AboutPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataConsent, setDataConsent] = useState<boolean | null>(null);
  const [updatingConsent, setUpdatingConsent] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeResult, setRevokeResult] = useState<{
    deletionDate: string;
    promoCode: string;
  } | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setUid(user.uid);
      try {
        const res = await fetch(`/api/auth/profile?uid=${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.dataConsent === "boolean") {
            setDataConsent(data.dataConsent);
          }
        }
      } catch {
        // ignore
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGiveConsent = async () => {
    if (!uid) return;
    setUpdatingConsent(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, dataConsent: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка");
        return;
      }
      setDataConsent(true);
      toast.success("Согласие принято");
    } catch {
      toast.error("Ошибка");
    } finally {
      setUpdatingConsent(false);
    }
  };

  const handleRevokeConsent = async () => {
    if (!uid) return;
    setRevoking(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          reason: revokeReason.trim() || "Отзыв согласия на обработку ПД",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка");
        return;
      }
      const data = await res.json();
      setRevokeResult({
        deletionDate: data.deletionDate,
        promoCode: data.promoCode,
      });
      setDataConsent(false);
      toast.success("Запрос на удаление принят");
    } catch {
      toast.error("Ошибка");
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            О проекте In Motion
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            In Motion — это единое пространство для управления задачами,
            финансами, привычками и проектами. Без воды, без рекламы, без
            сложных настроек. Всё необходимое в одном месте.
          </p>
        </div>

        {/* Stats / quick overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Модулей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">4</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Финансы · Задачи · Привычки · AI
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Тарифов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">3</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Базовый · PRO · APEX
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Команда
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">4</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Разработка · Дизайн · QA
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Запущен
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2025</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Постоянное развитие
              </p>
            </CardContent>
          </Card>
        </div>

        {/* О проекте */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">О проекте</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="sm:col-span-2">
              <CardContent className="p-5 text-sm text-muted-foreground leading-relaxed space-y-3">
                <p>
                  In Motion родился из простой идеи: инструменты для управления
                  финансами, задачами и привычками существуют отдельно друг от
                  друга. Мы решили объединить их в одном сервисе, чтобы не
                  прыгать между десятком приложений.
                </p>
                <p>
                  Сегодня In Motion — это трекер, который закрывает ключевые
                  потребности в планировании: от личных задач и командных
                  проектов до финансового учёта и формирования привычек. Всё
                  построено вокруг принципа минимализма — только нужные функции,
                  никакого визуального шума.
                </p>
                <p>
                  Проект развивается силами небольшой команды энтузиастов. Мы не
                  берём кредиты и не продаём данные пользователей — сервис
                  существует за счёт подписок PRO и APEX.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features grid */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Zap className="h-4 w-4 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold">Возможности</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((feature) => (
              <Card key={feature.label}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl ${feature.bg}`}
                    >
                      <feature.icon className={`h-4.5 w-4.5 ${feature.color}`} />
                    </div>
                    <p className="text-sm font-semibold">{feature.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Цели и ценности */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Target className="h-4 w-4 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold">Цели и ценности</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {VALUES.map((value) => (
              <Card key={value.label}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 shrink-0 mt-0.5">
                    <value.icon
                      className={`h-4.5 w-4.5 ${value.color}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{value.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {value.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Документы */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <FileText className="h-4 w-4 text-rose-500" />
            </div>
            <h2 className="text-lg font-semibold">Документы и согласия</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPrivacyOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-left hover:bg-muted/30 transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Политика обработки персональных данных
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Как мы собираем, храним и защищаем ваши данные
                </p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            <button
              onClick={() => setCookieOpen(true)}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-4 text-left hover:bg-muted/30 transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 shrink-0">
                <Cookie className="h-4.5 w-4.5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Политика обработки файлов cookies
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">
                  Какие cookies мы используем и как вы можете ими управлять
                </p>
              </div>
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            {/* Consent */}
            <div className="sm:col-span-2 rounded-xl border border-border/60 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5">
                  {uid === null ? (
                    <ShieldCheck className="h-5 w-5 text-muted-foreground/40" />
                  ) : dataConsent ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Согласие на обработку персональных данных
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                    {CONSENT_INFO.text[0]}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed">
                    {CONSENT_INFO.text[1]}
                  </p>
                  {uid === null ? (
                    <div className="mt-3 flex items-center gap-3">
                      <Link href="/auth">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <ArrowLeft className="h-3 w-3" />
                          Войти в аккаунт
                        </Button>
                      </Link>
                      <span className="text-xs text-muted-foreground/40">
                        чтобы управлять согласием
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {dataConsent ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Согласие дано
                          </span>
                          <button
                            onClick={() => setRevokeOpen(true)}
                            className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors ml-2"
                          >
                            Отозвать
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-muted-foreground/40" />
                          <span className="text-xs text-muted-foreground/60">
                            Согласие не дано
                          </span>
                          <Button
                            onClick={handleGiveConsent}
                            disabled={updatingConsent}
                            size="sm"
                            className="h-7 text-xs gap-1 ml-2"
                          >
                            {updatingConsent ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Дать согласие
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat Block */}
        <div className="mb-10 rounded-2xl border border-border/60 bg-gradient-to-br from-violet-500/5 to-violet-500/[0.02] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shrink-0">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-semibold mb-1">
                Спросите AI о проекте
              </h2>
              <p className="text-sm text-muted-foreground">
                AI-помощник знает всё об In Motion: от возможностей и тарифов до
                настроек и обработки данных. Задайте любой вопрос.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={() => setChatOpen(true)}
                >
                  <Bot className="h-4 w-4" />
                  Открыть чат
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setChatOpen(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Спросить о тарифах
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground/50">
            In Motion — 2026. Сделано с вниманием к деталям.
          </p>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              {PRIVACY_POLICY.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {PRIVACY_POLICY.sections.map((section) => (
              <div key={section.title}>
                <p className="text-sm font-medium mb-1">{section.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cookie Policy Dialog */}
      <Dialog open={cookieOpen} onOpenChange={setCookieOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Cookie className="h-5 w-5 text-orange-500" />
              {COOKIE_POLICY.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            {COOKIE_POLICY.sections.map((section) => (
              <div key={section.title}>
                <p className="text-sm font-medium mb-1">{section.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Consent Dialog */}
      <Dialog
        open={revokeOpen}
        onOpenChange={(open) => {
          if (!revoking) setRevokeOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {revokeResult ? (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col items-center text-center py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-3">
                  <Gift className="h-7 w-7 text-emerald-500" />
                </div>
                <p className="text-base font-semibold">Запрос принят</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Аккаунт будет удалён через 30 дней.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold">Ваш промокод</p>
                </div>
                <div className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2.5 border border-amber-200/40 dark:border-amber-800/30">
                  <code className="text-sm font-mono font-bold tracking-wider text-amber-700 dark:text-amber-400 flex-1 select-all">
                    {revokeResult.promoCode}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(revokeResult.promoCode);
                      toast.success("Промокод скопирован");
                    }}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 shrink-0"
                  >
                    Копировать
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/70">
                  262 ₽ вместо 349 ₽ за первый месяц PRO. Промокод привязан к
                  вашему аккаунту и действует до даты удаления.
                </p>
              </div>

              <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Дата удаления</span>
                  <span className="font-medium">
                    {new Date(revokeResult.deletionDate).toLocaleDateString(
                      "ru-RU",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Промокод активен до
                  </span>
                  <span className="font-medium text-amber-600">
                    {new Date(revokeResult.deletionDate).toLocaleDateString(
                      "ru-RU",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground/50 text-center">
                Если передумаете — просто зайдите в профиль и отмените удаление.
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setRevokeOpen(false);
                  setRevokeResult(null);
                }}
              >
                Понятно
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  {CONSENT_REVOKE_INFO.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {CONSENT_REVOKE_INFO.explanation.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}

                <div className="rounded-xl bg-rose-500/5 border border-rose-200/40 dark:border-rose-900/30 p-3.5 space-y-1.5">
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    Что произойдёт:
                  </p>
                  <ul className="space-y-1">
                    {CONSENT_REVOKE_INFO.consequences.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-muted-foreground/80"
                      >
                        <span className="text-rose-400 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">
                  Расскажите, что пошло не так (необязательно)
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="Например: не хватает оправданий для сбора данных..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  onClick={handleRevokeConsent}
                  disabled={revoking}
                  variant="destructive"
                  className="w-full gap-1.5"
                >
                  {revoking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {revoking
                    ? "Отправляем..."
                    : "Отозвать согласие и удалить аккаунт"}
                </Button>
                <button
                  onClick={() => setRevokeOpen(false)}
                  className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors py-1"
                >
                  Я передумал
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AiChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
