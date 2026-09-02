import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/lib/language-context";
import { BridgeProvider } from "@/components/bridge-provider";
import { MenuModeProvider } from "@/lib/menu-mode-context";
import { AiChatProvider } from "@/lib/ai-chat-context";
import { SettingsPanelProvider } from "@/lib/settings-panel-context";
import { SectionVisibilityProvider } from "@/lib/section-visibility-context";
import { SectionShortcutsProvider } from "@/lib/section-shortcuts-context";
import AppShell from "@/components/app-shell";

const appName = "In Motion";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

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
      className={cn("font-sans", syne.variable)}
    >
      <body className="antialiased min-h-screen bg-background flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BridgeProvider />
          <MenuModeProvider>
          <AiChatProvider>
            <SettingsPanelProvider>
              <SectionVisibilityProvider>
                <SectionShortcutsProvider>
                  <LanguageProvider>
                    <AppShell>{children}</AppShell>
                  </LanguageProvider>
                </SectionShortcutsProvider>
              </SectionVisibilityProvider>
            </SettingsPanelProvider>
          </AiChatProvider>
          </MenuModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
