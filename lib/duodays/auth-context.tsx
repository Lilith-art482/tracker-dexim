"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface DuoDaysAuthCtx {
  currentUser: User | null;
  loading: boolean;
}

const DuoDaysAuthContext = createContext<DuoDaysAuthCtx>({
  currentUser: null,
  loading: true,
});

export function useDuoDaysAuth() {
  return useContext(DuoDaysAuthContext);
}

export function DuoDaysAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <DuoDaysAuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </DuoDaysAuthContext.Provider>
  );
}
