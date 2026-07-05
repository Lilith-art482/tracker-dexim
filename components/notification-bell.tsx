"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/lib/notification-context";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const {
    notifications,
    dismissNotification,
    clearAllNotifications,
    unreadCount,
  } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (open) clearAllNotifications();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, clearAllNotifications]);

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 min-w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 sm:right-0 top-full mt-2 w-72 sm:w-80 rounded-lg border bg-popover shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-sm:fixed max-sm:inset-x-2 max-sm:max-w-[calc(100vw-16px)]">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm font-semibold">Уведомления</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">
                    {unreadCount} новых
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      clearAllNotifications();
                      setOpen(false);
                    }}
                    aria-label="Прочитать все"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Нет уведомлений
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = icons[n.type];
                return (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 text-sm border-b last:border-0 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => dismissNotification(n.id)}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 mt-0.5 shrink-0",
                        n.type === "success" && "text-emerald-500",
                        n.type === "error" && "text-destructive",
                        n.type === "info" && "text-primary",
                      )}
                    />
                    <span className="flex-1">{n.message}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(n.id);
                      }}
                      className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
