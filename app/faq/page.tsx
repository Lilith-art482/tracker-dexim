"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  HelpCircle,
  ChevronRight,
  Search,
  MessageCircle,
  Bot,
  X,
} from "lucide-react";
import { FAQ_DATA } from "@/lib/faq";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AiChat from "@/components/ai-chat";

export default function FaqPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);

  const category = FAQ_DATA.find((c) => c.id === categoryId);

  const filteredItems = category
    ? category.items.filter(
        (item) =>
          !searchQuery ||
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Bot className="h-4 w-4" />
            Спросить AI
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">FAQ — частые вопросы</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ответы на все вопросы об In Motion
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              categoryId
                ? "Поиск по вопросам..."
                : "Поиск по всем категориям..."
            }
            className="pl-9 h-10 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {categoryId ? (
          /* Questions in a category */
          <div className="space-y-4">
            <button
              onClick={() => {
                setCategoryId(null);
                setSearchQuery("");
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-2"
            >
              ← Все категории
            </button>

            <h2 className="text-lg font-semibold">{category?.label}</h2>
            <p className="text-sm text-muted-foreground/70">
              {category?.items.length} вопросов
            </p>

            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-8">
                Ничего не найдено
              </p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-border/60 overflow-hidden"
                  >
                    <summary className="flex items-center justify-between px-4 py-3.5 text-sm font-medium cursor-pointer hover:bg-muted/20 transition-colors [&::-webkit-details-marker]:hidden">
                      <span>{item.question}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-open:rotate-90 transition-transform shrink-0 ml-2" />
                    </summary>
                    <div className="px-4 pb-3.5 pt-2 text-sm text-muted-foreground/80 leading-relaxed border-t border-border/40">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Category grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FAQ_DATA.map((cat) => {
              const matchingItems = searchQuery
                ? cat.items.filter(
                    (item) =>
                      item.question
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      item.answer
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()),
                  )
                : cat.items;

              if (searchQuery && matchingItems.length === 0) return null;

              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border/60 bg-card/50 p-5 text-left hover:bg-muted/30 hover:shadow-sm transition-all"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{cat.label}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      {searchQuery
                        ? `${matchingItems.length} совпадений`
                        : `${cat.items.length} вопросов`}
                    </p>
                  </div>
                  {searchQuery && matchingItems.length > 0 && (
                    <div className="w-full pt-2 border-t border-border/40 mt-1">
                      {matchingItems.slice(0, 2).map((item, i) => (
                        <p
                          key={i}
                          className="text-xs text-muted-foreground/70 truncate"
                        >
                          {item.question}
                        </p>
                      ))}
                      {matchingItems.length > 2 && (
                        <p className="text-xs text-muted-foreground/40 mt-1">
                          + ещё {matchingItems.length - 2}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground/70 mb-3">
            Не нашли ответ? Свяжитесь с разработчиками
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/contact">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Написать нам
              </Button>
            </Link>
            <Button
              variant="default"
              className="gap-2"
              onClick={() => setChatOpen(true)}
            >
              <Bot className="h-4 w-4" />
              Спросить AI
            </Button>
          </div>
        </div>
      </div>

      <AiChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
