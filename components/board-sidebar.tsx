"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ChevronLeft,
  LayoutGrid,
  Pin,
  PinOff,
  GripVertical,
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
import {
  BOARD_ICONS,
  getBoardIcon,
} from "@/lib/board-icons";

const BOARD_COLORS = [
  { name: "blue", dot: "bg-blue-500", bg: "bg-blue-500/10", ring: "ring-blue-500/30" },
  { name: "emerald", dot: "bg-emerald-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/30" },
  { name: "violet", dot: "bg-violet-500", bg: "bg-violet-500/10", ring: "ring-violet-500/30" },
  { name: "amber", dot: "bg-amber-500", bg: "bg-amber-500/10", ring: "ring-amber-500/30" },
  { name: "rose", dot: "bg-rose-500", bg: "bg-rose-500/10", ring: "ring-rose-500/30" },
  { name: "cyan", dot: "bg-cyan-500", bg: "bg-cyan-500/10", ring: "ring-cyan-500/30" },
  { name: "pink", dot: "bg-pink-500", bg: "bg-pink-500/10", ring: "ring-pink-500/30" },
  { name: "indigo", dot: "bg-indigo-500", bg: "bg-indigo-500/10", ring: "ring-indigo-500/30" },
  { name: "teal", dot: "bg-teal-500", bg: "bg-teal-500/10", ring: "ring-teal-500/30" },
  { name: "orange", dot: "bg-orange-500", bg: "bg-orange-500/10", ring: "ring-orange-500/30" },
];

const COLOR_MAP = new Map(BOARD_COLORS.map((c) => [c.name, c]));

function getBoardColor(board: Board) {
  if (board.color && COLOR_MAP.has(board.color)) {
    return COLOR_MAP.get(board.color)!;
  }
  let hash = 0;
  for (let i = 0; i < board.id.length; i++) {
    hash = board.id.charCodeAt(i) + ((hash << 5) - hash);
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
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [settingsBoard, setSettingsBoard] = useState<Board | null>(null);
  const [settingsTab, setSettingsTab] = useState<"general" | "color" | "icon">("general");
  const [loading, setLoading] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const activeBoardId = searchParams.get("boardId");

  const filteredBoards = boards
    .filter((b) => b.type === mode)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (a.order ?? 999) - (b.order ?? 999);
    });

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
    const name = createName.trim();
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
      setCreateName("");
      toast.success("Доска создана");
      switchBoard(newBoard.id);
    } catch {
      toast.error("Ошибка создания доски");
    } finally {
      setCreating(false);
    }
  };

  const updateBoardField = async (boardId: string, data: Partial<Board>) => {
    try {
      const res = await fetch("/api/boards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: boardId, ...data }),
      });
      if (!res.ok) return;
      const updated: Board = await res.json();
      setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (settingsBoard?.id === boardId) {
        setSettingsBoard(updated);
      }
    } catch {
      toast.error("Ошибка обновления");
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
      if (settingsBoard?.id === boardId) setSettingsBoard(null);
    } catch {
      toast.error("Ошибка удаления доски");
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const sorted = [...filteredBoards];
    const dragged = sorted[dragItem.current];
    sorted.splice(dragItem.current, 1);
    sorted.splice(dragOverItem.current, 0, dragged);

    const updated = sorted.map((b, i) => ({ ...b, order: i }));
    setBoards((prev) => {
      const map = new Map(updated.map((b) => [b.id, b]));
      return prev.map((b) => map.get(b.id) ?? b);
    });

    updated.forEach((b) => {
      if (b.order !== boards.find((x) => x.id === b.id)?.order) {
        updateBoardField(b.id, { order: b.order });
      }
    });

    dragItem.current = null;
    dragOverItem.current = null;
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
          <Dialog open={dialogOpen && !settingsBoard} onOpenChange={(o) => { setDialogOpen(o); if (!o) setCreateName(""); }}>
            <DialogTrigger>
              <button className="flex h-5 w-5 items-center justify-center rounded-md text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Новая доска</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Название доски"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  autoFocus
                />
                <Button
                  onClick={handleCreate}
                  disabled={creating || !createName.trim()}
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3 pt-0.5">
          {filteredBoards.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar-accent/50">
                <LayoutGrid className="h-4 w-4 text-sidebar-foreground/30" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-sidebar-foreground/60">
                  {mode === "team" ? "Нет командных досок" : "Нет личных досок"}
                </p>
                <p className="text-[11px] text-sidebar-foreground/40 mt-0.5">
                  Создайте новую доску
                </p>
              </div>
            </div>
          ) : (
            filteredBoards.map((board, index) => {
              const isActive =
                activeBoardId === board.id ||
                (!activeBoardId && filteredBoards[0]?.id === board.id);
              const color = getBoardColor(board);
              const IconComponent = board.icon ? getBoardIcon(board.icon) : null;
              return (
                <div
                  key={board.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => { e.preventDefault(); handleDragOver(index); }}
                  onDrop={handleDrop}
                  onDragEnd={() => { dragItem.current = null; dragOverItem.current = null; }}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-xl px-1.5 py-2 transition-all duration-150 cursor-pointer",
                    isActive
                      ? `${color.bg} ${color.ring} ring-1`
                      : "hover:bg-sidebar-accent/40",
                  )}
                  onClick={() => switchBoard(board.id)}
                >
                  <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <GripVertical className="h-3 w-3 text-sidebar-foreground/30" />
                  </div>
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white transition-all duration-150",
                      color.dot,
                      isActive && "scale-105",
                    )}
                  >
                    {IconComponent ? (
                      <IconComponent className="h-3.5 w-3.5" />
                    ) : (
                      board.name.charAt(0).toUpperCase()
                    )}
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
                        setSettingsBoard(board);
                        setSettingsTab("general");
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      title="Настроить"
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
                  {board.pinned && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <Pin className="h-2.5 w-2.5 text-sidebar-foreground/40 fill-sidebar-foreground/40" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* Board settings dialog */}
      <Dialog open={!!settingsBoard} onOpenChange={(o) => { if (!o) setSettingsBoard(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Настройки доски</DialogTitle>
          </DialogHeader>
          {settingsBoard && (
            <div className="flex flex-col gap-4">
              {/* Tabs */}
              <div className="flex gap-1 p-0.5 bg-muted/60 rounded-lg">
                <button
                  onClick={() => setSettingsTab("general")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                    settingsTab === "general" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Основное
                </button>
                <button
                  onClick={() => setSettingsTab("color")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                    settingsTab === "color" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Цвет
                </button>
                <button
                  onClick={() => setSettingsTab("icon")}
                  className={cn(
                    "flex-1 py-1.5 text-xs font-medium rounded-md transition-colors",
                    settingsTab === "icon" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Иконка
                </button>
              </div>

              {settingsTab === "general" && (
                <div className="flex flex-col gap-4">
                  <Input
                    placeholder="Название доски"
                    value={settingsBoard.name}
                    onChange={(e) => {
                      setSettingsBoard({ ...settingsBoard, name: e.target.value });
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Закрепить</span>
                    <button
                      onClick={() => {
                        const next = !settingsBoard.pinned;
                        updateBoardField(settingsBoard.id, { pinned: next });
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        settingsBoard.pinned
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {settingsBoard.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      {settingsBoard.pinned ? "Открепить" : "Закрепить"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        const name = settingsBoard.name.trim();
                        if (!name) return;
                        await updateBoardField(settingsBoard.id, { name });
                        toast.success("Сохранено");
                        setSettingsBoard(null);
                      }}
                      className="flex-1"
                    >
                      Сохранить
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSettingsBoard(null)}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {settingsTab === "color" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Выберите цвет доски</p>
                  <div className="grid grid-cols-5 gap-2">
                    {BOARD_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => updateBoardField(settingsBoard.id, { color: c.name })}
                        className={cn(
                          "flex items-center justify-center h-10 rounded-xl transition-all",
                          c.dot.replace("bg-", "bg-").replace("-500", "-500/20"),
                          settingsBoard.color === c.name
                            ? `ring-2 ring-offset-2 ring-offset-background ${c.ring}`
                            : "hover:scale-105",
                        )}
                      >
                        <div className={cn("h-5 w-5 rounded-full", c.dot)} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {settingsTab === "icon" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-3">Выберите иконку</p>
                  <div className="grid grid-cols-7 gap-1.5 max-h-48 overflow-y-auto">
                    {BOARD_ICONS.map((ic) => {
                      const Icon = ic.icon;
                      return (
                        <button
                          key={ic.name}
                          onClick={() => updateBoardField(settingsBoard.id, { icon: ic.name })}
                          className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-lg transition-all",
                            settingsBoard.icon === ic.name
                              ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                          title={ic.name}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                  {settingsBoard.icon && (
                    <button
                      onClick={() => updateBoardField(settingsBoard.id, { icon: "" })}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Сбросить иконку
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
