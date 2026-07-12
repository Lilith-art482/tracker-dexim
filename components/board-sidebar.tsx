"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ChevronLeft,
  LayoutGrid,
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

const BOARD_COLORS = [
  { dot: "bg-blue-500", bg: "bg-blue-500/10", ring: "ring-blue-500/30" },
  { dot: "bg-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
  { dot: "bg-violet-500", bg: "bg-violet-500/10", ring: "ring-violet-500/30" },
  { dot: "bg-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/30" },
  { dot: "bg-rose-500", bg: "bg-rose-500/10", ring: "ring-rose-500/30" },
  { dot: "bg-cyan-500", bg: "bg-cyan-500/10", ring: "ring-cyan-500/30" },
  { dot: "bg-pink-500", bg: "bg-pink-500/10", ring: "ring-pink-500/30" },
  { dot: "bg-indigo-500", bg: "bg-indigo-500/10", ring: "ring-indigo-500/30" },
  { dot: "bg-teal-500", bg: "bg-teal-500/10", ring: "ring-teal-500/30" },
  { dot: "bg-orange-500", bg: "bg-orange-500/10", ring: "ring-orange-500/30" },
];

function getBoardColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BOARD_COLORS[Math.abs(hash) % BOARD_COLORS.length];
}

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
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/30">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Проекты</span>
          <div className="ml-auto flex items-center gap-1">
            {loading && (
              <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/30" />
            )}
            <button
              onClick={toggle}
              className="flex lg:hidden h-7 w-7 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2.5">
          <span className="text-[11px] font-medium tracking-wider text-sidebar-foreground/40 uppercase">
            {mode === "team" ? "Командные" : "Личные"}
          </span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <button className="flex h-5 w-5 items-center justify-center rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Plus className="h-3 w-3" />
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

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {filteredBoards.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-accent/50">
                <LayoutGrid className="h-4 w-4 text-sidebar-foreground/30" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-sidebar-foreground/60">
                  {mode === "team"
                    ? "Нет командных досок"
                    : "Нет личных досок"}
                </p>
                <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">
                  Создайте новую доску
                </p>
              </div>
            </div>
          ) : (
            filteredBoards.map((board) => {
              const isActive =
                activeBoardId === board.id ||
                (!activeBoardId && boards[0]?.id === board.id);
              const color = getBoardColor(board.id);
              return (
                <div
                  key={board.id}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-150 cursor-pointer",
                    isActive
                      ? `${color.bg} ${color.ring} ring-1`
                      : "hover:bg-sidebar-accent/40",
                  )}
                  onClick={() => switchBoard(board.id)}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white transition-all duration-150",
                      color.dot,
                      isActive && "scale-105",
                    )}
                  >
                    {board.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={cn(
                      "flex-1 truncate text-sm transition-all duration-150",
                      isActive
                        ? "font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/65 group-hover:text-sidebar-foreground/90",
                    )}
                  >
                    {board.name}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(board);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(board.id);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </aside>
    </>
  );
}
