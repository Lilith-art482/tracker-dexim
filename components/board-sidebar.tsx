"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  LayoutDashboard,
  Pencil,
  Trash,
  Search,
  Calendar,
  DollarSign,
  ListChecks,
  Zap,
  Award,
  User,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Board } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSidebar } from "@/lib/sidebar-context";
import { useMode } from "@/lib/mode-context";
import { useTheme } from "next-themes";
import { useNotifications } from "@/lib/notification-context";

interface BoardSidebarProps {
  initialBoards?: Board[];
}

const NAV_ITEMS = [
  { id: "planner", label: "Планнер", icon: Calendar },
  { id: "finance", label: "Финансы", icon: DollarSign },
  { id: "habits", label: "Привычки", icon: ListChecks },
  { id: "sport", label: "Спорт", icon: Zap },
  { id: "challenges", label: "Челленджи", icon: Award },
] as const;

export function BoardSidebar({ initialBoards = [] }: BoardSidebarProps) {
  const { collapsed } = useSidebar();
  const { mode, setMode } = useMode();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editingBoardName, setEditingBoardName] = useState("");
  const [loading, setLoading] = useState(false);
  const [boardsOpen, setBoardsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const activeBoardId = searchParams.get("boardId");

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const url = uid ? `/api/boards?uid=${uid}` : "/api/boards";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
    const uid = auth.currentUser?.uid;
    if (uid && !searchParams.has("uid")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("uid", uid);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [fetchBoards, searchParams, pathname, router]);

  const switchBoard = (boardId: string) => {
    setMode("team");
    const params = new URLSearchParams(searchParams.toString());
    params.set("boardId", boardId);
    const uid = auth.currentUser?.uid;
    if (uid) params.set("uid", uid);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePlanner = () => {
    setMode("personal");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("boardId");
    const uid = auth.currentUser?.uid;
    if (uid) params.set("uid", uid);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNavClick = (id: string) => {
    if (id === "planner") {
      handlePlanner();
      return;
    }
    toast.info("Страница в разработке");
  };

  const handleCreate = async () => {
    const name = newBoardName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const ownerId = auth.currentUser?.uid || null;
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerId }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка создания доски");
        return;
      }

      const newBoard: Board = await res.json();
      setBoards((prev) => [...prev, newBoard]);
      setDialogOpen(false);
      setNewBoardName("");
      toast.success("Доска создана");
      switchBoard(newBoard.id);
    } catch {
      toast.error("Ошибка создания доски");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (board: Board) => {
    setEditingBoardId(board.id);
    setEditingBoardName(board.name);
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingBoardId) return;
    const name = editingBoardName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/boards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingBoardId, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка обновления доски");
        return;
      }
      const updated: Board = await res.json();
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBoardId(null);
      setEditingBoardName("");
      setDialogOpen(false);
      toast.success("Доска обновлена");
    } catch {
      toast.error("Ошибка обновления доски");
    }
  };

  const handleDelete = async (boardId: string) => {
    if (!confirm("Удалить доску? Это действие необратимо.")) return;
    try {
      const res = await fetch("/api/boards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: boardId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка удаления доски");
        return;
      }
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success("Доска удалена");
      if (activeBoardId === boardId) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("boardId");
        router.push(`${pathname}?${params.toString()}`);
      }
    } catch {
      toast.error("Ошибка удаления доски");
    }
  };

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-0 overflow-hidden border-0" : "w-60"
      )}
    >
      {/* Search */}
      <div
        className={cn(
          "px-3 pt-3 pb-2 transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/40" />
          <input
            type="search"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-lg border border-border/40 bg-sidebar-accent/30 pl-8 pr-3 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Nav items */}
      <nav
        className={cn(
          "px-2 pb-1 transition-opacity duration-300",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              id === "planner" && mode === "personal"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div
        className={cn(
          "mx-3 border-t border-border/30 transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      />

      {/* Boards header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <button
          onClick={() => setBoardsOpen(!boardsOpen)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60"
        >
          {boardsOpen ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          Доски
        </button>

        <div className="ml-auto flex items-center gap-1">
          {loading && (
            <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/40" />
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" variant="ghost" className="gap-2 h-6 w-6 p-0" />}>
              <Plus className="h-3.5 w-3.5" />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBoardId ? "Редактировать доску" : "Новая доска"}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Название доски"
                  value={editingBoardId ? editingBoardName : newBoardName}
                  onChange={(e) => {
                    if (editingBoardId) setEditingBoardName(e.target.value);
                    else setNewBoardName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (editingBoardId ? handleUpdate() : handleCreate());
                  }}
                  autoFocus
                />
                <Button
                  onClick={() => (editingBoardId ? handleUpdate() : handleCreate())}
                  disabled={creating || (!newBoardName.trim() && !editingBoardName.trim())}
                >
                  {(creating || false) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingBoardId ? "Сохранить" : "Создать"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Boards list */}
      {boardsOpen && (
        <nav
          className={cn(
            "flex-1 space-y-0.5 overflow-y-auto px-2 transition-opacity duration-300",
            collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          {boards.map((board) => (
            <div key={board.id} className="flex items-center gap-2">
              <button
                onClick={() => switchBoard(board.id)}
                className={cn(
                  "flex-1 text-left text-sm rounded-lg px-3 py-2 transition-colors",
                  activeBoardId === board.id ||
                    (!activeBoardId && boards[0]?.id === board.id)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <span className="truncate">{board.name}</span>
              </button>
              <button
                onClick={() => startEdit(board)}
                className="p-1 rounded hover:bg-muted/20 shrink-0"
                title="Редактировать"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(board.id)}
                className="p-1 rounded hover:bg-muted/20 shrink-0"
                title="Удалить"
              >
                <Trash className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ))}
        </nav>
      )}

      {!boardsOpen && (
        <div
          className={cn(
            "flex-1 transition-opacity duration-300",
            collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        />
      )}

      {/* Bottom actions */}
      <div
        className={cn(
          "border-t border-border/30 p-2 transition-opacity duration-300",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="flex items-center justify-around">
          <button
            onClick={() => router.push("/profile")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            title="Профиль"
          >
            <User className="h-4 w-4" />
          </button>

          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            title="Уведомления"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>
      </div>
    </aside>
  );
}
