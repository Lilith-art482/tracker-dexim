"use client";

import { Menu, X } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";

export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-all"
      aria-label={collapsed ? "Показать доски" : "Скрыть доски"}
    >
      {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
    </button>
  );
}
