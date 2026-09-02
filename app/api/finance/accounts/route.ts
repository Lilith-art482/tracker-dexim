import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getAccountsByUser,
  createAccount,
  updateAccount,
  deleteAccount,
  ensureOwned,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function genId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const accounts = await getAccountsByUser(uid);
    return NextResponse.json(accounts);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const account = await createAccount({
      id: genId(),
      userId: uid,
      name: body.name,
      type: body.type,
      balance: body.balance,
      currency: body.currency,
      cardType: body.cardType,
      cryptoCoin: body.cryptoCoin,
      walletName: body.walletName,
      walletAddress: body.walletAddress,
      interestRate: body.interestRate,
      termMonths: body.termMonths,
      startDate: body.startDate,
      capitalizeInterest: body.capitalizeInterest,
      gracePeriodDays: body.gracePeriodDays,
      notes: body.notes,
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!(await ensureOwned("FINANCE_ACCOUNTS", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    const updated = await updateAccount(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (!(await ensureOwned("FINANCE_ACCOUNTS", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await deleteAccount(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
