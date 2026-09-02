"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";

export function useAuthUid(): { uid: string; ready: boolean } {
  const [uid, setUid] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUid(user?.uid || "");
      setReady(true);
    });
    return unsubscribe;
  }, []);

  return { uid, ready };
}
