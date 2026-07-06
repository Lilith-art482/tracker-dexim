import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import {
  getAccountsByUser,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accounts = await getAccountsByUser(uid);
    return NextResponse.json(accounts);
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
    const account = await createAccount({
      id: body.id || crypto.randomUUID(),
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
      notes: body.notes,
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
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
    const updated = await updateAccount(id, body);
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
    await deleteAccount(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
