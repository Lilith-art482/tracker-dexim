"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMenuMode } from "@/lib/menu-mode-context";

interface ShortcutConfigModalProps {
  open: boolean;
  onClose: () => void;
}

function KeyCapture({ value, onChange, onCaptureStart, onCaptureEnd }: {
  value: string;
  onChange: (v: string) => void;
  onCaptureStart: () => void;
  onCaptureEnd: () => void;
}) {
  const [capturing, setCapturing] = useState(false);
  const capturedRef = useRef(false);

  const startCapture = useCallback(() => {
    capturedRef.current = false;
    setCapturing(true);
    onCaptureStart();
  }, [onCaptureStart]);

  const stopCapture = useCallback(() => {
    setCapturing(false);
    onCaptureEnd();
  }, [onCaptureEnd]);

  useEffect(() => {
    if (!capturing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      capturedRef.current = true;

      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) {
        parts.push(navigator.platform.toUpperCase().includes("MAC") ? "Cmd" : "Ctrl");
      }
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");

      if (!["Meta", "Control", "Shift", "Alt"].includes(e.key)) {
        const label = e.key === " " ? "Space" : e.key === "CapsLock" ? "CapsLock" : e.key.length === 1 ? e.key.toUpperCase() : e.key;
        parts.push(label);
      }

      if (parts.length > 0) {
        onChange(parts.join("+"));
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (capturedRef.current) {
        stopCapture();
      }
    };

    const onBlur = () => {
      stopCapture();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    window.addEventListener("keyup", onKeyUp, { capture: true });
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [capturing, onChange, stopCapture]);

  return (
    <button
      type="button"
      onClick={startCapture}
      className={cn(
        "w-full px-3 py-2.5 rounded-xl text-xs font-mono transition-all border",
        capturing
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-muted/50 border-border/40 text-foreground hover:bg-muted/80",
      )}
    >
      {capturing ? "Нажмите комбинацию..." : value || "Нажмите для настройки"}
    </button>
  );
}

export function ShortcutConfigModal({ open, onClose }: ShortcutConfigModalProps) {
  const { shortcuts, setShortcuts } = useMenuMode();
  const [local, setLocal] = useState(shortcuts);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (open) {
      setLocal(shortcuts);
      setCapturing(false);
    }
  }, [open, shortcuts]);

  const handleSave = () => {
    setShortcuts(local);
    onClose();
  };

  const handleReset = () => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    setLocal({ circular: isMac ? "Cmd+Shift" : "Ctrl+Shift" });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border/30">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Keyboard className="h-4 w-4 text-primary" />
            Быстрые клавиши
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4">
          <p className="text-[11px] text-muted-foreground">
            Нажмите на поле и нажмите комбинацию клавиш. Отпустите клавиши для подтверждения.
          </p>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Открыть круговое меню
            </label>
            <KeyCapture
              value={local.circular}
              onChange={(v) => setLocal({ circular: v })}
              onCaptureStart={() => setCapturing(true)}
              onCaptureEnd={() => setCapturing(false)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={handleReset}
              disabled={capturing}
            >
              <RotateCcw className="h-3 w-3" />
              Сброс
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onClose} disabled={capturing}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={capturing || !local.circular}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
