"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  MessageCircle,
  Mail,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Flag,
  Paperclip,
  X,
  Clock,
  Upload,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FeedbackType = "idea" | "suggestion" | "complaint" | "question";

interface CategoryConfig {
  value: FeedbackType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  bgColor: string;
  gradient: string;
  placeholder: string;
  responseTime: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    value: "idea",
    label: "Идея",
    icon: Lightbulb,
    description: "Новая функция или улучшение",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    placeholder: "Расскажите, что можно улучшить...",
    responseTime: "до 14 дней",
  },
  {
    value: "suggestion",
    label: "Предложение",
    icon: Sparkles,
    description: "Конкретное предложение по продукту",
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-500/10",
    gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    placeholder: "Опишите ваше предложение...",
    responseTime: "до 14 дней",
  },
  {
    value: "complaint",
    label: "Жалоба",
    icon: AlertTriangle,
    description: "Проблема или ошибка в работе",
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
    gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    placeholder: "Опишите проблему: что произошло, когда, как воспроизвести...",
    responseTime: "до 14 дней",
  },
  {
    value: "question",
    label: "Вопрос",
    icon: HelpCircle,
    description: "Общий вопрос о сервисе",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-500/10",
    gradient: "from-sky-500/10 via-sky-500/5 to-transparent",
    placeholder: "Задайте ваш вопрос...",
    responseTime: "до 14 дней",
  },
];

const PRIORITIES = [
  {
    value: "low",
    label: "Низкий",
    icon: Flag,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    value: "medium",
    label: "Средний",
    icon: Flag,
    color:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    value: "high",
    label: "Высокий",
    icon: Flag,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
] as const;

function generateTicketId() {
  return "TKT-" + crypto.randomUUID().slice(0, 8).toUpperCase();
}

export default function ContactPage() {
  const router = useRouter();
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [needReply, setNeedReply] = useState(false);
  const [email, setEmail] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cat: CategoryConfig | undefined = type
    ? CATEGORIES.find((c) => c.value === type)
    : undefined;

  const charLimit = 3000;
  const charProgress = message.length / charLimit;

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped].slice(0, 5));
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      setFiles((prev) => [...prev, ...selected].slice(0, 5));
    },
    [],
  );

  const removeFile = useCallback((i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleSubmit = async () => {
    if (!type || !message.trim() || message.trim().length < 20) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setTicketId(generateTicketId());
    setSubmitted(true);
    setSending(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("ID скопирован");
  };

  const particles = Array.from({ length: 20 }, (_, i) => ({
    key: i,
    left: (i * 137.5 + 50) % 100,
    top: 60 + ((i * 73.3 + 20) % 40),
    delay: (i * 0.17) % 3,
    duration: 2 + (i % 3),
    opacity: 0.3 + (i % 5) * 0.1,
  }));

  if (submitted) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
          {particles.map((p) => (
            <div
              key={p.key}
              className="absolute h-1 w-1 rounded-full bg-emerald-500/40 animate-[float-up_3s_ease-out_infinite]"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                opacity: p.opacity,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes float-up {
            0% { transform: translateY(0) scale(0); opacity: 0; }
            20% { opacity: 1; }
            100% { transform: translateY(-400px) scale(1); opacity: 0; }
          }
          @keyframes confetti-pop {
            0% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
            100% { transform: scale(1) rotate(360deg); opacity: 0; }
          }
          @keyframes success-icon {
            0% { transform: scale(0) rotate(-30deg); opacity: 0; }
            60% { transform: scale(1.1) rotate(5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
        `}</style>

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-lg">
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="backdrop-blur-xl bg-card/70 border border-border/60 rounded-3xl p-8 sm:p-10 shadow-2xl text-center">
              <div className="flex justify-center mb-6">
                <div
                  className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center"
                  style={{ animation: "success-icon 0.6s ease-out" }}
                >
                  <div className="h-14 w-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2 tracking-tight">
                Сообщение отправлено
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
                Спасибо! Мы рассмотрим ваше обращение в ближайшее время.
              </p>

              <div className="rounded-2xl bg-muted/40 border border-border/40 p-5 mb-6 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-foreground/80">
                    ID обращения
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-xl bg-background/80 border px-4 py-2.5 text-sm font-mono font-bold tracking-[0.15em] text-center text-foreground">
                    {ticketId}
                  </code>
                  <button
                    onClick={handleCopyId}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 hover:bg-muted/60 transition-all shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Максимальный срок — до 14 дней, обычно 24–48 ч
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <a
                  href="mailto:In-motion@info.io"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all"
                >
                  <Mail className="h-3.5 w-3.5" />
                  In-motion@info.io
                </a>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg shadow-primary/25"
                >
                  На главную
                </button>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setType(null);
                    setMessage("");
                    setFiles([]);
                    setNeedReply(false);
                    setEmail("");
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  Новое обращение
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const catConfig = cat;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/[0.07] via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-primary/[0.07] via-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-muted/80 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">На главную</span>
          </Link>
        </div>

        {!type ? (
          <>
            {/* Category selection */}
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-4 ring-1 ring-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-2">
                  Связь с разработчиками
                </h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Максимальный срок рассмотрения — до 14 дней, но обычно
                  отвечаем в течение 24–48 часов. Если нужно срочно —
                  напишите в личные сообщения Telegram или на почту.
                </p>
              </div>

              {/* Official / media / blogger notice */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 mb-6 rounded-xl border border-amber-200/60 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Для официальных запросов
                    </p>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                      Обращения от представителей СМИ, государственных органов и
                      блогеров принимаются только по электронной почте.
                      Направьте запрос на официальном бланке с печатью и
                      подписью уполномоченного лица (в том числе электронной
                      подписью в рамках действующего законодательства РФ).
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href="mailto:In-motion@info.io"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        <Mail className="h-3 w-3" />
                        In-motion@info.io
                      </a>
                      <span className="text-[10px] text-amber-600/60 dark:text-amber-500/50">
                        Максимальный срок — до 14 дней, обычно 24–48 ч
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setType(cat.value)}
                    className="group relative text-left rounded-2xl border border-border/50 bg-card/40 p-5 hover:bg-card/80 hover:border-border/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div
                      className={cn(
                        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br",
                        cat.gradient,
                      )}
                    />
                    <div className="relative">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-transform group-hover:scale-110 duration-200",
                          cat.bgColor,
                        )}
                      >
                        <cat.icon className={cn("h-5 w-5", cat.color)} />
                      </div>
                      <h3
                        className={cn(
                          "text-sm font-semibold mb-1 transition-colors",
                          cat.color,
                        )}
                      >
                        {cat.label}
                      </h3>
                      <p className="text-xs text-muted-foreground/70 leading-relaxed">
                        {cat.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Clock className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/50">
                          {cat.responseTime}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Direct contacts */}
              <div className="mt-10 text-center">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <span className="h-px w-12 bg-border/40" />
                  <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-semibold">
                    Или напрямую
                  </span>
                  <span className="h-px w-12 bg-border/40" />
                </div>
                <p className="text-[10px] text-muted-foreground/50 mb-3">
                  Если нужно срочно — пишите в личные сообщения Telegram или на
                  почту
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {[
                    {
                      icon: Mail,
                      label: "In-motion@info.io",
                      href: "mailto:In-motion@info.io",
                    },
                    {
                      icon: Send,
                      label: "@artyom_medoed",
                      href: "tg://resolve?domain=artyom_medoed",
                    },
                    {
                      icon: Send,
                      label: "@inmotion_use_bot",
                      href: "tg://resolve?domain=inmotion_use_bot",
                    },
                  ].map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-border/40 px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border/70 transition-all"
                    >
                      <c.icon className="h-3.5 w-3.5" />
                      {c.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Form */}
            <div className="max-w-2xl mx-auto">
              <button
                onClick={() => setType(null)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Назад к выбору темы
              </button>

              {catConfig && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl -mx-4 px-4 pb-4 mb-6 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                          catConfig.bgColor,
                        )}
                      >
                        <catConfig.icon
                          className={cn("h-5 w-5", catConfig.color)}
                        />
                      </div>
                      <div>
                        <h1 className="text-lg font-bold">{catConfig.label}</h1>
                        <p className="text-xs text-muted-foreground">
                          {catConfig.description}
                        </p>
                      </div>
                      <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground/50 bg-muted/30 px-2.5 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        {catConfig.responseTime}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/50 bg-card/40 p-5 sm:p-7">
                    <div className="space-y-5">
                      {/* Message */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Сообщение
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-mono transition-colors",
                              charProgress > 0.9
                                ? "text-rose-500"
                                : charProgress > 0.7
                                  ? "text-amber-500"
                                  : "text-muted-foreground/40",
                            )}
                          >
                            {message.length}/{charLimit}
                          </span>
                        </div>
                        <div className="relative">
                          <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) =>
                              setMessage(e.target.value.slice(0, charLimit))
                            }
                            placeholder={catConfig.placeholder}
                            rows={5}
                            className="w-full rounded-xl bg-background/50 border border-border/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/20 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all duration-300 rounded-full",
                                charProgress > 0.9
                                  ? "bg-rose-500"
                                  : charProgress > 0.7
                                    ? "bg-amber-500"
                                    : "bg-primary/30",
                              )}
                              style={{ width: `${charProgress * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Priority — for complaints only */}
                      {type === "complaint" && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Приоритет
                          </p>
                          <div className="flex gap-2">
                            {PRIORITIES.map((p) => (
                              <button
                                key={p.value}
                                onClick={() => setPriority(p.value)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                                  priority === p.value
                                    ? p.color + " border-current"
                                    : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                )}
                              >
                                <p.icon className="h-3 w-3" />
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* File upload */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Вложения
                        </p>
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/40 bg-background/30 px-4 py-6 text-center cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground/70 group-hover:text-foreground/80 transition-colors">
                              Перетащите файлы или нажмите для выбора
                            </p>
                            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                              до 5 файлов, PNG, JPG, PDF до 10 MB
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                        </div>
                        {files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {files.map((file, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/30 px-2.5 py-1.5 text-[11px]"
                              >
                                <Paperclip className="h-3 w-3 text-muted-foreground/50" />
                                <span className="text-muted-foreground/80 truncate max-w-[120px]">
                                  {file.name}
                                </span>
                                <button
                                  onClick={() => removeFile(i)}
                                  className="text-muted-foreground/40 hover:text-rose-500 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Need reply */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={needReply}
                            onChange={(e) => setNeedReply(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center">
                            {needReply && (
                              <Check className="h-3.5 w-3.5 text-primary-foreground" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/90">
                            Мне нужен ответ
                          </p>
                          <p className="text-xs text-muted-foreground/60">
                            Укажите почту для обратной связи
                          </p>
                        </div>
                      </label>

                      {needReply && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full rounded-xl bg-background/50 border border-border/50 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                            />
                          </div>
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        onClick={handleSubmit}
                        disabled={
                          !message.trim() ||
                          message.trim().length < 20 ||
                          sending
                        }
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Отправить
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
