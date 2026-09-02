"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Сколько циклов сна нужно для полного восстановления?",
  "Как трактовать сон, в котором я летаю?",
  "Почему я просыпаюсь посреди ночи?",
  "Как рассчитать время подъёма, чтобы встать бодрым?",
];

const COLLECTION = "SLEEP_CHAT_MESSAGES";
const RETENTION_HOURS = 24;

function getConversationId(uid: string): string {
  return `sleep_${uid}`;
}

export default function SleepChatInline() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setHistoryLoaded(true);
        return;
      }

      try {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - RETENTION_HOURS);
        const cutoffTs = Timestamp.fromDate(cutoff);

        const q = query(
          collection(db, COLLECTION),
          where("conversationId", "==", getConversationId(uid)),
          where("createdAt", ">=", cutoffTs),
          orderBy("createdAt", "asc"),
        );
        const snap = await getDocs(q);
        const loaded: Message[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          loaded.push({ role: data.role, content: data.content });
        });
        if (loaded.length > 0) {
          setMessages(loaded);
        }

        const expiredQ = query(
          collection(db, COLLECTION),
          where("conversationId", "==", getConversationId(uid)),
          where("createdAt", "<", cutoffTs),
        );
        const expiredSnap = await getDocs(expiredQ);
        expiredSnap.forEach((doc) => deleteDoc(doc.ref));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      } finally {
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, []);

  async function saveMessage(role: "user" | "assistant", content: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await addDoc(collection(db, COLLECTION), {
        conversationId: getConversationId(uid),
        role,
        content,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to save chat message:", e);
    }
  }

  async function send(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    await saveMessage("user", msg);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/ai/sleep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        data.error ||
        "Не удалось получить ответ";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      await saveMessage("assistant", reply);
    } catch {
      const errReply = "Ошибка соединения. Попробуйте позже.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errReply },
      ]);
      await saveMessage("assistant", errReply);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Sleep AI</p>
          <p className="text-[10px] text-muted-foreground">
            Эксперт по сну и восстановлению
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <Clock className="h-3 w-3" />
          24ч
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!historyLoaded && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Задайте вопрос о сне, циклах или сновидениях
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="w-full text-left text-xs px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0 mt-1">
                <Bot className="h-3 w-3 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-muted rounded-bl-md"
              )}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0 mt-1">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 shrink-0 sticky bottom-0 bg-card z-10">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите сон или задайте вопрос..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 max-h-20"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
