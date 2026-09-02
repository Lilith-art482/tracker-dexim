"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSectionShortcuts } from "@/lib/section-shortcuts-context";

export function SectionShortcutHandler() {
  const { shortcuts } = useSectionShortcuts();
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (!modKey) return;
      if (e.shiftKey || e.altKey) return;

      const key = e.key;

      const shortcut = shortcuts.find((s) => s.key === key);
      if (shortcut) {
        e.preventDefault();
        router.push(shortcut.route);
      }
    },
    [shortcuts, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
