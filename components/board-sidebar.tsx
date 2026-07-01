"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Loader2, LayoutDashboard } from "lucide-react";
import { Board } from "@/lib/models";
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
  initialBoards: Board[];
}

export function BoardSidebar({ initialBoards }: BoardSidebarProps) {
  const { collapsed } = useSidebar();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const activeBoardId = searchParams.get("boardId");

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/boards");
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
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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

  return (
    <aside
      className={cn(
        "shrink-0 flex flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-0 overflow-hidden border-0" : "w-60"
      )}
    >
      <div className={cn(
        "flex items-center gap-2 border-b px-4 py-3 transition-opacity duration-300",
        collapsed ? "opacity-0" : "opacity-100"
      )}>
        <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/60" />
        <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Доски
        </span>
        {loading && (
          <Loader2 className="ml-auto h-3 w-3 animate-spin text-sidebar-foreground/40" />
        )}
      </div>

      <nav className={cn(
        "flex-1 space-y-0.5 overflow-y-auto p-2 transition-opacity duration-300",
        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => switchBoard(board.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
              activeBoardId === board.id ||
                (!activeBoardId && boards[0]?.id === board.id)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <span className="truncate">{board.name}</span>
          </button>
        ))}
      </nav>

      <div className={cn(
        "border-t p-2 transition-opacity duration-300",
        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button variant="outline" className="w-full gap-2" />}
          >
            <Plus className="h-4 w-4" />
            Новая доска
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая доска</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Название доски"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                autoFocus
              />
              <Button
                onClick={handleCreate}
                disabled={creating || !newBoardName.trim()}
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
