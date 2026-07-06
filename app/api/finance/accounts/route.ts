import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getAccountsByUser,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/finance-models";
import { mockStore } from "@/lib/finance-mock-store";
import type { FinanceAccount } from "@/lib/finance-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const accounts = await getAccountsByUser(uid);
      return NextResponse.json(accounts);
    } catch {}
  }

  const filtered = mockStore.accounts.filter((a) => a.userId === uid);
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (await isDatabaseAvailable()) {
    try {
      const account = await createAccount({
        id: body.id || crypto.randomUUID(),
        userId: uid,
        name: body.name,
        type: body.type,
        balance: body.balance,
        currency: body.currency,
      });
      return NextResponse.json(account, { status: 201 });
    } catch (error) {
      console.error("Error creating account:", error);
    }
  }

  const account: FinanceAccount = {
    id: body.id || crypto.randomUUID(),
    userId: uid,
    name: body.name,
    type: body.type,
    balance: body.balance,
    currency: body.currency,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockStore.accounts.push(account);
  return NextResponse.json(account, { status: 201 });
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

  if (await isDatabaseAvailable()) {
    try {
      const updated = await updateAccount(id, body);
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.accounts.findIndex((a) => a.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.accounts[idx] = {
    ...mockStore.accounts[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(mockStore.accounts[idx]);
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

  if (await isDatabaseAvailable()) {
    try {
      await deleteAccount(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.accounts.findIndex((a) => a.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.accounts.splice(idx, 1);
  return NextResponse.json({ success: true });
}
