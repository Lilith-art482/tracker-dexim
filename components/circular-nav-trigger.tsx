"use client";

import { useState, useEffect, useCallback } from "react";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMenuMode } from "@/lib/menu-mode-context";
import { CircularNav } from "@/components/circular-nav";

function matchShortcut(e: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;
  const parts = shortcut.toLowerCase().split("+");
  const isMac = navigator.platform.toUpperCase().includes("MAC");

  const needCtrl = parts.includes("ctrl") || (isMac && parts.includes("cmd"));
  const needShift = parts.includes("shift");
  const needAlt = parts.includes("alt");
  const key = parts.find((p) => !["ctrl", "cmd", "shift", "alt"].includes(p));

  const ctrlOk = needCtrl ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
  const shiftOk = needShift === e.shiftKey;
  const altOk = needAlt === e.altKey;

  const MODIFIER_KEYS = ["shift", "control", "alt", "meta", "capslock", "numlock", "scrolllock"];
  const isModifierEvent = MODIFIER_KEYS.includes(e.key.toLowerCase());

  let keyOk: boolean;
  if (key) {
    keyOk = e.key.toLowerCase() === key.toLowerCase();
  } else {
    keyOk = isModifierEvent;
  }

  return ctrlOk && shiftOk && altOk && keyOk;
}

interface CircularNavTriggerProps {
  onOpenAi?: () => void;
  onOpenSettings?: () => void;
}

export function CircularNavTrigger({ onOpenAi, onOpenSettings }: CircularNavTriggerProps) {
  const { shortcuts } = useMenuMode();
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!shortcuts.circular) return;
    const handler = (e: KeyboardEvent) => {
      if (matchShortcut(e, shortcuts.circular)) {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts.circular, toggle]);

  useEffect(() => {
    const handler = () => toggle();
    window.addEventListener("circular-menu:toggle", handler);
    return () => window.removeEventListener("circular-menu:toggle", handler);
  }, [toggle]);

  return <CircularNav isOpen={isOpen} onClose={close} onOpenAi={onOpenAi} onOpenSettings={onOpenSettings} />;
}
