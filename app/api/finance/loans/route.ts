import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import {
  getLoansByUser,
  createLoan,
  updateLoan,
  deleteLoan,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const loans = await getLoansByUser(uid);
    return NextResponse.json(loans);
  } catch {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const uid = auth.currentUser?.uid || body.userId;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const loan = await createLoan({
      id: body.id || crypto.randomUUID(),
      userId: uid,
      name: body.name,
      totalAmount: body.totalAmount,
      interestRate: body.interestRate,
      monthlyPayment: body.monthlyPayment,
      remainingAmount: body.remainingAmount,
      nextPaymentDate: body.nextPaymentDate,
    });
    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid") || body.userId;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const updated = await updateLoan(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deleteLoan(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
