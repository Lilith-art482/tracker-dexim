import { NextRequest, NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getPersonalTasksByOwner,
  deletePersonalTask,
  getPersonalKanbanTasksByBoard,
  deletePersonalKanbanTask,
  getPersonalPlanEntriesByOwner,
  deletePersonalPlanEntry,
  getAllBoards,
  deleteBoard,
  getAllNotes,
  deleteNote,
} from "@/lib/models";
import {
  getAccountsByUser,
  deleteAccount,
  getTransactionsByUser,
  deleteTransaction,
  getCategoriesByUser,
  deleteCategory,
  getBudgetPlansByUser,
  deleteBudgetPlan,
  getGoalsByUser,
  deleteGoal,
  getLoansByUser,
  deleteLoan,
  getShoppingListsByUser,
  deleteShoppingList,
  getRecurringTransactionsByUser,
  deleteRecurringTransaction,
  getEmergencyFund,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface ResetPayload {
  uid: string;
  boards?: boolean;
  personalTasks?: boolean;
  kanbanTasks?: boolean;
  planEntries?: boolean;
  finance?: {
    accounts?: boolean;
    transactions?: boolean;
    categories?: boolean;
    budgets?: boolean;
    goals?: boolean;
    loans?: boolean;
    shoppingLists?: boolean;
    recurringPayments?: boolean;
    emergencyFund?: boolean;
  };
  notes?: boolean;
  blogReadStatus?: boolean;
  boardId?: string;
}

export async function POST(request: NextRequest) {
  const body: ResetPayload = await request.json();
  const uid = body.uid;

  if (!uid || typeof uid !== "string") {
    return NextResponse.json({ error: "uid обязателен" }, { status: 400 });
  }

  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const results: Record<string, number> = {};

  try {
    if (body.boards) {
      const allBoards = await getAllBoards();
      const userBoards = allBoards.filter(
        (b) => b.ownerId === uid && (!body.boardId || b.id === body.boardId),
      );

      for (const board of userBoards) {
        const kanbanTasks = await getPersonalKanbanTasksByBoard(board.id);
        for (const kt of kanbanTasks) {
          await deletePersonalKanbanTask(kt.id);
        }
        results.kanbanTasks =
          (results.kanbanTasks || 0) + kanbanTasks.length;

        await deleteBoard(board.id);
        results.boards = (results.boards || 0) + 1;
      }
    }

    if (body.personalTasks) {
      const tasks = await getPersonalTasksByOwner(uid);
      const filtered = body.boardId
        ? tasks.filter((t) => t.boardId === body.boardId)
        : tasks;
      for (const t of filtered) {
        await deletePersonalTask(t.id);
      }
      results.personalTasks = filtered.length;
    }

    if (body.kanbanTasks && !body.boards) {
      const allBoards = await getAllBoards();
      const userBoards = allBoards.filter((b) => b.ownerId === uid);
      for (const board of userBoards) {
        const tasks = await getPersonalKanbanTasksByBoard(board.id);
        const filtered = body.boardId
          ? tasks.filter((t) => t.boardId === body.boardId)
          : tasks;
        for (const t of filtered) {
          await deletePersonalKanbanTask(t.id);
        }
        results.kanbanTasks =
          (results.kanbanTasks || 0) + filtered.length;
      }
    }

    if (body.planEntries) {
      const entries = await getPersonalPlanEntriesByOwner(uid);
      const filtered = body.boardId
        ? entries.filter((e) => e.boardId === body.boardId)
        : entries;
      for (const e of filtered) {
        await deletePersonalPlanEntry(e.id);
      }
      results.planEntries = filtered.length;
    }

    if (body.finance) {
      const f = body.finance;

      if (f.accounts) {
        const items = await getAccountsByUser(uid);
        for (const a of items) await deleteAccount(a.id);
        results.accounts = items.length;
      }
      if (f.transactions) {
        const items = await getTransactionsByUser(uid);
        for (const t of items) await deleteTransaction(t.id);
        results.transactions = items.length;
      }
      if (f.categories) {
        const items = await getCategoriesByUser(uid);
        for (const c of items) await deleteCategory(c.id);
        results.categories = items.length;
      }
      if (f.budgets) {
        const items = await getBudgetPlansByUser(uid);
        for (const b of items) await deleteBudgetPlan(b.id);
        results.budgets = items.length;
      }
      if (f.goals) {
        const items = await getGoalsByUser(uid);
        for (const g of items) await deleteGoal(g.id);
        results.goals = items.length;
      }
      if (f.loans) {
        const items = await getLoansByUser(uid);
        for (const l of items) await deleteLoan(l.id);
        results.loans = items.length;
      }
      if (f.shoppingLists) {
        const items = await getShoppingListsByUser(uid);
        for (const l of items) await deleteShoppingList(l.id);
        results.shoppingLists = items.length;
      }
      if (f.recurringPayments) {
        const items = await getRecurringTransactionsByUser(uid);
        for (const r of items) await deleteRecurringTransaction(r.id);
        results.recurringPayments = items.length;
      }
      if (f.emergencyFund) {
        const fund = await getEmergencyFund(uid);
        if (fund) results.emergencyFund = 1;
      }
    }

    if (body.notes) {
      const notes = await getAllNotes(uid);
      for (const n of notes) await deleteNote(uid, n.id);
      results.notes = notes.length;
    }

    return NextResponse.json({ success: true, deleted: results });
  } catch (error) {
    console.error("Reset data error:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении данных" },
      { status: 500 },
    );
  }
}
