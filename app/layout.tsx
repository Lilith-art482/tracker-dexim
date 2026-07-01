import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Sparkles, User, Bell, Search, Plus, FolderKanban } from "lucide-react";
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
            <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-sm">
              <div className="container mx-auto px-4">
                <div className="h-16 flex items-center justify-between gap-4">
                  {/* Левая часть: Лого + Навигация */}
                  <div className="flex items-center gap-6">
                    <Link
                      href="/"
                      className="flex items-center gap-3 group"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <span className="text-xl font-bold tracking-tight text-foreground">
                        {appName}
                      </span>
                    </Link>
                    
                    <nav className="hidden md:flex items-center gap-1">
                      <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                      >
                        <FolderKanban className="h-4 w-4" />
                        <span>Доски</span>
                      </Link>
                    </nav>
                  </div>

                  {/* Центр: Поиск */}
                  <div className="hidden md:flex flex-1 max-w-md mx-auto">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="search"
                        placeholder="Поиск задач..."
                        className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Правая часть: Действия + Профиль */}
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium rounded-lg hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-300">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Создать</span>
                    </button>
                    
                    <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-all">
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full border-2 border-background"></span>
                    </button>
                    
                    <div className="h-6 w-px bg-border/60 mx-1" />
                    
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border border-primary/20 transition-all duration-300 group"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-foreground">
                        Профиль
                      </span>
                    </Link>
                    
                    <div className="h-6 w-px bg-border/60 mx-1" />
                    
                    <ModeToggle />
                    <ThemeToggle />
                  </div>
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
            <Toaster richColors position="top-right" />
          </ModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
