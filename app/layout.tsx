import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { BoardSidebar } from "@/components/board-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { ModeProvider } from "@/lib/mode-context";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllBoards } from "@/lib/models";
import { mockBoards } from "@/lib/mock-data";
import type { Board } from "@/lib/models";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appName = "On Track";

export const metadata: Metadata = {
  title: appName,
  description: appName,
};

async function getBoards(): Promise<Board[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      return await getAllBoards();
    } catch {
      return mockBoards;
    }
  }
  return mockBoards;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const boards = await getBoards();

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
          <ModeProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-semibold tracking-tight"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  {appName}
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Профиль</span>
                  </Link>
                  <ModeToggle />
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div className="flex flex-1">
              <Suspense
                fallback={
                  <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
                    <div className="border-b px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                        Доски
                      </span>
                    </div>
                  </aside>
                }
              >
                <BoardSidebar initialBoards={boards} />
              </Suspense>
              <main className="flex-1">{children}</main>
            </div>
            <footer className="border-t">
              <div className="container mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} {appName}
              </div>
            </footer>
            <Toaster richColors position="top-right" />
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
