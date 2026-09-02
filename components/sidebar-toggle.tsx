"use client";

import { Menu, PanelLeftClose } from "lucide-react";
import { useSidebar } from "@/lib/sidebar-context";
import { usePathname } from "next/navigation";

export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  if (pathname !== "/" && !pathname.startsWith("/work")) {
    return null;
  }

  return (
    <button
      onClick={toggle}
      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
      aria-label={collapsed ? "Меню" : "Закрыть меню"}
    >
      {collapsed ? (
        <Menu className="h-4.5 w-4.5" />
      ) : (
        <PanelLeftClose className="h-4.5 w-4.5" />
      )}
    </button>
  );
}
