"use client";

import Link from "next/link";
import {
  Calendar,
  DollarSign,
  ListChecks,
  User,
  Settings,
  Bot,
  FileText,
  Dumbbell,
  Briefcase,
  Focus,
  Heart,
  Moon,
  Lightbulb,
} from "lucide-react";
import { useMode } from "@/lib/mode-context";
import { useLanguage } from "@/lib/language-context";
import { useAiChat } from "@/lib/ai-chat-context";
import { useSettingsPanel } from "@/lib/settings-panel-context";
import { useSectionVisibility } from "@/lib/section-visibility-context";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

const NAV_ITEM_IDS = [
  { id: "planner", icon: Calendar },
  { id: "ideas", icon: Lightbulb },
  { id: "notes", icon: FileText },
  { id: "finance", icon: DollarSign },
  { id: "work", icon: Briefcase },
  { id: "habits", icon: ListChecks },
  { id: "duodays", icon: Heart },
  { id: "sport", icon: Dumbbell },
  { id: "sleep", icon: Moon },
  { id: "focusing", icon: Focus },
] as const;

const ROUTE_MAP: Record<string, string> = {
  planner: "/",
  ideas: "/ideas",
  notes: "/notes",
  finance: "/finance",
  work: "/work",
  habits: "/habits",
  duodays: "/duodays",
  sport: "/sport",
  sleep: "/sleep",
  focusing: "/focusing",
};

export function HeaderNav() {
  const { setMode } = useMode();
  const { t } = useLanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSectionVisible } = useSectionVisibility();

  return (
    <div
      className="flex items-center flex-1 overflow-x-auto scrollbar-none gap-0.5"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black 12px, black 90%, transparent 100%)",
      }}
    >
      {NAV_ITEM_IDS.filter(({ id }) => isSectionVisible(id)).map(({ id, icon: Icon }) => {
        const label = t(id);
        const isActive =
          (id === "planner" && pathname === "/") ||
          (id === "ideas" && pathname.startsWith("/ideas")) ||
          (id === "finance" && pathname.startsWith("/finance")) ||
          (id === "habits" && pathname.startsWith("/habits")) ||
          (id === "duodays" && pathname.startsWith("/duodays")) ||
          (id === "notes" && pathname.startsWith("/notes")) ||
          (id === "sport" && pathname.startsWith("/sport")) ||
          (id === "sleep" && pathname.startsWith("/sleep")) ||
          (id === "work" && pathname.startsWith("/work")) ||
          (id === "focusing" && pathname.startsWith("/focusing"));

        const route = ROUTE_MAP[id];

        if (id === "planner") {
          return (
            <button
              key={id}
              onClick={() => {
                setMode("personal");
                const params = new URLSearchParams(searchParams.toString());
                params.delete("boardId");
                window.location.href = `/?${params.toString()}`;
              }}
              className={cn(
                "relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all shrink-0 whitespace-nowrap",
                isActive
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40",
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        }

        return (
          <Link
            key={id}
            href={route}
            prefetch={true}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-all shrink-0 whitespace-nowrap",
              isActive
                ? "text-primary bg-primary/10 shadow-sm"
                : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function HeaderActions() {
  const { setOpen: setChatOpen } = useAiChat();
  const { setOpen: setSettingsOpen } = useSettingsPanel();

  return (
    <>
      <button
        onClick={() => setChatOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors relative"
        title="AI-помощник"
      >
        <Bot className="h-4 w-4" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
      </button>

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <Settings className="h-4 w-4" />
      </button>

      <Link
        href="/profile"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <User className="h-4 w-4" />
      </Link>
    </>
  );
}
