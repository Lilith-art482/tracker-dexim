"use client";

import { useMode } from "@/lib/mode-context";
import type { Board, Column } from "@/lib/models";
import { PersonalView } from "@/components/personal-view";
import { TeamView } from "@/components/team-view";
import { PersonalDashboardFull } from "@/components/personal-dashboard-full";
import { TeamDashboardPlaceholder } from "@/components/team-dashboard-placeholder";
import { PlannerEmptyState } from "@/components/planner-empty-state";

interface TeamOrPersonalViewProps {
  _boards: Board[];
  activeBoard?: Board;
  columns?: Column[];
  isArchiveView?: boolean;
}

export function TeamOrPersonalView({
  _boards,
  activeBoard,
  columns = [],
  isArchiveView = false,
}: TeamOrPersonalViewProps) {
  const { mode, dashboardOpen } = useMode();

  if (dashboardOpen) {
    if (mode === "personal") {
      return <PersonalDashboardFull boards={_boards} />;
    }
    return <TeamDashboardPlaceholder />;
  }

  if (!activeBoard) {
    return <PlannerEmptyState />;
  }

  if (mode === "personal") {
    return <PersonalView activeBoard={activeBoard} />;
  }

  return (
    <TeamView
      activeBoard={activeBoard}
      columns={columns}
      isArchiveView={isArchiveView}
    />
  );
}
