import { getAdminDb } from "./firebase-admin";

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
  createdAt: string;
  updatedAt: string;
}

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

const COL = (name: string) => name;
const toPlain = <T>(snap: {
  id: string;
  data: () => T;
}): T & { id: string } => ({
  id: snap.id,
  ...snap.data(),
});

export async function getServiceById(id: string): Promise<Service | null> {
  const snap = await getAdminDb().collection(COL("SERVICES")).doc(id).get();
  if (!snap.exists) return null;
  return toPlain(snap) as Service;
}

export async function getServicesByStatus(status: string): Promise<Service[]> {
  const snap = await getAdminDb()
    .collection(COL("SERVICES"))
    .where("status", "==", status)
    .get();
  return snap.docs.map((d) => toPlain(d) as Service);
}

export async function getAllServices(): Promise<Service[]> {
  const snap = await getAdminDb().collection(COL("SERVICES")).get();
  return snap.docs.map((d) => toPlain(d) as Service);
}

export async function createService(
  data: Omit<Service, "createdAt" | "updatedAt">,
): Promise<Service> {
  const now = new Date().toISOString();
  const service: Service = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("SERVICES")).doc(service.id).set(service);
  return service;
}

export async function updateService(
  id: string,
  data: Partial<Pick<Service, "name" | "description" | "status" | "url">>,
): Promise<Service> {
  await getAdminDb()
    .collection(COL("SERVICES"))
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb().collection(COL("SERVICES")).doc(id).get();
  return toPlain(snap) as Service;
}

export async function deleteService(id: string): Promise<void> {
  await getAdminDb().collection(COL("SERVICES")).doc(id).delete();
}

export async function getAllBoards(): Promise<Board[]> {
  const snap = await getAdminDb().collection(COL("BOARDS")).get();
  return snap.docs.map((d) => toPlain(d) as Board);
}

export async function getCompaniesByUser(uid: string): Promise<Company[]> {
  const db = getAdminDb();
  const ownerSnap = await db
    .collection(COL("COMPANIES"))
    .where("ownerId", "==", uid)
    .get();
  const memberSnap = await db
    .collection(COL("COMPANIES"))
    .where("members", "array-contains", uid)
    .get();
  const companiesMap = new Map<string, Company>();
  ownerSnap.docs.forEach((d) => companiesMap.set(d.id, toPlain(d) as Company));
  memberSnap.docs.forEach((d) => companiesMap.set(d.id, toPlain(d) as Company));
  return Array.from(companiesMap.values());
}

export async function createCompany(
  data: Omit<Company, "createdAt" | "updatedAt">,
): Promise<Company> {
  const now = new Date().toISOString();
  const company: Company = {
    ...data,
    createdAt: now,
    updatedAt: now,
    members: data.members || [],
  };
  await getAdminDb().collection(COL("COMPANIES")).doc(company.id).set(company);
  return company;
}

export async function updateCompany(
  id: string,
  data: Partial<
    Pick<Company, "name" | "description" | "color" | "icon" | "members">
  >,
): Promise<Company> {
  await getAdminDb()
    .collection(COL("COMPANIES"))
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb().collection(COL("COMPANIES")).doc(id).get();
  return toPlain(snap) as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  await getAdminDb().collection(COL("COMPANIES")).doc(id).delete();
}

export async function getBoardsByUser(uid: string): Promise<Board[]> {
  // Boards where user is owner or listed in members array
  const db = getAdminDb();
  const ownerSnap = await db
    .collection(COL("BOARDS"))
    .where("ownerId", "==", uid)
    .get();
  const memberSnap = await db
    .collection(COL("BOARDS"))
    .where("members", "array-contains", uid)
    .get();
  const boardsMap = new Map<string, Board>();
  ownerSnap.docs.forEach((d) => boardsMap.set(d.id, toPlain(d) as Board));
  memberSnap.docs.forEach((d) => boardsMap.set(d.id, toPlain(d) as Board));
  return Array.from(boardsMap.values());
}

export async function createBoard(
  data: Omit<Board, "createdAt" | "updatedAt">,
): Promise<Board> {
  const now = new Date().toISOString();
  const board: Board = {
    ...data,
    createdAt: now,
    updatedAt: now,
    members: data.members || [],
  };
  await getAdminDb().collection(COL("BOARDS")).doc(board.id).set(board);
  return board;
}

export async function updateBoard(
  id: string,
  data: Partial<
    Pick<Board, "name" | "members" | "color" | "icon" | "pinned" | "order" | "companyId">
  >,
): Promise<Board> {
  await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb().collection(COL("BOARDS")).doc(id).get();
  return toPlain(snap) as Board;
}

export async function deleteBoard(id: string): Promise<void> {
  const db = getAdminDb();
  console.log(`[deleteBoard] start deleting board ${id}`);

  // 1. Получаем все колонки доски
  const columnsSnap = await db
    .collection(COL("BOARDS"))
    .doc(id)
    .collection("COLUMNS")
    .get();

  // 2. Для каждой колонки удаляем все задачи
  for (const colDoc of columnsSnap.docs) {
    const tasksSnap = await db
      .collection(COL("BOARDS"))
      .doc(id)
      .collection("COLUMNS")
      .doc(colDoc.id)
      .collection("TASKS")
      .get();

    // Удаляем все задачи в колонке
    for (const taskDoc of tasksSnap.docs) {
      await db
        .collection(COL("BOARDS"))
        .doc(id)
        .collection("COLUMNS")
        .doc(colDoc.id)
        .collection("TASKS")
        .doc(taskDoc.id)
        .delete();
    }

    // Удаляем саму колонку
    await db
      .collection(COL("BOARDS"))
      .doc(id)
      .collection("COLUMNS")
      .doc(colDoc.id)
      .delete();
  }

  // 3. Удаляем документ доски
  await db.collection(COL("BOARDS")).doc(id).delete();

  // 4. Удаляем участников доски
  const membersSnap = await db
    .collection(COL("BOARD_MEMBERS"))
    .where("boardId", "==", id)
    .get();

  for (const memberDoc of membersSnap.docs) {
    await db.collection(COL("BOARD_MEMBERS")).doc(memberDoc.id).delete();
  }

  console.log(`[deleteBoard] board ${id} deleted successfully`);
}

export async function getColumnsByBoardId(boardId: string): Promise<Column[]> {
  // Используем подколлекцию внутри доски
  const snap = await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .orderBy("order", "asc")
    .get();
  return snap.docs.map((d) => toPlain(d) as Column);
}

export async function createColumn(
  data: Omit<Column, "createdAt" | "updatedAt">,
): Promise<Column> {
  const now = new Date().toISOString();
  const column: Column = { ...data, createdAt: now, updatedAt: now };
  // Сохраняем в подколлекции доски
  await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(data.boardId)
    .collection("COLUMNS")
    .doc(column.id)
    .set(column);
  return column;
}

export async function updateColumn(
  id: string,
  data: Partial<Pick<Column, "name" | "order" | "icon" | "color">>,
  boardId: string,
): Promise<Column> {
  await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(id)
    .get();
  return toPlain(snap) as Column;
}

export async function deleteColumn(
  boardId: string,
  columnId: string,
): Promise<void> {
  const db = getAdminDb();

  // Сначала удаляем все задачи в этой колонке (подколлекция внутри колонки)
  const tasksSnap = await db
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(columnId)
    .collection("TASKS")
    .get();

  for (const taskDoc of tasksSnap.docs) {
    await db
      .collection(COL("BOARDS"))
      .doc(boardId)
      .collection("COLUMNS")
      .doc(columnId)
      .collection("TASKS")
      .doc(taskDoc.id)
      .delete();
  }

  // Затем удаляем саму колонку
  await db
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(columnId)
    .delete();
}
export async function getTasksByColumnId(
  boardId: string,
  columnId: string,
): Promise<Task[]> {
  // Используем подколлекцию внутри колонки
  const snap = await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(columnId)
    .collection("TASKS")
    .get();
  return snap.docs.map((d) => toPlain(d) as Task);
}

export async function getAllBoardTasks(boardId: string): Promise<Task[]> {
  const columns = await getColumnsByBoardId(boardId);
  const allTasks: Task[] = [];

  for (const col of columns) {
    const tasks = await getTasksByColumnId(boardId, col.id);
    allTasks.push(...tasks);
  }

  return allTasks;
}

export async function getArchivedTasks(boardId: string): Promise<Task[]> {
  // Нужно проверить все колонки доски
  const columns = await getColumnsByBoardId(boardId);
  const allTasks: Task[] = [];

  for (const col of columns) {
    const tasks = await getTasksByColumnId(boardId, col.id);
    allTasks.push(...tasks.filter((t) => t.archived));
  }

  return allTasks;
}

export async function createTask(
  data: Omit<Task, "createdAt" | "updatedAt">,
  boardId: string,
): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = { ...data, boardId, createdAt: now, updatedAt: now };
  // Сохраняем в подколлекции внутри колонки
  await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(data.columnId)
    .collection("TASKS")
    .doc(task.id)
    .set(task);
  return task;
}

export async function updateTask(
  id: string,
  data: Partial<
    Pick<
      Task,
      | "title"
      | "description"
      | "startDate"
      | "endDate"
      | "assignee"
      | "assignees"
      | "priority"
      | "completed"
      | "columnId"
      | "boardId"
      | "archived"
      | "archivedAt"
    >
  >,
  boardId: string,
  columnId: string,
): Promise<Task> {
  await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(columnId)
    .collection("TASKS")
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(columnId)
    .collection("TASKS")
    .doc(id)
    .get();
  return toPlain(snap) as Task;
}

export async function deleteTask(
  boardId: string,
  columnId: string,
  taskId: string,
): Promise<void> {
  await getAdminDb()
    .collection(COL("BOARDS"))
    .doc(boardId)
    .collection("COLUMNS")
    .doc(columnId)
    .collection("TASKS")
    .doc(taskId)
    .delete();
}

export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const snap = await getAdminDb()
    .collection(COL("COMMENTS"))
    .where("taskId", "==", taskId)
    .get();
  return snap.docs.map((d) => toPlain(d) as Comment);
}

export async function createComment(
  data: Omit<Comment, "createdAt">,
): Promise<Comment> {
  const now = new Date().toISOString();
  const comment: Comment = { ...data, createdAt: now };
  await getAdminDb().collection(COL("COMMENTS")).doc(comment.id).set(comment);
  return comment;
}

export async function getBoardMembersByBoardId(
  boardId: string,
): Promise<BoardMember[]> {
  const snap = await getAdminDb()
    .collection(COL("BOARD_MEMBERS"))
    .where("boardId", "==", boardId)
    .get();
  return snap.docs.map((d) => toPlain(d) as BoardMember);
}

export async function createBoardMember(
  data: Omit<BoardMember, "createdAt">,
): Promise<BoardMember> {
  const now = new Date().toISOString();
  const member: BoardMember = { ...data, createdAt: now };
  await getAdminDb()
    .collection(COL("BOARD_MEMBERS"))
    .doc(member.id)
    .set(member);
  return member;
}

export async function deleteBoardMember(id: string): Promise<void> {
  await getAdminDb().collection(COL("BOARD_MEMBERS")).doc(id).delete();
}

export async function getAllPersonalTasks(): Promise<PersonalTask[]> {
  const snap = await getAdminDb().collection(COL("PERSONAL_TASKS")).get();
  return snap.docs.map((d) => toPlain(d) as PersonalTask);
}

export async function getPersonalTasksByOwner(
  ownerId: string,
): Promise<PersonalTask[]> {
  const snap = await getAdminDb()
    .collection(COL("PERSONAL_TASKS"))
    .where("ownerId", "==", ownerId)
    .get();
  return snap.docs.map((d) => toPlain(d) as PersonalTask);
}

export async function createPersonalTask(
  data: Omit<PersonalTask, "createdAt" | "updatedAt">,
): Promise<PersonalTask> {
  const now = new Date().toISOString();
  const task: PersonalTask = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(COL("PERSONAL_TASKS")).doc(task.id).set(task);
  return task;
}

export async function updatePersonalTask(
  id: string,
  data: Partial<
    Pick<
      PersonalTask,
      | "title"
      | "date"
      | "startTime"
      | "endTime"
      | "priority"
      | "completed"
      | "completedAt"
      | "comment"
      | "boardId"
      | "sourceNoteId"
    >
  >,
): Promise<PersonalTask> {
  await getAdminDb()
    .collection(COL("PERSONAL_TASKS"))
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb()
    .collection(COL("PERSONAL_TASKS"))
    .doc(id)
    .get();
  return toPlain(snap) as PersonalTask;
}

export async function deletePersonalTask(id: string): Promise<void> {
  await getAdminDb().collection(COL("PERSONAL_TASKS")).doc(id).delete();
}

export async function cleanupExpiredPersonalTasks(): Promise<number> {
  const db = getAdminDb();
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  const snapshot = await db.collection(COL("PERSONAL_TASKS")).get();
  let deleted = 0;
  for (const doc of snapshot.docs) {
    const task = toPlain(doc) as PersonalTask;
    const created = new Date(task.createdAt).getTime();
    const updated = new Date(task.updatedAt).getTime();
    const latest = Math.max(created, updated);
    if (now - latest > THIRTY_DAYS) {
      await doc.ref.delete();
      deleted++;
    }
  }
  return deleted;
}

const PERSONAL_KANBAN_TASKS = COL("PERSONAL_KANBAN_TASKS");

export async function getPersonalKanbanTasksByBoard(
  boardId: string,
): Promise<PersonalKanbanTask[]> {
  const snap = await getAdminDb()
    .collection(PERSONAL_KANBAN_TASKS)
    .where("boardId", "==", boardId)
    .get();
  return snap.docs.map((d) => toPlain(d) as PersonalKanbanTask);
}

export async function createPersonalKanbanTask(
  data: Omit<PersonalKanbanTask, "createdAt" | "updatedAt">,
): Promise<PersonalKanbanTask> {
  const now = new Date().toISOString();
  const task: PersonalKanbanTask = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(PERSONAL_KANBAN_TASKS).doc(task.id).set(task);
  return task;
}

export async function updatePersonalKanbanTask(
  id: string,
  data: Partial<
    Pick<
      PersonalKanbanTask,
      | "boardId"
      | "columnId"
      | "title"
      | "startTime"
      | "endTime"
      | "priority"
      | "completed"
      | "completedAt"
      | "comment"
    >
  >,
): Promise<PersonalKanbanTask> {
  await getAdminDb()
    .collection(PERSONAL_KANBAN_TASKS)
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb()
    .collection(PERSONAL_KANBAN_TASKS)
    .doc(id)
    .get();
  return toPlain(snap) as PersonalKanbanTask;
}

export async function deletePersonalKanbanTask(id: string): Promise<void> {
  await getAdminDb().collection(PERSONAL_KANBAN_TASKS).doc(id).delete();
}

const PERSONAL_PLAN_ENTRIES = COL("PERSONAL_PLAN_ENTRIES");

export async function getPersonalPlanEntriesByOwner(
  ownerId: string,
): Promise<PersonalPlanEntry[]> {
  const snap = await getAdminDb()
    .collection(PERSONAL_PLAN_ENTRIES)
    .where("ownerId", "==", ownerId)
    .get();
  return snap.docs.map((d) => toPlain(d) as PersonalPlanEntry);
}

export async function createPersonalPlanEntry(
  data: Omit<PersonalPlanEntry, "createdAt" | "updatedAt">,
): Promise<PersonalPlanEntry> {
  const now = new Date().toISOString();
  const entry: PersonalPlanEntry = { ...data, createdAt: now, updatedAt: now };
  await getAdminDb().collection(PERSONAL_PLAN_ENTRIES).doc(entry.id).set(entry);
  return entry;
}

export async function updatePersonalPlanEntry(
  id: string,
  data: Partial<
    Pick<
      PersonalPlanEntry,
      | "date"
      | "startTime"
      | "endTime"
      | "title"
      | "priority"
      | "completed"
      | "completedAt"
      | "comment"
      | "boardId"
    >
  >,
): Promise<PersonalPlanEntry> {
  await getAdminDb()
    .collection(PERSONAL_PLAN_ENTRIES)
    .doc(id)
    .update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  const snap = await getAdminDb()
    .collection(PERSONAL_PLAN_ENTRIES)
    .doc(id)
    .get();
  return toPlain(snap) as PersonalPlanEntry;
}

export async function deletePersonalPlanEntry(id: string): Promise<void> {
  await getAdminDb().collection(PERSONAL_PLAN_ENTRIES).doc(id).delete();
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

export async function getAllNotes(userId: string): Promise<Note[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("notes")
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .get();
  return snap.docs.map((d) => toPlain(d) as Note);
}

export async function getNoteById(
  userId: string,
  noteId: string,
): Promise<Note | null> {
  const db = getAdminDb();
  const doc = await db.collection("notes").doc(noteId).get();
  if (!doc.exists) return null;
  const data = doc.data() as Note;
  if (data.userId !== userId) return null;
  return { ...data, id: doc.id } as Note;
}

function extractLinkedTitles(text: string): string[] {
  const matches = text.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(2, -2).trim().toLowerCase());
}

function computeLinkedNoteIds(
  blocks: Note["blocks"],
  allNotes: Note[],
): string[] {
  const linkedTitles = new Set<string>();
  for (const block of blocks) {
    for (const title of extractLinkedTitles(block.content)) {
      linkedTitles.add(title);
    }
  }
  if (linkedTitles.size === 0) return [];
  return allNotes
    .filter((n) => linkedTitles.has(n.title.trim().toLowerCase()))
    .map((n) => n.id);
}

export async function createNote(
  userId: string,
  data: {
    title: string;
    blocks: Note["blocks"];
    tags: string[];
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    recurringInterval?: string | null;
    canvasState?: CanvasState | null;
  },
): Promise<Note> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const ref = db.collection("notes").doc();

  const allNotes = await getAllNotes(userId);
  const linkedNoteIds = computeLinkedNoteIds(data.blocks, allNotes);

  const note: Omit<Note, "id"> = {
    title: data.title,
    blocks: data.blocks,
    tags: data.tags,
    scheduledDate: data.scheduledDate ?? null,
    scheduledTime: data.scheduledTime ?? null,
    recurringInterval: data.recurringInterval ?? null,
    linkedNoteIds,
    canvasState: data.canvasState ?? null,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(note);
  return { id: ref.id, ...note };
}

export async function updateNote(
  userId: string,
  noteId: string,
  data: Partial<{
    title: string;
    blocks: Note["blocks"];
    tags: string[];
    scheduledDate: string | null;
    scheduledTime: string | null;
    recurringInterval: string | null;
    canvasState: CanvasState | null;
  }>,
): Promise<Note | null> {
  const db = getAdminDb();
  const doc = await db.collection("notes").doc(noteId).get();
  if (!doc.exists) return null;
  const existing = doc.data() as Note;
  if (existing.userId !== userId) return null;
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.title !== undefined) updates.title = data.title;
  if (data.blocks !== undefined) {
    updates.blocks = data.blocks;
    const allNotes = await getAllNotes(userId);
    updates.linkedNoteIds = computeLinkedNoteIds(data.blocks, allNotes);
  }
  if (data.tags !== undefined) updates.tags = data.tags;
  if (data.scheduledDate !== undefined)
    updates.scheduledDate = data.scheduledDate;
  if (data.scheduledTime !== undefined)
    updates.scheduledTime = data.scheduledTime;
  if (data.recurringInterval !== undefined)
    updates.recurringInterval = data.recurringInterval;
  if (data.canvasState !== undefined) updates.canvasState = data.canvasState;
  await doc.ref.update(updates);
  return { ...existing, ...updates, id: doc.id } as Note;
}

export async function deleteNote(
  userId: string,
  noteId: string,
): Promise<boolean> {
  const db = getAdminDb();
  const doc = await db.collection("notes").doc(noteId).get();
  if (!doc.exists) return false;
  const data = doc.data() as Note;
  if (data.userId !== userId) return false;
  await doc.ref.delete();
  return true;
}

export async function cleanupExpiredArchivedTasks(): Promise<number> {
  const db = getAdminDb();
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const boardsSnap = await db.collection(COL("BOARDS")).get();
  let deleted = 0;

  for (const boardDoc of boardsSnap.docs) {
    const columnsSnap = await boardDoc.ref.collection("COLUMNS").get();
    for (const colDoc of columnsSnap.docs) {
      const tasksSnap = await colDoc.ref.collection("TASKS").get();
      for (const taskDoc of tasksSnap.docs) {
        const task = toPlain(taskDoc) as Task;
        if (task.archived && task.archivedAt) {
          const archivedTime = new Date(task.archivedAt).getTime();
          if (now - archivedTime > SEVEN_DAYS) {
            await taskDoc.ref.delete();
            deleted++;
          }
        }
      }
    }
  }
  return deleted;
}
