import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { User, Search, Plus } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { BoardSidebar } from "@/components/board-sidebar";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModeToggle } from "@/components/mode-toggle";
import { ModeProvider } from "@/lib/mode-context";
import { SidebarProvider } from "@/lib/sidebar-context";
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
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuthPage = pathname.startsWith("/auth");
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
          {isAuthPage ? (
            children
          ) : (
            <ModeProvider>
              <SidebarProvider>
                <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex h-14 items-center px-4 gap-3">
                    {/* Логотип */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Plus className="h-4 w-4" />
                      </div>
                      <span className="text-base font-semibold tracking-tight">
                        {appName}
                      </span>
                    </div>

                    {/* Разделитель */}
                    <div className="h-5 w-px bg-border/50" />

                    {/* Кнопка переключения сайдбара */}
                    <SidebarToggle />

                    {/* Поиск */}
                    <div className="flex-1 max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                        <input
                          type="search"
                          placeholder="Поиск задач..."
                          className="h-8 w-full rounded-lg border border-border/40 bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Правая часть */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Создать</span>
                      </button>

                      <ModeToggle />

                      <div className="h-5 w-px bg-border/50 mx-1" />

                      <Link
                        href="/profile"
                        className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="hidden sm:inline text-sm font-medium">
                          Профиль
                        </span>
                      </Link>

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

                <Toaster richColors position="top-right" />
              </SidebarProvider>
            </ModeProvider>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
