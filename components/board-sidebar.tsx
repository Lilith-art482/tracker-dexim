"use client";

import { useState, useEffect } from "react";
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
import { onAuthStateChanged } from "firebase/auth";
import { Board } from "@/lib/models";
import { auth } from "@/lib/firebase";

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

function getColorPref(id: string): string {
  if (typeof window === "undefined") return BOARD_COLORS[0];
  const stored = localStorage.getItem(`board_color_${id}`);
  if (stored) return stored;
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BOARD_COLORS[hash % BOARD_COLORS.length];
}

function setColorPref(id: string, color: string) {
  localStorage.setItem(`board_color_${id}`, color);
}

interface BoardSidebarProps {
  initialBoards?: Board[];
}

export function BoardSidebar({
  initialBoards: _initialBoards = [],
}: BoardSidebarProps) {
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
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userUid, setUserUid] = useState<string | null>(null);

  const activeBoardId = searchParams.get("boardId");
  const boardType = mode === "personal" ? "personal" : "team";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserUid(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userUid) return;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetch(`/api/boards?uid=${userUid}&type=${boardType}`);
        if (res.ok) {
          const data = await res.json();
          setBoards(data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userUid, boardType]);

  useEffect(() => {
    if (userUid && !searchParams.has("uid")) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("uid", userUid);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [userUid, searchParams, pathname, router]);

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
    setCreating(false);
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
      toast.success("Доска создана");
      switchBoard(newBoard.id);
    } catch {
      toast.error("Ошибка создания доски");
    }
  };

  const startEdit = (board: Board) => {
    setEditingId(board.id);
    setEditName(board.name);
    setColorPickerId(null);
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

  const handleColorChange = (boardId: string, color: string) => {
    setColorPref(boardId, color);
    setColorPickerId(null);
  };

  const isActive = (id: string, i: number) =>
    activeBoardId === id || (!activeBoardId && i === 0);

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col border-r bg-sidebar transition-all duration-300 relative overflow-hidden",
        collapsed ? "w-0 border-0" : "w-60",
      )}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #4E6E62 1px, transparent 1px),
            linear-gradient(to bottom, #4E6E62 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      {/* Header with inline create input */}
      <div
        className={cn(
          "flex items-center gap-2.5 px-4 h-12 border-b transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100",
        )}
      >
        {creating ? (
          <div className="flex flex-1 items-center gap-1">
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
              className="h-7 text-sm"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newBoardName.trim()}
              className="p-0.5 rounded hover:bg-sidebar-accent shrink-0"
            >
              <Check className="h-4 w-4 text-emerald-500" />
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewBoardName("");
              }}
              className="p-0.5 rounded hover:bg-sidebar-accent shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/60 shrink-0" />
            <span className="flex-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 truncate">
              {mode === "personal" ? "Личные доски" : "Командные доски"}
            </span>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent transition-colors"
              title="Создать доску"
            >
              <Plus className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
            {loading && (
              <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/40 shrink-0" />
            )}
          </>
        )}
      </div>

      {/* Board list */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-3 transition-opacity duration-300",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100",
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
            const color = getColorPref(board.id);
            const active = isActive(board.id, i);
            const showColorPicker = colorPickerId === board.id;

            return (
              <div key={board.id}>
                {i > 0 && (
                  <div className="mx-3 my-1 border-t border-sidebar-border/30" />
                )}

                <div
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200",
                    active
                      ? "bg-sidebar-accent shadow-sm"
                      : "hover:bg-sidebar-accent/50",
                  )}
                >
                  {/* Color dot with picker */}
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorPickerId(showColorPicker ? null : board.id);
                      }}
                      className={cn(
                        "h-2.5 w-2.5 rounded-full ring-1 ring-black/5 transition-transform hover:scale-125",
                        active &&
                          "ring-2 ring-offset-1 ring-offset-sidebar-accent",
                      )}
                      style={{ backgroundColor: color }}
                      title="Сменить цвет"
                    />

                    {showColorPicker && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setColorPickerId(null)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 z-20 flex gap-1 p-1.5 rounded-lg border bg-popover shadow-lg">
                          {BOARD_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => handleColorChange(board.id, c)}
                              className={cn(
                                "h-5 w-5 rounded-full transition-transform hover:scale-125",
                                color === c &&
                                  "ring-2 ring-primary ring-offset-1 ring-offset-popover",
                              )}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

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
                              : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
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
    </aside>
  );
}
