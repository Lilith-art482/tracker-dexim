import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "On Track — Вход",
  description: "On Track — Вход",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning className="dark">
      <body className="antialiased min-h-screen dark bg-[#0a0f0d]">
        {children}
      </body>
    </html>
  );
}
