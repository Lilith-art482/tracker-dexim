"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Trash,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  ListChecks,
  Zap,
  Award,
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

interface BoardSidebarProps {
  initialBoards?: Board[];
}

export function BoardSidebar({ initialBoards = [] }: BoardSidebarProps) {
  const { collapsed, toggle } = useSidebar();
  const { mode, setMode } = useMode();
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

  const activeBoardId = searchParams.get("boardId");

  const filteredBoards = boards.filter((b) => b.type === mode);

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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchBoards();
      }
    });
    fetchBoards();
    const uid = auth.currentUser?.uid;
    if (uid && !searchParams.has("uid")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("uid", uid);
      router.replace(`${pathname}?${params.toString()}`);
    }
    return () => unsubscribe();
  }, [fetchBoards, searchParams, pathname, router]);

  const switchBoard = (boardId: string) => {
    const board = boards.find((b) => b.id === boardId);
    if (board) {
      setMode(board.type);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("boardId", boardId);
    const uid = auth.currentUser?.uid;
    if (uid) params.set("uid", uid);
    router.push(`${pathname}?${params.toString()}`);
    // Close sidebar on mobile after selecting a board
    if (window.innerWidth < 1024) toggle();
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
        body: JSON.stringify({ name, ownerId, type: mode }),
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
    <>
      {/* Backdrop for mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={toggle}
        />
      )}
      <aside
        className={cn(
          // Mobile: fixed overlay that slides in/out
          "fixed inset-y-0 left-0 z-40 shrink-0 flex flex-col w-72 border-r bg-sidebar transition-transform duration-300 pt-14 lg:pt-0",
          collapsed ? "-translate-x-full" : "translate-x-0",
          // Desktop: static position, collapse with width
          "lg:static lg:z-auto lg:transition-all lg:duration-300",
          collapsed
            ? "lg:w-0 lg:overflow-hidden lg:border-0 lg:-translate-x-0"
            : "lg:w-60 lg:-translate-x-0",
        )}
      >
        {/* Mobile navigation */}
        <div className="lg:hidden border-b border-border/40 px-3 py-2">
          <div className="flex flex-col gap-0.5">
            <span className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Навигация
            </span>
            <MobileNavLinks
              collapsed={collapsed}
              onNavClick={() => {
                if (window.innerWidth < 1024) toggle();
              }}
            />
          </div>
        </div>

        {/* Boards header */}
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 transition-opacity duration-300",
            collapsed ? "opacity-0" : "opacity-100",
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
            <button
              onClick={toggle}
              className="flex lg:hidden h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {loading && (
              <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/40" />
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                <Button size="sm" variant="ghost" className="gap-2 h-6 w-6 p-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingBoardId ? "Редактировать доску" : "Новая доска"}
                  </DialogTitle>
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
                      if (e.key === "Enter")
                        editingBoardId ? handleUpdate() : handleCreate();
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={() =>
                      editingBoardId ? handleUpdate() : handleCreate()
                    }
                    disabled={
                      creating ||
                      (!newBoardName.trim() && !editingBoardName.trim())
                    }
                  >
                    {(creating || false) && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
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
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            {filteredBoards.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                {mode === "team" ? "Нет командных досок" : "Нет личных досок"}
              </div>
            ) : (
              filteredBoards.map((board) => (
                <div key={board.id} className="flex items-center gap-2">
                  <button
                    onClick={() => switchBoard(board.id)}
                    className={cn(
                      "flex-1 text-left text-sm rounded-lg px-3 py-2 transition-colors",
                      activeBoardId === board.id ||
                        (!activeBoardId && boards[0]?.id === board.id)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
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
              ))
            )}
          </nav>
        )}

        {!boardsOpen && (
          <div
            className={cn(
              "flex-1 transition-opacity duration-300",
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          />
        )}
      </aside>
    </>
  );
}

const NAV_ITEMS = [
  { id: "planner", label: "Планнер", icon: Calendar },
  { id: "finance", label: "Финансы", icon: DollarSign },
  { id: "habits", label: "Привычки", icon: ListChecks },
  { id: "sport", label: "Спорт", icon: Zap },
  { id: "challenges", label: "Челленджи", icon: Award },
] as const;

function MobileNavLinks({
  collapsed,
  onNavClick,
}: {
  collapsed: boolean;
  onNavClick: () => void;
}) {
  const { mode, setMode } = useMode();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleNavClick = (id: string) => {
    if (id === "planner") {
      setMode("personal");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("boardId");
      router.push(`/?${params.toString()}`);
      onNavClick();
      return;
    }
    if (id === "finance") {
      router.push("/finance");
      onNavClick();
      return;
    }
    toast.info("Страница в разработке");
    onNavClick();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 transition-opacity duration-300",
        collapsed ? "opacity-0" : "opacity-100",
      )}
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleNavClick(id)}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors w-full text-left",
            (id === "planner" && pathname === "/") ||
              (id === "finance" && pathname.startsWith("/finance"))
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
