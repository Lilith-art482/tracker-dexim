import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  getCompaniesByUser,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyById,
  companyIncludesUser,
} from "@/lib/models";
import { mockCompanies } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().max(500).optional(),
});

const updateCompanySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  members: z.array(z.string()).optional(),
  memberConfig: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedUid = url.searchParams.get("uid");
  const authResult = await requireAuth(request, requestedUid);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const companies = await getCompaniesByUser(uid);
      return NextResponse.json(companies);
    } catch (error) {
      console.error("Ошибка получения компаний:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 },
      );
    }
  }

  const filtered = mockCompanies.filter(
    (c) => c.ownerId === uid || c.members?.includes(uid),
  );
  return NextResponse.json(filtered);
}

export async function POST(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 },
    );
  }

  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const company = await createCompany({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      color: parsed.data.color,
      icon: parsed.data.icon,
      description: parsed.data.description,
      ownerId: uid,
      members: [uid],
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания компании:", error);
    return NextResponse.json(
      { error: "Ошибка создания компании" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const body = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Некорректные данные", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id, ...data } = parsed.data;
    if (!(await companyIncludesUser(id, uid))) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) clean[k] = v ?? undefined;
    }
    const updated = await updateCompany(
      id,
      clean as Parameters<typeof updateCompany>[1],
    );
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ошибка обновления компании:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();
  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна" },
      { status: 503 },
    );
  }

  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  try {
    const body = await request.json();
    const { id } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id обязателен" }, { status: 400 });
    }
    const company = await getCompanyById(id);
    if (!company) {
      return NextResponse.json({ error: "Не найдено" }, { status: 404 });
    }
    if (company.ownerId !== uid) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }
    await deleteCompany(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления компании:", error);
    return NextResponse.json({ error: "Ошибка удаления" }, { status: 500 });
  }
}
