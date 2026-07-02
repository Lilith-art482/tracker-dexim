"use client";

import { useTasks } from "@/lib/task-context";
import { PersonalDashboard } from "@/components/personal-dashboard";

export function RightSidebar() {
  const { tasks } = useTasks();

  return (
    <aside className="w-80 shrink-0 border-l border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col h-full p-4">
        <PersonalDashboard tasks={tasks} />
      </div>
    </aside>
  );
}
