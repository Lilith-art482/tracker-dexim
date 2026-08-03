export interface Board {
  id: string;
  name: string;
  type: "personal" | "team";
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  members?: string[];
  color?: string;
  icon?: string;
  pinned?: boolean;
  order?: number;
}

export interface Company {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  ownerId?: string;
  members?: string[];
  memberConfig?: Record<string, MemberConfig>;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionFlags {
  createTasks: boolean;
  moveTasks: boolean;
  assignMembers: boolean;
  approveTasks: boolean;
  deleteTasks: boolean;
  comment: boolean;
  setDeadlines: boolean;
  setStartTimes: boolean;
}

export interface MemberConfig {
  boardAccess: string[] | "all";
  unifiedPermissions: boolean;
  permissions: PermissionFlags;
  boardPermissions: Record<string, PermissionFlags>;
}

export const DEFAULT_PERMISSIONS: PermissionFlags = {
  createTasks: true,
  moveTasks: true,
  assignMembers: true,
  approveTasks: true,
  deleteTasks: false,
  comment: true,
  setDeadlines: true,
  setStartTimes: true,
};

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  assignee: string | null;
  assignees: string[];
  priority: Priority;
  completed: boolean;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface BoardMember {
  id: string;
  boardId: string;
  name: string;
  userId?: string;
  createdAt: string;
}

export interface PersonalTask {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string | null;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  boardId?: string;
  sourceNoteId?: string | null;
}

export interface PersonalKanbanTask {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  startTime: string;
  endTime: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string | null;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export interface PersonalPlanEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string | null;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  boardId?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "deploying";
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasConnection {
  fromBlockId: string;
  toBlockId: string;
  type: "arrow" | "dashed";
}

export interface CanvasState {
  positions: Record<string, { x: number; y: number }>;
  connections: CanvasConnection[];
}

export interface Note {
  id: string;
  title: string;
  blocks: Array<{
    id: string;
    type: string;
    content: string;
    checked?: boolean;
    language?: string;
  }>;
  tags: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  recurringInterval?: string | null;
  linkedNoteIds?: string[];
  canvasState?: CanvasState | null;
}
