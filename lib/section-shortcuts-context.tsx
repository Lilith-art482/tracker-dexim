"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface SectionShortcut {
  section: string;
  key: string;
  route: string;
}

const DEFAULT_SHORTCUTS: SectionShortcut[] = [
  { section: "planner", key: "1", route: "/" },
  { section: "ideas", key: "2", route: "/ideas" },
  { section: "notes", key: "3", route: "/notes" },
  { section: "finance", key: "4", route: "/finance" },
  { section: "work", key: "5", route: "/work" },
  { section: "habits", key: "6", route: "/habits" },
  { section: "family", key: "7", route: "/duodays" },
  { section: "sport", key: "8", route: "/sport" },
  { section: "sleep", key: "9", route: "/sleep" },
  { section: "focusing", key: "0", route: "/focusing" },
];

const STORAGE_KEY = "inmotion_section_shortcuts";

interface SectionShortcutsContextValue {
  shortcuts: SectionShortcut[];
  setShortcuts: (s: SectionShortcut[]) => void;
}

const SectionShortcutsContext = createContext<SectionShortcutsContextValue>({
  shortcuts: DEFAULT_SHORTCUTS,
  setShortcuts: () => {},
});

export function SectionShortcutsProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcutsState] = useState<SectionShortcut[]>(DEFAULT_SHORTCUTS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setShortcutsState(parsed);
      }
    } catch {}
  }, []);

  const setShortcuts = useCallback((s: SectionShortcut[]) => {
    setShortcutsState(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {}
  }, []);

  return (
    <SectionShortcutsContext.Provider value={{ shortcuts, setShortcuts }}>
      {children}
    </SectionShortcutsContext.Provider>
  );
}

export function useSectionShortcuts() {
  return useContext(SectionShortcutsContext);
}

export type { SectionShortcut };
