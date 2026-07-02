"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PersonalTask } from "@/lib/models";

interface TaskContextType {
  tasks: PersonalTask[];
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({
  tasks,
  children,
}: {
  tasks: PersonalTask[];
  children: ReactNode;
}) {
  return (
    <TaskContext.Provider value={{ tasks }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within TaskProvider");
  return ctx;
}
