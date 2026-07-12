"use client";

import { X } from "lucide-react";
import { useAudio, SOUND_TYPES } from "@/lib/audio-context";
import { cn } from "@/lib/utils";

export default function AudioModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    isPlaying,
    toggle: toggleAudio,
    soundType,
    setSoundType,
  } = useAudio();

  if (!open) return null;

  return (
    <div className="fixed inset-0 isolate z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-3xl overflow-hidden dark:bg-[#121814]/90 dark:border dark:border-[#4E6E62]/30 bg-white/95 border border-border/60 shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="text-sm font-bold text-foreground">
              Управление мелодией
            </h2>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="px-5 pb-2">
            <div className="flex flex-col gap-1">
              {SOUND_TYPES.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSoundType(s.id);
                      if (!isPlaying) toggleAudio();
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all w-full text-left",
                      isPlaying && soundType === s.id
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        isPlaying && soundType === s.id
                          ? "bg-primary/15"
                          : "bg-muted/60",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground/60">
                        {getSoundDesc(s.id)}
                      </p>
                    </div>
                    {isPlaying && soundType === s.id && (
                      <span className="ml-auto flex items-center gap-px">
                        <span
                          className="h-2 w-0.5 animate-pulse rounded-full bg-primary"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-3 w-0.5 animate-pulse rounded-full bg-primary"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-2 w-0.5 animate-pulse rounded-full bg-primary"
                          style={{ animationDelay: "300ms" }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t dark:border-[#4E6E62]/20 border-border/60 px-5 py-3.5 dark:bg-[#0f1411]/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Воспроизведение
              </span>
              <button
                onClick={toggleAudio}
                className={cn(
                  "relative inline-flex h-6 w-10 items-center rounded-full transition-colors",
                  isPlaying ? "bg-primary" : "bg-muted-foreground/30",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                    isPlaying ? "translate-x-5" : "translate-x-1",
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSoundDesc(id: string) {
  const map: Record<string, string> = {
    ambient: "Мягкая фоновая мелодия",
    rain: "Шум дождя с редкими каплями",
    fire: "Потрескивание костра",
    wind: "Порывы ветра",
    focus: "Ровный шум для концентрации",
    relax: "Глубокий расслабляющий гул",
  };
  return map[id] ?? "";
}
