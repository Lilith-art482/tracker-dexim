"use client";

import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";

export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
      aria-label={collapsed ? "Показать доски" : "Скрыть доски"}
    >
      {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
    </button>
  );
}
