import { getAdminDb } from "./firebase-admin";

export interface Board {
  id: string;
  name: string;
  type: "personal" | "team";
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  members?: string[];
  color?: string;
  icon?: string;
  pinned?: boolean;
  order?: number;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
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
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  title: string;
  priority: Priority;
  completed: boolean;
  comment?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
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
  data: Partial<Pick<Board, "name" | "members" | "color" | "icon" | "pinned" | "order">>,
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
  data: Partial<Pick<Column, "name" | "order">>,
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
      | "dayOfWeek"
      | "startTime"
      | "endTime"
      | "priority"
      | "completed"
      | "comment"
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
