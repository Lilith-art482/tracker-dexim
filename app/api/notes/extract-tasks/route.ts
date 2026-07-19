import { NextRequest, NextResponse } from "next/server";

const AI_API_URL =
  "https://chat.immers.cloud/v1/endpoints/qwen3-coder-next-tensor/generate/chat/completions";
const AI_API_KEY = "8nUHGXIguyWCZDVOB_8VjpkV1W-oG4pu";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body as { text: string };

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text обязателен" }, { status: 400 });
    }

    const systemPrompt = [
      "Ты — AI-ассистент трекера задач. Твоя задача — из текста заметки выделить задачи (action items) и вернуть JSON-массив.",
      "Каждая задача должна содержать: title (обязательно, строка), priority (опционально: low/medium/high), date (опционально: дата в формате ГГГГ-ММ-ДД, если в тексте есть указание на дату), comment (опционально: короткий контекст из текста).",
      "Если в тексте нет явных задач — верни пустой массив [].",
      "НЕ добавляй никакого текста до или после JSON. Только чистый JSON-массив.",
      "Примеры:",
      'Текст: "Купить молоко, хлеб. Завтра позвонить стоматологу в 15:00."',
      'Ответ: [{"title":"Купить молоко","priority":"low"},{"title":"Купить хлеб","priority":"low"},{"title":"Позвонить стоматологу","priority":"medium","date":"2026-07-18","comment":"в 15:00"}]',
    ].join("\n");

    const externalBody = {
      model: "Qwen3-Coder-Next",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 2048,
    };

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + AI_API_KEY,
      },
      body: JSON.stringify(externalBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Extract] API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI-сервис временно недоступен" },
        { status: 502 },
      );
    }

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "";

    let tasks: Array<{
      title: string;
      priority?: string;
      date?: string;
      comment?: string;
    }> = [];

    try {
      const cleaned = aiText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();
      tasks = JSON.parse(cleaned);
      if (!Array.isArray(tasks)) tasks = [];
    } catch {
      // If AI didn't return valid JSON, return empty
      tasks = [];
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("[AI Extract] Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
