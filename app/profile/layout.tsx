import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Профиль - On Track",
  description: "On Track",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
