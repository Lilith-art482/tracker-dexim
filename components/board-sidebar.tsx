"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Loader2, LayoutDashboard, Pencil, Trash } from "lucide-react";
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

interface BoardSidebarProps {
  initialBoards?: Board[];
}

export function BoardSidebar({ initialBoards = [] }: BoardSidebarProps) {
  const { collapsed } = useSidebar();
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
  }, [fetchBoards]);

  const switchBoard = (boardId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("boardId", boardId);
    router.push(`${pathname}?${params.toString()}`);
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
      // navigate away if active
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
      <div
        className={cn(
          "flex items-center gap-2 border-b px-4 py-3 transition-opacity duration-300",
          collapsed ? "opacity-0" : "opacity-100"
        )}
      >
        <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/60" />
        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Доски
        </span>

        <div className="ml-auto flex items-center gap-2">
          {loading && (
            <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/40" />
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" variant="ghost" className="gap-2" /> }>
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

      <nav className={cn(
        "flex-1 space-y-0.5 overflow-y-auto p-2 transition-opacity duration-300",
        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
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
              className="p-1 rounded hover:bg-muted/20"
              title="Редактировать"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(board.id)}
              className="p-1 rounded hover:bg-muted/20"
              title="Удалить"
            >
              <Trash className="h-4 w-4 text-destructive" />
            </button>
          </div>
        ))}
      </nav>

      <div className={cn(
        "border-t p-2 transition-opacity duration-300",
        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        {/* Previously the dialog trigger lived here at the bottom; moved to header for visibility */}
        <div className="text-xs text-muted-foreground">&nbsp;</div>
      </div>
    </aside>
  );
}
