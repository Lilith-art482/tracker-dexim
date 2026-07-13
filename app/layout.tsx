import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { BridgeProvider } from "@/components/bridge-provider";
import AppShell from "@/components/app-shell";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appName = "In Motion";

export const metadata: Metadata = {
  title: appName,
  description: appName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BridgeProvider />
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
