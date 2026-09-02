import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getLoansByUser,
  createLoan,
  updateLoan,
  deleteLoan,
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
    const loans = await getLoansByUser(uid);
    return NextResponse.json(loans);
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
    const loan = await createLoan({
      id: genId(),
      userId: uid,
      name: body.name,
      totalAmount: body.totalAmount,
      interestRate: body.interestRate,
      monthlyPayment: body.monthlyPayment,
      remainingAmount: body.remainingAmount,
      nextPaymentDate: body.nextPaymentDate,
      repaymentType: body.repaymentType || "monthly",
      dueDate: body.dueDate,
      obligationType: body.obligationType || "credit",
      overdueMonths: body.overdueMonths ?? 0,
      enforcementFee: body.enforcementFee,
      officialIncome: body.officialIncome,
      fsspPercent: body.fsspPercent,
    });
    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error("Error creating loan:", error);
    return NextResponse.json(
      { error: "Failed to create loan" },
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

  if (!(await ensureOwned("FINANCE_LOANS", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    const updated = await updateLoan(id, body);
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

  if (!(await ensureOwned("FINANCE_LOANS", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await deleteLoan(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
