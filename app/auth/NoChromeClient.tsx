"use client";

import { useEffect } from "react";

export default function NoChromeClient() {
  useEffect(() => {
    document.body.classList.add("no-chrome");
    return () => document.body.classList.remove("no-chrome");
  }, []);

  return null;
}
