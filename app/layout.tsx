import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { BoardSidebar } from "@/components/board-sidebar";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { ModeProvider } from "@/lib/mode-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import { NotificationBell } from "@/components/notification-bell";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const appName = "On Track";

export const metadata: Metadata = {
  title: appName,
  description: appName,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAuthPage = pathname.startsWith("/auth");

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
                    {/* Заголовок и переключатель сайдбара слева */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-base font-semibold tracking-tight">
                        {appName}
                      </span>
                      <div className="h-5 w-px bg-border/50" />
                      <SidebarToggle />
                    </div>

                    {/* Растягиваемся */}
                    <div className="flex-1" />

                    {/* Правая часть */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <NotificationBell />

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
                    <BoardSidebar />
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
