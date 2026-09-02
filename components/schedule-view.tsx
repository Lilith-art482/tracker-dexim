"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  LayoutDashboard,
  Loader2,
  Plus,
  ChevronDown,
} from "lucide-react";
import type { Board } from "@/lib/models";
import { auth } from "@/lib/firebase";
import { PersonalView } from "@/components/personal-view";
import { ScheduleDashboard } from "@/components/schedule-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getBoardIcon } from "@/lib/board-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ScheduleView() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | undefined>();
  const [loading, setLoading] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          if (!cancelled) setBoards([]);
          return;
        }
        const res = await fetch(`/api/boards?uid=${uid}`);
        if (res.ok) {
          const allBoards: Board[] = await res.json();
          const scheduleBoards = allBoards.filter((b) => b.type === "schedule");
          if (!cancelled) {
            setBoards(scheduleBoards);
            if (scheduleBoards.length > 0 && !activeBoard) {
              setActiveBoard(scheduleBoards[0]);
            }
          }
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async () => {
    const name = createName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const ownerId = auth.currentUser?.uid || null;
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerId, type: "schedule" }),
      });
      if (!res.ok) {
        return;
      }
      const newBoard: Board = await res.json();
      setBoards((prev) => [...prev, newBoard]);
      setActiveBoard(newBoard);
      setCreateDialogOpen(false);
      setCreateName("");
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-teal-500/10">
              <CalendarDays className="h-5 w-5 text-teal-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Расписание</h1>
              <p className="text-xs text-muted-foreground">
                Управление расписанием и планами
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={dashboardOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setDashboardOpen(!dashboardOpen)}
              className="gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Дашборд</span>
            </Button>

            {boards.length > 0 && (
              <Popover>
                <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  {activeBoard && (() => {
                    const Icon = getBoardIcon(activeBoard.icon);
                    return Icon ? (
                      <span className="h-4 w-4">
                        <Icon className="h-4 w-4" />
                      </span>
                    ) : null;
                  })()}
                  <span className="max-w-[120px] truncate">
                    {activeBoard?.name || "Доска"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1">
                  {boards.map((board) => {
                    const Icon = getBoardIcon(board.icon);
                    return (
                      <button
                        key={board.id}
                        onClick={() => {
                          setActiveBoard(board);
                          setDashboardOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                          activeBoard?.id === board.id
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        {Icon && (
                          <span className="h-4 w-4">
                            <Icon className="h-4 w-4" />
                          </span>
                        )}
                        <span className="truncate">{board.name}</span>
                      </button>
                    );
                  })}
                  <div className="my-1 h-px bg-border" />
                  <button
                    onClick={() => setCreateDialogOpen(true)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Новая доска
                  </button>
                </PopoverContent>
              </Popover>
            )}

            {boards.length === 0 && (
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Создать доску
              </Button>
            )}
          </div>
        </div>

        {dashboardOpen ? (
          <ScheduleDashboard boards={boards} />
        ) : activeBoard ? (
          <PersonalView activeBoard={activeBoard} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Нет досок</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Создайте доску, чтобы начать планирование
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Создать доску
            </Button>
          </div>
        )}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); if (!o) setCreateName(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая доска</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Название доски"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              autoFocus
            />
            <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
