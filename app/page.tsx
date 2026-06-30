import { ClipboardList } from "lucide-react";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAllBoards,
  getColumnsByBoardId,
  getBoardMembersByBoardId,
} from "@/lib/models";
import { mockBoards, mockColumns, mockBoardMembers } from "@/lib/mock-data";
import type { Board, Column, BoardMember } from "@/lib/models";
import { TeamOrPersonalView } from "@/components/team-or-personal-view";
import HomeContent from "@/components/home-content";

async function getColumnsForBoard(boardId: string): Promise<Column[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      return await getColumnsByBoardId(boardId);
    } catch {
      return mockColumns.filter((c) => c.boardId === boardId);
    }
  }
  return mockColumns.filter((c) => c.boardId === boardId);
}

async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    try {
      return await getBoardMembersByBoardId(boardId);
    } catch {
      return mockBoardMembers.filter((m) => m.boardId === boardId);
    }
  }
  return mockBoardMembers.filter((m) => m.boardId === boardId);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string; view?: string }>;
}) {
  const { boardId, view } = await searchParams;

  const dbAvailable = await isDatabaseAvailable();
  let boards: Board[];
  if (dbAvailable) {
    try {
      boards = await getAllBoards();
    } catch {
      boards = mockBoards;
    }
  } else {
    boards = mockBoards;
  }

  const activeBoard = boards.find((b) => b.id === boardId) || boards[0];

  if (!activeBoard) {
    return (
      <HomeContent>
        <div className="container mx-auto flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Нет досок</h2>
          <p className="text-sm text-muted-foreground">
            Создайте первую доску в боковой панели
          </p>
        </div>
      </HomeContent>
    );
  }

  const columns = await getColumnsForBoard(activeBoard.id);
  const boardMembers = await getBoardMembers(activeBoard.id);

  const isArchiveView = view === "archive";

  return (
    <HomeContent>
      <TeamOrPersonalView
        _boards={boards}
        activeBoard={activeBoard}
        columns={columns}
        boardMembers={boardMembers}
        isArchiveView={isArchiveView}
      />
    </HomeContent>
  );
}
