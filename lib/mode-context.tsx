"use client";

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  useState,
  type ReactNode,
} from "react";

export type ViewMode = "team" | "personal" | "work";

interface ModeContextValue {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  dashboardOpen: boolean;
  setDashboardOpen: (open: boolean) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

const STORAGE_KEY = "viewMode";

function getSnapshot(): ViewMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "team" || stored === "personal" || stored === "work")
      return stored;
  } catch {}
  return "team";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerSnapshot(): ViewMode {
  return "team";
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const setMode = useCallback((newMode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, newMode);
    window.dispatchEvent(new Event("storage"));
  }, []);

  return (
    <ModeContext.Provider
      value={{ mode, setMode, dashboardOpen, setDashboardOpen }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return ctx;
}
