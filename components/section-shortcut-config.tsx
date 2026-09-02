"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSectionShortcuts, type SectionShortcut } from "@/lib/section-shortcuts-context";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  planner: "Планнер",
  ideas: "Идея",
  notes: "Заметки",
  finance: "Финансы",
  work: "Работа",
  habits: "Привычки",
  family: "Семья",
  sport: "Спорт",
  sleep: "Сон",
  focusing: "Фокус",
};

interface SectionShortcutConfigProps {
  open: boolean;
  onClose: () => void;
}

export function SectionShortcutConfig({ open, onClose }: SectionShortcutConfigProps) {
  const { shortcuts, setShortcuts } = useSectionShortcuts();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const handleKeyCapture = (idx: number, e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const key = e.key;
    if (["Control", "Shift", "Alt", "Meta"].includes(key)) return;

    const updated = [...shortcuts];
    updated[idx] = { ...updated[idx], key };
    setShortcuts(updated);
    setEditingIdx(null);
  };

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
  const modLabel = isMac ? "⌘" : "Win+";

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Быстрые клавиши разделов
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1 py-2">
          <p className="text-xs text-muted-foreground mb-3">
            Нажми на клавишу, чтобы изменить сочетание. По умолчанию: {modLabel} + цифра
          </p>

          {shortcuts.map((shortcut, idx) => (
            <div
              key={shortcut.section}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <span className="flex-1 text-sm font-medium">
                {SECTION_LABELS[shortcut.section] || shortcut.section}
              </span>

              <button
                onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all border",
                  editingIdx === idx
                    ? "bg-primary/10 text-primary border-primary/30 ring-1 ring-primary/20"
                    : "bg-background border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60",
                )}
                onKeyDown={(e) => {
                  if (editingIdx === idx) {
                    handleKeyCapture(idx, e);
                  }
                }}
              >
                <span className="text-muted-foreground/60">{modLabel}</span>
                <span>+</span>
                <span>{shortcut.key}</span>
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
