"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Trash,
  ChevronDown,
  ChevronLeft,
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

  if (pathname.startsWith("/finance") || pathname.startsWith("/habits")) {
    return null;
  }

  return (
    <>
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={toggle}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 shrink-0 flex flex-col w-60 border-r bg-sidebar transition-transform duration-300",
          collapsed ? "-translate-x-full" : "translate-x-0",
          "lg:static lg:z-auto lg:transition-all lg:duration-300",
          collapsed
            ? "lg:w-0 lg:overflow-hidden lg:border-0 lg:-translate-x-0"
            : "lg:w-60 lg:-translate-x-0",
        )}
      >
        <div className="flex items-center justify-between px-4 h-11 border-b border-border/40">
          <button
            onClick={() => setBoardsOpen(!boardsOpen)}
            className="flex items-center gap-1.5 text-[11px] font-semibold tracking-widest text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                !boardsOpen && "-rotate-90",
              )}
            />
            Доски
          </button>

          <div className="flex items-center gap-0.5">
            {loading && (
              <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/30 mr-0.5" />
            )}
            <button
              onClick={toggle}
              className="flex lg:hidden h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger>
                <button className="flex h-6 w-6 items-center justify-center rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
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

        {boardsOpen && (
          <nav
            className={cn(
              "flex-1 space-y-0.5 overflow-y-auto px-2 pt-2 transition-opacity duration-300",
              collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            {filteredBoards.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent/50">
                  <Plus className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                </div>
                <p className="text-xs text-sidebar-foreground/50 text-center leading-relaxed">
                  {mode === "team"
                    ? "Нет командных досок"
                    : "Нет личных досок"}
                </p>
              </div>
            ) : (
              filteredBoards.map((board) => {
                const isActive =
                  activeBoardId === board.id ||
                  (!activeBoardId && boards[0]?.id === board.id);
                return (
                  <div
                    key={board.id}
                    className={cn(
                      "group relative flex items-center rounded-lg transition-all duration-150",
                      isActive
                        ? "bg-sidebar-accent/80 text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary" />
                    )}
                    <button
                      onClick={() => switchBoard(board.id)}
                      className="flex-1 text-left text-sm px-3 py-2 min-w-0"
                    >
                      <span
                        className={cn(
                          "truncate block",
                          isActive && "font-medium",
                        )}
                      >
                        {board.name}
                      </span>
                    </button>
                    <div className="flex items-center gap-0.5 pr-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150 translate-x-1 group-hover:translate-x-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(board);
                        }}
                        className="p-1 rounded-md hover:bg-sidebar-accent-foreground/10 shrink-0 text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(board.id);
                        }}
                        className="p-1 rounded-md hover:bg-destructive/10 shrink-0 text-sidebar-foreground/40 hover:text-destructive transition-colors"
                        title="Удалить"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
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
