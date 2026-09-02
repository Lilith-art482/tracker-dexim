"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface ShortcutConfig {
  circular: string;
}

interface MenuModeContextValue {
  shortcuts: ShortcutConfig;
  setShortcuts: (s: ShortcutConfig) => void;
}

const MenuModeContext = createContext<MenuModeContextValue>({
  shortcuts: { circular: "" },
  setShortcuts: () => {},
});

function getDefaultShortcut(): string {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  return isMac ? "Cmd+ArrowRight" : "Ctrl+ArrowRight";
}

const SHORTCUTS_KEY = "inmotion_shortcuts";

export function MenuModeProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcutsState] = useState<ShortcutConfig>({ circular: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SHORTCUTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setShortcutsState({ circular: parsed.circular || getDefaultShortcut() });
      } else {
        setShortcutsState({ circular: getDefaultShortcut() });
      }
    } catch {
      setShortcutsState({ circular: getDefaultShortcut() });
    }
  }, []);

  const setShortcuts = useCallback((s: ShortcutConfig) => {
    setShortcutsState(s);
    try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(s)); } catch {}
  }, []);

  return (
    <MenuModeContext.Provider value={{ shortcuts, setShortcuts }}>
      {children}
    </MenuModeContext.Provider>
  );
}

export function useMenuMode() {
  return useContext(MenuModeContext);
}
