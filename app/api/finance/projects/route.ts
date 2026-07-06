import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { isDatabaseAvailable } from "@/lib/db";
import {
  getProjectsByUser,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/finance-models";
import type { FinanceProject } from "@/lib/finance-types";
import { mockStore } from "@/lib/finance-mock-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (await isDatabaseAvailable()) {
    try {
      const projects = await getProjectsByUser(uid);
      return NextResponse.json(projects);
    } catch {}
  }

  const filtered = mockStore.projects.filter((p) => p.userId === uid);
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, icon, targetAmount, savedAmount, deadline, description, linkedCategoryIds, color } = body;

  if (!name || typeof targetAmount !== "number") {
    return NextResponse.json(
      { error: "Name and targetAmount are required" },
      { status: 400 },
    );
  }

  if (await isDatabaseAvailable()) {
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
    } catch {}
  }

  const project: FinanceProject = {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockStore.projects.push(project);
  return NextResponse.json(project);
}

export async function PUT(request: NextRequest) {
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
      const body = await request.json();
      const updated = await updateProject(id, body);
      return NextResponse.json(updated);
    } catch {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const body = await request.json();
  const idx = mockStore.projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  mockStore.projects[idx] = { ...mockStore.projects[idx], ...body, updatedAt: new Date().toISOString() };
  return NextResponse.json(mockStore.projects[idx]);
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
      await deleteProject(id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
  }

  const idx = mockStore.projects.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  mockStore.projects.splice(idx, 1);
  return NextResponse.json({ success: true });
}
