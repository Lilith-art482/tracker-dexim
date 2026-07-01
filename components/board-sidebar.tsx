"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  LayoutDashboard,
  Pencil,
  Trash2,
  Check,
  X,
  Palette,
} from "lucide-react";
import { Board } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSidebar } from "@/lib/sidebar-context";
import { useMode } from "@/lib/mode-context";

const BOARD_COLORS = [
  "#4E6E62",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#14B8A6",
];

function getBoardColor(id: string, _index: number): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BOARD_COLORS[hash % BOARD_COLORS.length];
}

interface BoardSidebarProps {
  initialBoards?: Board[];
}

export function BoardSidebar({ initialBoards: _initialBoards = [] }: BoardSidebarProps) {
  const { collapsed } = useSidebar();
  const { mode } = useMode();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [boards, setBoards] = useState<Board[]>([]);
  const [creating, setCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeBoardId = searchParams.get("boardId");
  const boardType = mode === "personal" ? "personal" : "team";

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      const url = uid ? `/api/boards?uid=${uid}&type=${boardType}` : "/api/boards";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBoards(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [boardType]);

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
    const params = new URLSearchParams();
    params.set("boardId", boardId);
    const uid = auth.currentUser?.uid;
    if (uid) params.set("uid", uid);
    router.push(`/?${params.toString()}`);
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
      setNewBoardName("");
      setCreating(false);
      toast.success("Доска создана");
      switchBoard(newBoard.id);
    } catch {
      toast.error("Ошибка создания доски");
      setCreating(false);
    }
  };

  const startEdit = (board: Board) => {
    setEditingId(board.id);
    setEditName(board.name);
  };

  const handleRename = async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch("/api/boards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка переименования");
        return;
      }
      const updated: Board = await res.json();
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingId(null);
      toast.success("Доска переименована");
    } catch {
      toast.error("Ошибка переименования");
    }
  };

  const handleDelete = async (boardId: string) => {
    setDeletingId(boardId);
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
        const params = new URLSearchParams();
        const uid = auth.currentUser?.uid;
        if (uid) params.set("uid", uid);
        router.push(`/?${params.toString()}`);
      }
    } catch {
      toast.error("Ошибка удаления доски");
    } finally {
      setDeletingId(null);
    }
  };

  const isActive = (id: string, i: number) =>
    activeBoardId === id || (!activeBoardId && i === 0);

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-0 overflow-hidden border-0" : "w-60"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 h-12 border-b transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/60" />
        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          {mode === "personal" ? "Личные доски" : "Командные доски"}
        </span>
        {loading && (
          <Loader2 className="ml-auto h-3 w-3 animate-spin text-sidebar-foreground/40" />
        )}
      </div>

      {/* Board list */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-3 transition-opacity duration-300",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="flex flex-col gap-1 px-2">
          {boards.length === 0 && !loading && (
            <div className="px-3 py-8 text-center">
              <Palette className="h-8 w-8 mx-auto mb-2 text-sidebar-foreground/20" />
              <p className="text-xs text-sidebar-foreground/40">
                {mode === "personal"
                  ? "Создайте первую личную доску"
                  : "Командные доски пока не созданы"}
              </p>
            </div>
          )}

          {boards.map((board, i) => {
            const color = getBoardColor(board.id, i);
            const active = isActive(board.id, i);

            return (
              <div key={board.id}>
                {i > 0 && <div className="mx-3 my-1 border-t border-sidebar-border/30" />}

                <div
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200",
                    active
                      ? "bg-sidebar-accent shadow-sm"
                      : "hover:bg-sidebar-accent/50"
                  )}
                >
                  {/* Color dot */}
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-black/5",
                      active && "ring-2 ring-offset-1 ring-offset-sidebar-accent"
                    )}
                    style={{ backgroundColor: color }}
                  />

                  {editingId === board.id ? (
                    <div className="flex flex-1 items-center gap-1 min-w-0">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={handleRename}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={handleRename}
                        className="p-0.5 rounded hover:bg-sidebar-accent shrink-0"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-0.5 rounded hover:bg-sidebar-accent shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => switchBoard(board.id)}
                        className="flex-1 text-left truncate"
                      >
                        <span
                          className={cn(
                            "text-sm transition-colors",
                            active
                              ? "font-semibold text-sidebar-foreground"
                              : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                          )}
                        >
                          {board.name}
                        </span>
                      </button>

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(board)}
                          className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent"
                          title="Переименовать"
                        >
                          <Pencil className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                        </button>
                        <button
                          onClick={() => {
                            toast("Удалить доску?", {
                              action: {
                                label: "Удалить",
                                onClick: () => handleDelete(board.id),
                              },
                              cancel: {
                                label: "Отмена",
                                onClick: () => {},
                              },
                            });
                          }}
                          disabled={deletingId === board.id}
                          className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent"
                          title="Удалить"
                        >
                          {deletingId === board.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive/50 hover:text-destructive" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Create button at bottom */}
      <div
        className={cn(
          "border-t p-3 transition-opacity duration-300",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {creating ? (
          <div className="flex items-center gap-1">
            <Input
              placeholder="Название доски"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewBoardName("");
                }
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCreate}
              disabled={!newBoardName.trim()}
              className="h-8 w-8 shrink-0"
            >
              <Check className="h-4 w-4 text-emerald-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setNewBoardName("");
              }}
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2 shadow-sm"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" />
            Создать доску
          </Button>
        )}
      </div>
    </aside>
  );
}
