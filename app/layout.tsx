import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { BridgeProvider } from "@/components/bridge-provider";
import { Toaster } from "@/components/ui/sonner";
import { BoardSidebar } from "@/components/board-sidebar";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { HeaderNav, HeaderActions } from "@/components/header-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { ModeProvider } from "@/lib/mode-context";
import { SidebarProvider } from "@/lib/sidebar-context";

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
                  <div className="flex h-14 items-center px-2 sm:px-4 gap-1 sm:gap-3">
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                      <SidebarToggle />
                      <span className="text-sm sm:text-base font-semibold tracking-tight">
                        {appName}
                      </span>
                      <div className="hidden sm:block h-5 w-px bg-border/50" />
                    </div>

                    <div className="hidden sm:block flex-1">
                      <HeaderNav />
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
                      <ModeToggle />
                      <HeaderActions />
                    </div>
                  </div>
                </header>

                <div className="flex flex-1">
                  <Suspense
                    fallback={
                      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r bg-sidebar">
                        <div className="border-b px-4 py-3">
                          <span className="text-xs font-semibold tracking-wider text-sidebar-foreground/60">
                            Доски
                          </span>
                        </div>
                      </aside>
                    }
                  >
                    <BoardSidebar />
                  </Suspense>
                  <main className="flex-1 min-w-0 pb-4 sm:pb-0">
                    {children}
                  </main>
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
