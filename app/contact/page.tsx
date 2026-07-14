"use client";

import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

type FeedbackType = "idea" | "suggestion" | "complaint";

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  icon: typeof Lightbulb;
}[] = [
  { value: "idea", label: "Идея", icon: Lightbulb },
  { value: "suggestion", label: "Предложение", icon: Sparkles },
  { value: "complaint", label: "Жалоба", icon: AlertTriangle },
];

export default function ContactPage() {
  const router = useRouter();
  const [type, setType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState("");
  const [needReply, setNeedReply] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!type || !message.trim()) return;
    setSending(true);

    // Simulate sending
    await new Promise((r) => setTimeout(r, 1200));

    const id = "TKT-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    setTicketId(id);
    setSubmitted(true);
    setSending(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("ID скопирован");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-500/20 via-emerald-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-l from-emerald-500/15 to-transparent rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-lg">
          <div className="backdrop-blur-xl bg-card/60 border border-border/60 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-xl text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Сообщение отправлено</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Спасибо! Мы рассмотрим ваше обращение.
            </p>

            <div className="rounded-xl bg-muted/50 border p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2">
                Сохраните ID обращения:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-background/80 border px-3 py-2 text-sm font-mono font-bold text-center tracking-wider">
                  {ticketId}
                </code>
                <button
                  onClick={handleCopyId}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border hover:bg-muted/60 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60 mb-6">
              Если у вас есть дополнительные вопросы, напишите нам в Telegram
              или на почту.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <a
                href="mailto:In-motion@info.io"
                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Mail className="h-3.5 w-3.5" />
                In-motion@info.io
              </a>
              <a
                href="tg://resolve?domain=artyom_medoed"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                @artyom_medoed
              </a>
              <a
                href="tg://resolve?domain=inmotion_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                @inmotion_bot
              </a>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm hover:from-primary/90 hover:to-primary/70 transition-all shadow-lg shadow-primary/25"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>На главную</span>
          </Link>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="backdrop-blur-xl bg-card/60 border border-border/60 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Связь с разработчиками</h1>
                <p className="text-xs text-muted-foreground">
                  Идеи, предложения, жалобы
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  Тип обращения
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all ${
                        type === t.value
                          ? "border-primary/40 bg-primary/5 text-primary shadow-sm"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <t.icon className="h-5 w-5" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  Сообщение
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите вашу идею, предложение или проблему..."
                  rows={6}
                  className="w-full rounded-xl bg-background/50 border border-border/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={needReply}
                    onChange={(e) => setNeedReply(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors peer-checked:border-primary peer-checked:bg-primary peer-checked:[&>svg]:opacity-100 flex items-center justify-center">
                    {needReply && (
                      <Check className="h-3.5 w-3.5 text-primary-foreground opacity-100" />
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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl bg-background/50 border border-border/60 pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!type || !message.trim() || sending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
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

            <div className="mt-6 pt-4 border-t border-border/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span className="font-medium">Или напишите напрямую:</span>
                </span>
                <div className="flex items-center gap-3">
                  <a
                    href="mailto:In-motion@info.io"
                    className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground transition-colors font-medium"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>In-motion@info.io</span>
                  </a>
                  <a
                    href="tg://resolve?domain=artyom_medoed"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground transition-colors font-medium"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>@artyom_medoed</span>
                  </a>
                  <a
                    href="tg://resolve?domain=inmotion_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground transition-colors font-medium"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>@inmotion_bot</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
