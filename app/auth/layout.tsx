import type { Metadata } from "next";
import "../globals.css";
import NoChromeClient from "./NoChromeClient";

export const metadata: Metadata = {
  title: "In Motion — Вход",
  description: "In Motion — Вход",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased min-h-screen bg-background">
      <NoChromeClient />
      {children}
    </div>
  );
}
