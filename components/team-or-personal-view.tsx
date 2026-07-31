"use client";

import { useMode } from "@/lib/mode-context";
import type { Board, Column, BoardMember } from "@/lib/models";
import { PersonalView } from "@/components/personal-view";
import { TeamView } from "@/components/team-view";
import { PersonalDashboardFull } from "@/components/personal-dashboard-full";
import { TeamDashboardPlaceholder } from "@/components/team-dashboard-placeholder";

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
  const { mode, dashboardOpen } = useMode();

  if (dashboardOpen) {
    if (mode === "personal") {
      return <PersonalDashboardFull boards={_boards} />;
    }
    return <TeamDashboardPlaceholder />;
  }

  if (mode === "personal") {
    return <PersonalView activeBoard={activeBoard} />;
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
