"use client";

import { useMode } from "@/lib/mode-context";
import { LayoutDashboard, Archive } from "lucide-react";
import type { Board, Column, BoardMember } from "@/lib/models";
import { ColumnManager } from "@/components/column-manager";
import { ArchiveView } from "@/components/archive-view";
import { BoardMembersManager } from "@/components/board-members-manager";
import { PersonalView } from "@/components/personal-view";

interface TeamOrPersonalViewProps {
  _boards: Board[];
  activeBoard: Board;
  columns: Column[];
  boardMembers: BoardMember[];
  isArchiveView: boolean;
}

export function TeamOrPersonalView({
  _boards,
  activeBoard,
  columns,
  boardMembers,
  isArchiveView,
}: TeamOrPersonalViewProps) {
  const { mode } = useMode();

  if (mode === "personal") {
    return <PersonalView />;
  }

  return (
    <TeamView
      activeBoard={activeBoard}
      columns={columns}
      boardMembers={boardMembers}
      isArchiveView={isArchiveView}
    />
  );
}

function TeamView({
  activeBoard,
  columns,
  boardMembers,
  isArchiveView,
}: {
  activeBoard: Board;
  columns: Column[];
  boardMembers: BoardMember[];
  isArchiveView: boolean;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isArchiveView ? (
            <Archive className="h-5 w-5 text-amber-500" />
          ) : (
            <LayoutDashboard className="h-5 w-5 text-emerald-500" />
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            {isArchiveView ? "Архив задач" : activeBoard?.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isArchiveView && (
            <BoardMembersManager
              boardId={activeBoard.id}
              initialMembers={boardMembers}
            />
          )}

          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <a
              href={`?boardId=${activeBoard?.id || ""}`}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                !isArchiveView
                  ? "bg-emerald-500/10 text-emerald-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Доска
            </a>
            <a
              href={`?view=archive`}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isArchiveView
                  ? "bg-amber-500/10 text-amber-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Archive className="h-4 w-4" />
              Архив
            </a>
          </div>
        </div>
      </div>

      {isArchiveView ? (
        <ArchiveView />
      ) : columns.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Доска пуста</h2>
          <p className="text-sm text-muted-foreground">
            В этой доске пока нет колонок
          </p>
          <ColumnManager
            key={activeBoard.id}
            boardId={activeBoard.id}
            initialColumns={columns}
          />
        </div>
      ) : (
        <ColumnManager
          key={activeBoard.id}
          boardId={activeBoard.id}
          initialColumns={columns}
        />
      )}
    </div>
  );
}
