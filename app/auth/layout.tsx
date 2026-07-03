import type { Metadata } from "next";
import "../globals.css";
import NoChromeClient from "./NoChromeClient";

export const metadata: Metadata = {
  title: "On Track — Вход",
  description: "On Track — Вход",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="antialiased min-h-screen dark bg-[#0a0f0d]">
      <NoChromeClient />
      {children}
    </div>
  );
}
