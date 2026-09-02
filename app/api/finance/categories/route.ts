import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getCategoriesByUser,
  createCategory,
  deleteCategory,
  ensureOwned,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const categories = await getCategoriesByUser(uid);
    return NextResponse.json(categories);
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
    const category = await createCategory({
      userId: uid,
      name: body.name,
      icon: body.icon,
      type: body.type,
      color: body.color,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
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

  if (!(await ensureOwned("FINANCE_CATEGORIES", id, uid))) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  try {
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
