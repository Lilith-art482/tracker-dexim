
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllServices, createService, deleteService } from "@/lib/models";
import { mockServices } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createServiceSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "inactive", "deploying"]),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")).optional(),
});

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const services = await getAllServices();
      return NextResponse.json(services);
    } catch (error) {
      console.error("Ошибка получения сервисов:", error);
      return NextResponse.json(
        { error: "Ошибка получения данных из Firestore" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(mockServices);
}

export async function POST(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Некорректные данные",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const service = await createService({
      id: crypto.randomUUID(),
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      status: parsed.data.status,
      url: parsed.data.url || undefined,
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Ошибка создания сервиса:", error);
    return NextResponse.json(
      { error: "Ошибка создания сервиса" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const dbAvailable = await isDatabaseAvailable();

  if (!dbAvailable) {
    return NextResponse.json(
      { error: "База данных недоступна в статическом режиме" },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Параметр id обязателен" },
        { status: 400 }
      );
    }

    await deleteService(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка удаления сервиса:", error);
    return NextResponse.json(
      { error: "Ошибка удаления сервиса" },
      { status: 500 }
    );
  }
}
