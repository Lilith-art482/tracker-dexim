import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export interface Board {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  assignee: string | null;
  completed: boolean;
  archived: boolean;
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
  createdAt: string;
}

export type Priority = "low" | "medium" | "high";

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

export async function getServiceById(id: string): Promise<Service | null> {
  const snap = await getDoc(doc(db, COL("SERVICES"), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Service;
}

export async function getServicesByStatus(status: string): Promise<Service[]> {
  const q = query(collection(db, COL("SERVICES")), where("status", "==", status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
}

export async function getAllServices(): Promise<Service[]> {
  const snap = await getDocs(collection(db, COL("SERVICES")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Service);
}

export async function createService(
  data: Omit<Service, "createdAt" | "updatedAt">
): Promise<Service> {
  const now = new Date().toISOString();
  const service: Service = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(db, COL("SERVICES"), service.id), service);
  return service;
}

export async function updateService(
  id: string,
  data: Partial<Pick<Service, "name" | "description" | "status" | "url">>
): Promise<Service> {
  const ref = doc(db, COL("SERVICES"), id);
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(ref, updates);
  const snap = await getDoc(ref);
  return { id, ...snap.data() } as Service;
}

export async function deleteService(id: string): Promise<void> {
  await deleteDoc(doc(db, COL("SERVICES"), id));
}

export async function getAllBoards(): Promise<Board[]> {
  const snap = await getDocs(collection(db, COL("BOARDS")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Board);
}

export async function createBoard(
  data: Omit<Board, "createdAt" | "updatedAt">
): Promise<Board> {
  const now = new Date().toISOString();
  const board: Board = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(db, COL("BOARDS"), board.id), board);
  return board;
}

export async function getColumnsByBoardId(boardId: string): Promise<Column[]> {
  const q = query(collection(db, COL("COLUMNS")), where("boardId", "==", boardId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Column);
}

export async function createColumn(
  data: Omit<Column, "createdAt" | "updatedAt">
): Promise<Column> {
  const now = new Date().toISOString();
  const column: Column = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(db, COL("COLUMNS"), column.id), column);
  return column;
}

export async function updateColumn(
  id: string,
  data: Partial<Pick<Column, "name" | "order">>
): Promise<Column> {
  const ref = doc(db, COL("COLUMNS"), id);
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(ref, updates);
  const snap = await getDoc(ref);
  return { id, ...snap.data() } as Column;
}

export async function deleteColumn(id: string): Promise<void> {
  await deleteDoc(doc(db, COL("COLUMNS"), id));
}

export async function getTasksByColumnId(columnId: string): Promise<Task[]> {
  const q = query(collection(db, COL("TASKS")), where("columnId", "==", columnId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

export async function getArchivedTasks(): Promise<Task[]> {
  const q = query(collection(db, COL("TASKS")), where("archived", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
}

export async function createTask(
  data: Omit<Task, "createdAt" | "updatedAt">
): Promise<Task> {
  const now = new Date().toISOString();
  const task: Task = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(db, COL("TASKS"), task.id), task);
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
      | "completed"
      | "columnId"
      | "archived"
    >
  >
): Promise<Task> {
  const ref = doc(db, COL("TASKS"), id);
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(ref, updates);
  const snap = await getDoc(ref);
  return { id, ...snap.data() } as Task;
}

export async function deleteTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL("TASKS"), id));
}

export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const q = query(collection(db, COL("COMMENTS")), where("taskId", "==", taskId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comment);
}

export async function createComment(
  data: Omit<Comment, "createdAt">
): Promise<Comment> {
  const now = new Date().toISOString();
  const comment: Comment = { ...data, createdAt: now };
  await setDoc(doc(db, COL("COMMENTS"), comment.id), comment);
  return comment;
}

export async function getBoardMembersByBoardId(
  boardId: string
): Promise<BoardMember[]> {
  const q = query(collection(db, COL("BOARD_MEMBERS")), where("boardId", "==", boardId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BoardMember);
}

export async function createBoardMember(
  data: Omit<BoardMember, "createdAt">
): Promise<BoardMember> {
  const now = new Date().toISOString();
  const member: BoardMember = { ...data, createdAt: now };
  await setDoc(doc(db, COL("BOARD_MEMBERS"), member.id), member);
  return member;
}

export async function deleteBoardMember(id: string): Promise<void> {
  await deleteDoc(doc(db, COL("BOARD_MEMBERS"), id));
}

export async function getAllPersonalTasks(): Promise<PersonalTask[]> {
  const snap = await getDocs(collection(db, COL("PERSONAL_TASKS")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PersonalTask);
}

export async function createPersonalTask(
  data: Omit<PersonalTask, "createdAt" | "updatedAt">
): Promise<PersonalTask> {
  const now = new Date().toISOString();
  const task: PersonalTask = { ...data, createdAt: now, updatedAt: now };
  await setDoc(doc(db, COL("PERSONAL_TASKS"), task.id), task);
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
  >
): Promise<PersonalTask> {
  const ref = doc(db, COL("PERSONAL_TASKS"), id);
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date().toISOString() };
  await updateDoc(ref, updates);
  const snap = await getDoc(ref);
  return { id, ...snap.data() } as PersonalTask;
}

export async function deletePersonalTask(id: string): Promise<void> {
  await deleteDoc(doc(db, COL("PERSONAL_TASKS"), id));
}
