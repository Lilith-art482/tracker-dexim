import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import {
  getTransactionsByUser,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getAccountsByUser,
  updateAccount,
} from "@/lib/finance-models";
import type {
  TransactionType,
  TransactionFilters,
} from "@/lib/finance-types";

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
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
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
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const body = await request.json();

  try {
    const updated = await updateTransaction(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteTransaction(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
