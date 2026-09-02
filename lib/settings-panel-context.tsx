"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SettingsPanelContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const SettingsPanelContext = createContext<SettingsPanelContextValue>({
  open: false,
  setOpen: () => {},
});

export function SettingsPanelProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SettingsPanelContext.Provider value={{ open, setOpen }}>
      {children}
    </SettingsPanelContext.Provider>
  );
}

export function useSettingsPanel() {
  return useContext(SettingsPanelContext);
}
