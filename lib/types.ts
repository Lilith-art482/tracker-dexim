export interface Board {
  id: string;
  name: string;
  type: "personal" | "team" | "schedule";
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

export type Priority = "none" | "low" | "medium" | "high";

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
  color?: string;
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
  color?: string;
  completed: boolean;
  completedAt?: string | null;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
}

export interface ContentTask {
  id: string;
  title: string;
  topic: string;
  platform: string;
  funnel: boolean;
  format: string;
  status: string;
  color?: string;
  date: string | null;
  time: string | null;
  notes: string;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  boardId?: string;
}

export interface WorkKanbanTask {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  priority: Priority;
  color?: string;
  completed: boolean;
  completedAt?: string | null;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  workType: "content" | "dev";
}

export interface PlannerMessageAttachment {
  name: string;
  text: string;
}

export interface PlannerMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  attachment?: PlannerMessageAttachment;
}

export interface PlannerChat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: PlannerMessage[];
  ownerId?: string;
}

export interface PersonalPlanEntry {
  id: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string | null;
  comment?: string;
  sortOrder?: number;
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

export interface Idea {
  id: string;
  userId: string;
  content: string;
  priority: "none" | "low" | "medium" | "high";
  deadline: string | null;
  comment: string;
  importedToTask: boolean;
  createdAt: string;
  updatedAt: string;
}
