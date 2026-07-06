import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getCategoriesByUser,
  createCategory,
  deleteCategory,
} from "@/lib/finance-models";
import { mockStore } from "@/lib/finance-mock-store";
import type { TransactionCategory } from "@/lib/finance-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const categories = await getCategoriesByUser(uid);
      return NextResponse.json(categories);
    } catch {}
  }

  const filtered = mockStore.categories.filter((c) => c.userId === uid);
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
    }
  }

  const category: TransactionCategory = {
    id: crypto.randomUUID(),
    userId: uid,
    name: body.name,
    icon: body.icon,
    type: body.type,
    color: body.color,
  };
  mockStore.categories.push(category);
  return NextResponse.json(category, { status: 201 });
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
      await deleteCategory(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const idx = mockStore.categories.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  mockStore.categories.splice(idx, 1);
  return NextResponse.json({ success: true });
}
