import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_TEXT = 15_000;

const TEXT_EXTS = ["txt", "md", "csv"];
const PDF_EXTS = ["pdf"];
const DOCX_EXTS = ["docx"];

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const name = file.name || "file";
    const ext = name.split(".").pop()?.toLowerCase() ?? "";

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файл слишком большой (максимум 5 МБ)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let raw: string;
    if (TEXT_EXTS.includes(ext)) {
      raw = buffer.toString("utf-8").replace(/^\uFEFF/, "");
    } else if (PDF_EXTS.includes(ext)) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        raw = result.text;
      } finally {
        await parser.destroy();
      }
    } else if (DOCX_EXTS.includes(ext)) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      raw = result.value;
    } else {
      return NextResponse.json(
        { error: "Неподдерживаемый формат. Доступны TXT, MD, CSV, PDF, DOCX" },
        { status: 400 },
      );
    }

    const cleaned = raw.replace(/\u0000/g, "").trim();
    if (!cleaned) {
      return NextResponse.json(
        { error: "Не удалось извлечь текст из файла" },
        { status: 422 },
      );
    }

    const text =
      cleaned.length > MAX_TEXT
        ? cleaned.slice(0, MAX_TEXT) + "\n…(файл обрезан)"
        : cleaned;

    return NextResponse.json({ name, text });
  } catch (error) {
    console.error("[Planner File] Error:", error);
    return NextResponse.json(
      { error: "Не удалось прочитать файл" },
      { status: 500 },
    );
  }
}
