import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import {
  getProjectsByUser,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/finance-models";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const uid = auth.currentUser?.uid || request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getProjectsByUser(uid);
    return NextResponse.json(projects);
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
  const { name, icon, targetAmount, savedAmount, deadline, description, linkedCategoryIds, color } = body;

  if (!name || typeof targetAmount !== "number") {
    return NextResponse.json(
      { error: "Name and targetAmount are required" },
      { status: 400 },
    );
  }

  try {
    const project = await createProject({
      id: crypto.randomUUID(),
      userId: uid,
      name,
      icon: icon || "Target",
      targetAmount,
      savedAmount: savedAmount ?? 0,
      deadline: deadline || "",
      description: description || "",
      linkedCategoryIds: linkedCategoryIds || [],
      color: color || "blue",
      completed: false,
    });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const updated = await updateProject(id, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
}
