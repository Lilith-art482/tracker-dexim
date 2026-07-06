import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getTransactionsByUser,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAccountsByUser,
  updateAccount,
} from "@/lib/finance-models";
import { mockFinanceTransactions } from "@/lib/finance-mock";
import type { TransactionType, TransactionFilters } from "@/lib/finance-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as TransactionType | null;
  const categoryId = searchParams.get("categoryId");
  const accountId = searchParams.get("accountId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const tags = searchParams.get("tags");

  const filters: TransactionFilters = {};
  if (type) filters.type = type;
  if (categoryId) filters.categoryId = categoryId;
  if (accountId) filters.accountId = accountId;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (tags) {
    filters.tags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  try {
    const transactions = await getTransactionsByUser(uid, filters);
    return NextResponse.json(transactions);
  } catch {
    let filtered = mockFinanceTransactions.filter((t) => t.userId === uid);
    if (type) filtered = filtered.filter((t) => t.type === type);
    if (categoryId)
      filtered = filtered.filter((t) => t.categoryId === categoryId);
    if (accountId) filtered = filtered.filter((t) => t.accountId === accountId);
    if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom);
    if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo);
    if (tags) {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      filtered = filtered.filter((t) =>
        tagList.some((tag) => t.tags.includes(tag)),
      );
    }
    return NextResponse.json(filtered);
  }
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const transaction = await createTransaction({
      id: body.id || crypto.randomUUID(),
      userId: uid,
      accountId: body.accountId,
      type: body.type,
      categoryId: body.categoryId,
      amount: body.amount,
      description: body.description,
      tags: body.tags || [],
      date: body.date,
    });

    // Update account balance
    if (body.type === "income" || body.type === "expense") {
      const accounts = await getAccountsByUser(uid);
      const account = accounts.find((a) => a.id === body.accountId);
      if (account) {
        const delta = body.type === "income" ? body.amount : -body.amount;
        await updateAccount(body.accountId, {
          balance: account.balance + delta,
        });
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const transaction = await updateTransaction(id, fields);
    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await deleteTransaction(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
