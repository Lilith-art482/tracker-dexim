"use client";

import { auth } from "@/lib/firebase";

let patched = false;

export function patchFetch() {
  if (patched || typeof window === "undefined") return;
  patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    const isApi = url.startsWith("/api/") || url.includes("/api/");

    if (!isApi) {
      return originalFetch(input, init);
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      return originalFetch(input, init);
    }

    let token: string;
    try {
      token = await currentUser.getIdToken();
    } catch {
      return originalFetch(input, init);
    }

    const headers = new Headers(init?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return originalFetch(input, { ...init, headers });
  };
}
