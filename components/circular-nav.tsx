"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  BookOpen,
  DollarSign,
  FolderKanban,
  Heart,
  Users,
  Dumbbell,
  BedDouble,
  Timer,
  Bot,
  User,
  Settings,
  X,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSectionVisibility } from "@/lib/section-visibility-context";

const NAV_ITEMS = [
  { label: "Планинер", icon: Calendar, href: "/planner" },
  { label: "Идея", icon: Lightbulb, href: "/ideas" },
  { label: "Заметки", icon: BookOpen, href: "/notes" },
  {label: "Финансы", icon: DollarSign, href: "/finance" },
  { label: "Работа", icon: FolderKanban, href: "/work" },
  { label: "Привычки", icon: Heart, href: "/habits" },
  { label: "Семья", icon: Users, href: "/family" },
  { label: "Спорт", icon: Dumbbell, href: "/sport" },
  { label: "Сон", icon: BedDouble, href: "/sleep" },
  { label: "Фокус", icon: Timer, href: "/focusing" },
  { label: "AI", icon: Bot, href: "__ai__" },
  { label: "Профиль", icon: User, href: "/profile" },
  { label: "Настройки", icon: Settings, href: "/settings" },
];

interface CircularNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAi?: () => void;
  onOpenSettings?: () => void;
}

export function CircularNav({ isOpen, onClose, onOpenAi, onOpenSettings }: CircularNavProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isSectionVisible } = useSectionVisibility();

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    const sectionId = item.href.replace("/", "");
    return isSectionVisible(sectionId);
  });

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const radius = 210;
  const startAngle = -90;
  const angleStep = 360 / visibleNavItems.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-400",
          mounted ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <div className="relative z-10 w-[480px] h-[480px] sm:w-[520px] sm:h-[520px]">
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 transition-all duration-500",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-75",
          )}
          style={{ width: radius * 2 + 48, height: radius * 2 + 48 }}
        />

        {visibleNavItems.map((item, i) => {
          const angle = ((startAngle + angleStep * i) * Math.PI) / 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isActive = item.href !== "__ai__" && pathname === item.href;
          const delay = 30 + i * 30;

          const content = (
            <>
              <div
                className={cn(
                  "w-[62px] h-[62px] sm:w-[66px] sm:h-[66px] rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm",
                  isActive
                    ? "bg-white/10 border border-primary/70 text-white/80"
                    : "bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 hover:text-white hover:border-white/30 hover:scale-105",
                )}
              >
                <item.icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-medium whitespace-nowrap tracking-wide",
                  "text-white/70",
                )}
              >
                {item.label}
              </span>
            </>
          );

          const wrapperClass = cn(
            "absolute flex flex-col items-center gap-1.5 transition-all duration-400",
            mounted ? "opacity-100 translate-x-0 translate-y-0" : "opacity-0 translate-x-2 translate-y-2",
          );
          const style = {
            left: `calc(50% + ${x}px - 31px)`,
            top: `calc(50% + ${y}px - 31px)`,
            transitionDelay: `${delay}ms`,
          };

          if (item.href === "__ai__") {
            return (
              <button
                key="ai"
                onClick={() => { onOpenAi?.(); onClose(); }}
                className={wrapperClass}
                style={style}
              >
                {content}
              </button>
            );
          }

          if (item.href === "/settings") {
            return (
              <button
                key={item.href}
                onClick={() => { onOpenSettings?.(); onClose(); }}
                className={wrapperClass}
                style={style}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={wrapperClass}
              style={style}
            >
              {content}
            </Link>
          );
        })}

        <button
          onClick={onClose}
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-400 hover:bg-white/20 hover:scale-110 group",
            mounted ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
          style={{ transitionDelay: "20ms" }}
        >
          <X className="h-6 w-6 text-white/70 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
