"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface AiChatContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const AiChatContext = createContext<AiChatContextValue>({ open: false, setOpen: () => {} });

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <AiChatContext.Provider value={{ open, setOpen }}>
      {children}
    </AiChatContext.Provider>
  );
}

export function useAiChat() {
  return useContext(AiChatContext);
}
