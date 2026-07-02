import { isDatabaseAvailable } from "@/lib/db";
import {
  getBoardsByUser,
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
  searchParams: Promise<{ boardId?: string; view?: string; uid?: string }>;
}) {
  const { boardId, view, uid } = await searchParams;

  const dbAvailable = await isDatabaseAvailable();
  let boards: Board[] = [];

  if (dbAvailable && uid) {
    try {
      boards = await getBoardsByUser(uid);
    } catch {
      boards = mockBoards.filter(
        (b) => b.ownerId === uid || b.members?.includes(uid),
      );
    }
  } else if (uid) {
    boards = mockBoards.filter(
      (b) => b.ownerId === uid || b.members?.includes(uid),
    );
  } else {
    boards = [];
  }

  const activeBoard = boardId
    ? boards.find((b) => b.id === boardId)
    : undefined;

  let columns: Column[] = [];
  let boardMembers: BoardMember[] = [];

  if (activeBoard) {
    columns = await getColumnsForBoard(activeBoard.id);
    boardMembers = await getBoardMembers(activeBoard.id);
  }

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
