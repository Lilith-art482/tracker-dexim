import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getLoansByUser,
  createLoan,
  updateLoan,
  deleteLoan,
} from "@/lib/finance-models";
import { mockStore } from "@/lib/finance-mock-store";
import type { Loan } from "@/lib/finance-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const loans = await getLoansByUser(uid);
      return NextResponse.json(loans);
    } catch {}
  }

  const filtered = mockStore.loans.filter((l) => l.userId === uid);
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
    }
  }

  const loan: Loan = {
    id: body.id || crypto.randomUUID(),
    userId: uid,
    name: body.name,
    totalAmount: body.totalAmount,
    interestRate: body.interestRate,
    monthlyPayment: body.monthlyPayment,
    remainingAmount: body.remainingAmount,
    nextPaymentDate: body.nextPaymentDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockStore.loans.push(loan);
  return NextResponse.json(loan, { status: 201 });
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
      const updated = await updateLoan(id, body);
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.loans.findIndex((l) => l.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.loans[idx] = {
    ...mockStore.loans[idx],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(mockStore.loans[idx]);
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
      await deleteLoan(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.loans.findIndex((l) => l.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.loans.splice(idx, 1);
  return NextResponse.json({ success: true });
}
