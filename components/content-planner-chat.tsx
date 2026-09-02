"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Bot,
  User,
  X,
  Loader2,
  Sparkles,
  PenLine,
  Lightbulb,
  MessageSquarePlus,
  History,
  Download,
  Trash2,
  ArrowRight,
  Clapperboard,
  Megaphone,
  Video,
  Pencil,
  Check,
  FileText,
  Paperclip,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PlannerChat, PlannerMessage } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { buildExportMarkdown, buildExportDocx } from "@/lib/export-content";
import {
  CONTENT_PLANNER_STORAGE_KEY,
  CONTENT_PLANNER_MAX_CHATS,
  CONTENT_PLANNER_TTL_MS,
  CONTENT_PLANNER_PROMPT,
  PLANNER_FILE_MAX_TEXT,
} from "@/lib/ai-content-prompt";
import {
  DEVELOPER_AI_STORAGE_KEY,
  DEVELOPER_AI_MAX_CHATS,
  DEVELOPER_AI_TTL_MS,
  DEVELOPER_PROMPT,
} from "@/lib/ai-developer-prompt";
import { toast } from "sonner";

interface SuggestedPrompt {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  text: string;
}

const QUICK_PROMPTS: SuggestedPrompt[] = [
  {
    icon: PenLine,
    label: "Пост для Telegram",
    text: "Помоги написать пост для Telegram: тема — как перестать прокрастинировать. Уточни у меня всё, что нужно, и дай готовый план.",
  },
  {
    icon: Video,
    label: "Видео на YouTube",
    text: "Составь план видео про запуск мобильного приложения. Сначала уточни стиль и жанр, потом дай структуру.",
  },
  {
    icon: Clapperboard,
    label: "Сторис о запуске",
    text: "Придумай сторис о запуске нового продукта. Сначала задай пару вопросов, потом предложи сценарий по кадрам.",
  },
  {
    icon: Megaphone,
    label: "Идеи без темы",
    text: "Предложи 5 идей для контента и спроси, какую проработаем.",
  },
];

function makeTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 48 ? clean.slice(0, 48) + "…" : clean;
}

function sanitize(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1");
}

function pruneChats(chats: PlannerChat[], mode: "content" | "dev"): PlannerChat[] {
  const now = Date.now();
  const ttl = mode === "dev" ? DEVELOPER_AI_TTL_MS : CONTENT_PLANNER_TTL_MS;
  const maxChats = mode === "dev" ? DEVELOPER_AI_MAX_CHATS : CONTENT_PLANNER_MAX_CHATS;
  const alive = chats.filter(
    (c) => now - (c.updatedAt || c.createdAt) <= ttl,
  );
  return alive
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, maxChats);
}

function loadChats(mode: "content" | "dev"): PlannerChat[] {
  try {
    const key = mode === "dev" ? DEVELOPER_AI_STORAGE_KEY : CONTENT_PLANNER_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return pruneChats(parsed, mode);
  } catch {
    return [];
  }
}

function saveChats(chats: PlannerChat[], mode: "content" | "dev") {
  try {
    const key = mode === "dev" ? DEVELOPER_AI_STORAGE_KEY : CONTENT_PLANNER_STORAGE_KEY;
    localStorage.setItem(
      key,
      JSON.stringify(pruneChats(chats, mode)),
    );
  } catch {}
}
function formatChatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

const SERVER_MESSAGE_CAP = 110;

async function serverLoad(uid?: string, mode: "content" | "dev" = "content"): Promise<PlannerChat[] | null> {
  try {
    const params = new URLSearchParams();
    if (uid) params.set("uid", uid);
    const res = await fetch(`/api/planner-chats?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? pruneChats(data, mode) : null;
  } catch {
    return null;
  }
}

async function serverUpsert(chat: PlannerChat): Promise<boolean> {
  try {
    const res = await fetch("/api/planner-chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat: { ...chat, messages: chat.messages.slice(-SERVER_MESSAGE_CAP) },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function serverDelete(id: string): Promise<boolean> {
  try {
    const res = await fetch("/api/planner-chats", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function syncChat(chat: PlannerChat): Promise<void> {
  const ok = await serverUpsert(chat);
  if (!ok) {
    toast.error(
      "Не удалось сохранить чат на сервере. Изменения пока останутся на этом устройстве.",
    );
  }
}

type Attachment = NonNullable<PlannerMessage["attachment"]>;

async function readFileText(file: File): Promise<Attachment> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let raw: string;
  if (["txt", "md", "csv"].includes(ext)) {
    raw = await file.text();
  } else if (["pdf", "docx"].includes(ext)) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ai/planner-file", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || typeof data?.text !== "string") {
      throw new Error(data?.error || "read failed");
    }
    raw = data.text;
  } else {
    throw new Error("unsupported");
  }
  const cleaned = raw.replace(/\u0000/g, "").trim();
  if (!cleaned) throw new Error("empty");
  const text =
    cleaned.length > PLANNER_FILE_MAX_TEXT
      ? cleaned.slice(0, PLANNER_FILE_MAX_TEXT) + "\n…(файл обрезан)"
      : cleaned;
  return { name: file.name, text };
}
interface ContentPlannerChatProps {
  open: boolean;
  onClose: () => void;
  mode?: "content" | "dev";
}

export function ContentPlannerChat({ open, onClose, mode = "content" }: ContentPlannerChatProps) {
  const [chats, setChats] = useState<PlannerChat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    if (!open) return;
    const cached = pruneChats(loadChats(mode), mode);
    setChats(cached);
    setActiveId(cached[0]?.id ?? null);
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 250);

    let cancelled = false;
    (async () => {
      const serverChats = await serverLoad(auth.currentUser?.uid, mode);
      if (cancelled) return;
      if (serverChats && serverChats.length > 0) {
        setChats(serverChats);
        setActiveId((prev) =>
          serverChats.some((c) => c.id === prev)
            ? prev
            : (serverChats[0]?.id ?? null),
        );
        saveChats(pruneChats(serverChats, mode), mode);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, activeId]);

  function persist(next: PlannerChat[]) {
    setChats(next);
    saveChats(next, mode);
  }

  function commitRename() {
    if (!editingChatId) return;
    const id = editingChatId;
    const trimmed = renameValue.replace(/\s+/g, " ").trim();
    setEditingChatId(null);
    setRenameValue("");
    const chat = chats.find((c) => c.id === id);
    if (!chat || !trimmed || trimmed === chat.title) return;
    const updated = pruneChats(
      chats.map((c) =>
        c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c,
      ),
      mode,
    );
    persist(updated);
    const changed = updated.find((c) => c.id === id);
    if (changed) void syncChat(changed);
  }

  function startRename(id: string) {
    const chat = chats.find((c) => c.id === id);
    setEditingChatId(editingChatId === id ? null : id);
    setRenameValue(chat?.title ?? "");
  }

  async function sendMessage(text: string) {
    if ((!text.trim() && !attachment) || loading || parsingFile) return;
    const sentAttachment = attachment;
    const cleanText = text.trim() || "Проанализируй приложенный файл";
    setAttachment(null);

    const now = Date.now();
    let chatId = activeId;
    let snapshotChat = chats.find((c) => c.id === chatId) ?? null;

    if (!snapshotChat) {
      snapshotChat = {
        id: crypto.randomUUID(),
        title: "",
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      chatId = snapshotChat.id;
      setActiveId(chatId);
    }

    const userMsg: PlannerMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanText,
      createdAt: now,
      attachment: sentAttachment ?? undefined,
    };
    const withUser = [...snapshotChat.messages, userMsg];
    const updatedChat: PlannerChat = {
      ...snapshotChat,
      updatedAt: now,
      title:
        snapshotChat.title ||
        makeTitle(
          (sentAttachment ? sentAttachment.name + " · " : "") + cleanText,
        ),
      messages: withUser,
    };

    persist(pruneChats([...chats.filter((c) => c.id !== chatId), updatedChat], mode));

    setInput("");
    setSidebarOpen(false);
    setLoading(true);

    const history = withUser.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
      attachmentText: m.attachment?.text,
    }));

    try {
      const res = await fetch("/api/ai/content-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanText,
          messageAttachmentText: sentAttachment?.text,
          history,
          mode,
        }),
      });
      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        data.error ||
        "Не удалось получить ответ.";

      const assistantMsg: PlannerMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };
      const finalChat: PlannerChat = {
        ...updatedChat,
        updatedAt: Date.now(),
        messages: [...withUser, assistantMsg],
      };
      persist(pruneChats([...chats.filter((c) => c.id !== chatId), finalChat], mode));
      void syncChat(finalChat);
    } catch {
      const errMsg: PlannerMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Ошибка соединения. Попробуйте ещё раз.",
        createdAt: Date.now(),
      };
      const finalChat: PlannerChat = {
        ...updatedChat,
        updatedAt: Date.now(),
        messages: [...withUser, errMsg],
      };
      persist(pruneChats([...chats.filter((c) => c.id !== chatId), finalChat], mode));
      void syncChat(finalChat);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setActiveId(null);
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function deleteChat(id: string) {
    const next = pruneChats(chats.filter((c) => c.id !== id), mode);
    persist(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
    void serverDelete(id).then((ok) => {
      if (!ok) toast.error("Не удалось удалить чат на сервере");
    });
  }

  function exportChat(chat: PlannerChat) {
    const markdown = buildExportMarkdown(chat);
    const dateStr = new Date(chat.updatedAt).toISOString().split("T")[0];
    const fileName = `content-plan-${dateStr}.md`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportDocx(chat: PlannerChat) {
    try {
      const blob = await buildExportDocx(chat);
      const dateStr = new Date(chat.updatedAt).toISOString().split("T")[0];
      const fileName = `content-plan-${dateStr}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Не удалось создать документ");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setParsingFile(true);
    try {
      const text = await readFileText(file);
      setAttachment(text);
      toast.success("Файл прикреплён");
    } catch {
      toast.error(
        "Не удалось прочитать файл. Поддерживаются TXT, MD, CSV, PDF и DOCX",
      );
    } finally {
      setParsingFile(false);
    }
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="!flex flex-col p-0 gap-0 overflow-hidden rounded-2xl w-full max-w-[calc(100%-1.5rem)] sm:max-w-5xl lg:max-w-6xl h-[min(960px,96vh)] max-h-[96vh] !ring-primary/15 shadow-2xl shadow-primary/10"
      >
        <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-primary via-primary/80 to-primary" />
        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 border-b bg-gradient-to-r from-primary/10 via-background to-primary/10 px-4 sm:px-5 py-3.5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/30">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base leading-tight">
                Контент-план
              </DialogTitle>
              <DialogDescription className="text-[11px] mt-0.5 text-muted-foreground/70">
                AI-агент: идеи, планы и тексты для публикаций
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors md:hidden",
                sidebarOpen
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50",
              )}
              title="История чатов"
            >
              <History className="h-4 w-4" />
            </button>
            {activeChat && activeChat.messages.length > 0 && (
              <>
                <button
                  onClick={() => exportChat(activeChat)}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Экспортировать в Markdown"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Экспорт</span>
                </button>
                <button
                  onClick={() => exportDocx(activeChat)}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
                  title="Экспортировать в Word-документ"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Документ</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside
            className={cn(
              "w-full md:w-72 shrink-0 border-r bg-muted/20 md:bg-transparent md:flex-col",
              sidebarOpen
                ? "fixed inset-x-0 top-0 bottom-0 z-20 pt-16 md:static md:pt-0 flex"
                : "hidden md:flex",
            )}
          >
            <div className="flex flex-col h-full">
              <div className="p-3 border-b">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={startNewChat}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Новый чат
                </Button>
              </div>

              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  История
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {chats.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
                {chats.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground/60">
                    Чатов пока нет. Начните новый диалог
                  </p>
                ) : (
                  chats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-colors cursor-pointer",
                        chat.id === activeId
                          ? "bg-primary/10"
                          : "hover:bg-muted/60",
                      )}
                      onClick={() => {
                        setActiveId(chat.id);
                        setSidebarOpen(false);
                      }}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <PenLine
                          className={cn(
                            "h-3.5 w-3.5",
                            chat.id === activeId
                              ? "text-primary"
                              : "text-muted-foreground/60",
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitRename();
                                if (e.key === "Escape") {
                                  setEditingChatId(null);
                                  setRenameValue("");
                                }
                              }}
                              onBlur={commitRename}
                              placeholder="Название чата"
                              className="h-6 px-1.5 py-0 text-xs"
                            />
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={commitRename}
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition-colors"
                              title="Сохранить"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="truncate text-xs font-medium">
                            {chat.title || "Новый чат"}
                          </p>
                        )}
                        <p
                          className={
                            editingChatId === chat.id
                              ? "hidden"
                              : "text-[10px] text-muted-foreground/50"
                          }
                        >
                          {formatChatDate(chat.updatedAt)} ·{" "}
                          {chat.messages.length} сообщ.
                        </p>
                      </div>
                      <div className="hidden group-hover:flex shrink-0 items-center gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(chat.id);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Переименовать"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat.id);
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Удалить чат"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t p-3 space-y-1.5">
                <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
                  Чаты синхронизируются с облаком и доступны со всех устройств.
                  Хранятся последние {CONTENT_PLANNER_MAX_CHATS} чатов,
                  автоматически удаляются через 7 дней.
                </p>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  К чату
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Main chat */}
          <div className="flex flex-1 flex-col min-w-0">
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-4 min-h-0">
              {!activeChat || activeChat.messages.length === 0 ? (
                <div className="flex flex-col gap-4 max-w-xl mx-auto w-full pt-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm shadow-primary/30">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-2xl bg-muted/50 px-4 py-3.5 text-sm">
                      <p className="font-semibold mb-1">
                        Привет! Я — агент контент-планнера
                      </p>
                      <p className="text-muted-foreground text-[13px] leading-relaxed">
                        Помогу собрать идею и готовый контент-план: формат,
                        структура, крючок, тезисы и призыв к действию. Расскажи
                        тему и формат — или просто нажми подсказку, и я начну
                        уточнять детали.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium mb-2 px-1">
                      С чего начать
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_PROMPTS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => sendMessage(p.text)}
                          disabled={loading}
                          className="group flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 text-left transition-all hover:border-primary/40 hover:bg-primary/5 disabled:opacity-40"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary transition-colors group-hover:bg-primary/15">
                            <p.icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold">{p.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {p.text}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 text-xs text-muted-foreground/70">
                    <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      Могу уточнять формат, стиль, жанр и площадку — и дам план,
                      готовый к публикации.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto w-full space-y-4">
                  {activeChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-start gap-2.5",
                        msg.role === "user" && "flex-row-reverse",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          msg.role === "assistant"
                            ? "bg-gradient-to-br from-primary to-primary/80"
                            : "bg-primary/10",
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <Bot className="h-3.5 w-3.5 text-white" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed max-w-[85%]",
                          msg.role === "assistant"
                            ? "bg-muted/50"
                            : "bg-primary/10",
                        )}
                      >
                        {msg.attachment && (
                          <span className="mb-1.5 flex items-center gap-1.5 rounded-md bg-primary/15 px-2 py-1">
                            <FileText className="h-3 w-3 shrink-0 text-primary dark:text-primary" />
                            <span className="truncate text-[11px] font-medium text-primary dark:text-primary">
                              {msg.attachment.name}
                            </span>
                          </span>
                        )}
                        <span className="whitespace-pre-wrap">
                          {sanitize(msg.content)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="rounded-2xl bg-muted/50 px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70"
                              style={{ animationDelay: `${i * 120}ms` }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-3 sm:px-5 py-3 shrink-0 bg-background">
              {(attachment || parsingFile) && (
                <div className="mb-2 flex items-center gap-2.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  {parsingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">
                        Читаем файл…
                      </p>
                    </>
                  ) : (
                    attachment && (
                      <>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {attachment.name}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            текст будет приложен к вашему сообщению
                          </p>
                        </div>
                        <button
                          onClick={() => setAttachment(null)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
                          title="Убрать файл"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )
                  )}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || parsingFile || !!attachment}
                  className="shrink-0 h-10 w-10 text-muted-foreground"
                  title="Прикрепить файл (TXT, MD, CSV, PDF, DOCX)"
                >
                  {parsingFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Например: сделай план поста о запуске…"
                  className="h-10 text-sm"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={
                    (!input.trim() && !attachment) || loading || parsingFile
                  }
                  className="shrink-0 h-10 w-10"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
              <p className="mt-2 text-[10px] text-muted-foreground/40 text-center sm:text-left">
                Агент уточняет формат, стиль и жанр. Чаты синхронизируются с
                облаком и доступны со всех устройств.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/40 text-center sm:text-left">
                Можно приложить TXT, MD, CSV, PDF или DOCX. Скриншоты и
                изображения не распознаются — приложите текст или опишите
                словами.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
