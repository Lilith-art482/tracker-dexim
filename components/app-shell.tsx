"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { BoardSidebar } from "@/components/board-sidebar";
import OnboardingModal from "@/components/onboarding-modal";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { HeaderNav, HeaderActions } from "@/components/header-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { ModeProvider } from "@/lib/mode-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import { AudioProvider } from "@/lib/audio-context";
import { Toaster } from "@/components/ui/sonner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  if (isAuthPage) return <>{children}</>;

  return (
    <ModeProvider>
      <SidebarProvider>
        <AudioProvider>
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-2 sm:px-4 gap-1 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                <SidebarToggle />
                <Image
                  src="/logo.png"
                  alt="In Motion"
                  width={96}
                  height={28}
                  className="h-6 w-auto object-contain"
                  priority
                />
                <span className="hidden sm:inline text-sm font-semibold text-foreground">
                  In Motion
                </span>
                <div className="hidden sm:block h-5 w-px bg-border/50" />
              </div>

              <div className="hidden sm:block flex-1">
                <Suspense fallback={null}>
                  <HeaderNav />
                </Suspense>
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
            <main className="flex-1 min-w-0 pb-4 sm:pb-0">{children}</main>
          </div>

          <Toaster richColors position="top-right" />
          <OnboardingModal />
        </AudioProvider>
      </SidebarProvider>
    </ModeProvider>
  );
}
