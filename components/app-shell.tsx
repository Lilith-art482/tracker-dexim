"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { BoardSidebar } from "@/components/board-sidebar";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { HeaderNav, HeaderActions } from "@/components/header-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { ModeProvider } from "@/lib/mode-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import { AudioProvider } from "@/lib/audio-context";
import { CircularNavTrigger } from "@/components/circular-nav-trigger";
import { useAiChat } from "@/lib/ai-chat-context";
import { useSettingsPanel } from "@/lib/settings-panel-context";

const AiChat = dynamic(() => import("@/components/ai-chat"), { ssr: false });
const SettingsPanel = dynamic(() => import("@/components/settings-panel").then(m => ({ default: m.SettingsPanel })), { ssr: false });
const BottomInfoBar = dynamic(() => import("@/components/bottom-info-bar").then(m => ({ default: m.BottomInfoBar })), { ssr: false });
const OnboardingModal = dynamic(() => import("@/components/onboarding-modal"), { ssr: false });
const SectionShortcutHandler = dynamic(() => import("@/components/section-shortcut-handler").then(m => ({ default: m.SectionShortcutHandler })), { ssr: false });

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open: aiChatOpen, setOpen: setAiChatOpen } = useAiChat();
  const { setOpen: setSettingsOpen } = useSettingsPanel();
  const isAuthPage = pathname.startsWith("/auth");
  const isAboutPage = pathname.startsWith("/about");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  // While auth state is loading, show nothing for the landing page
  const isLandingPage = pathname === "/";

  if (isAuthPage) return <>{children}</>;

  // Landing page: no shell for unauthenticated; full shell for authenticated
  if (isLandingPage && !isAuthenticated) return <>{children}</>;

  // About page: no shell for unauthenticated users
  if (isAboutPage && !isAuthenticated) return <>{children}</>;

  // Auth still loading — show minimal loader
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated on other pages — redirect-like minimal render
  if (!isAuthenticated) return <>{children}</>;

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
            {!isAboutPage && (
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
            )}
            <main className="flex-1 min-w-0 pb-16 flex flex-col mx-auto w-full max-w-[1900px]">
              {children}
            </main>
          </div>

          <BottomInfoBar />

          <CircularNavTrigger onOpenAi={() => setAiChatOpen(true)} onOpenSettings={() => setSettingsOpen(true)} />

          <AiChat open={aiChatOpen} onClose={() => setAiChatOpen(false)} />
          <SettingsPanel />

          <OnboardingModal />
          <SectionShortcutHandler />
        </AudioProvider>
      </SidebarProvider>
    </ModeProvider>
  );
}
