import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { CONTENT_PLANNER_PROMPT } from "@/lib/ai-content-prompt";
import { DEVELOPER_PROMPT } from "@/lib/ai-developer-prompt";

const AI_API_URL =
  "https://chat.immers.cloud/v1/endpoints/qwen3-coder-next-tensor/generate/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "8nUHGXIguyWCZDVOB_8VjpkV1W-oG4pu";

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  attachmentText?: string;
}

function flatten(content: string, attachmentText?: string): string {
  if (!attachmentText) return content;
  return `${content}\n\n[Приложение к сообщению]\n${attachmentText}`;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const { message, history, messageAttachmentText, mode } = body as {
      message?: string;
      history?: HistoryMessage[];
      messageAttachmentText?: string;
      mode?: "content" | "dev";
    };

    if (
      !message ||
      typeof message !== "string" ||
      (!message.trim() && !messageAttachmentText)
    ) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const safeHistory: HistoryMessage[] = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant"),
          )
          .slice(-20)
      : [];

    const systemPrompt = mode === "dev" ? DEVELOPER_PROMPT : CONTENT_PLANNER_PROMPT;

    const externalBody = {
      model: "Qwen3-Coder-Next",
      messages: [
        { role: "system", content: systemPrompt },
        ...safeHistory.map((m) => ({
          role: m.role,
          content: flatten(m.content, m.attachmentText),
        })),
        {
          role: "user",
          content: flatten(message, messageAttachmentText),
        },
      ],
      temperature: 0.8,
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
      console.error(
        "[Content Planner AI] External API error:",
        response.status,
        errorText,
      );
      return NextResponse.json(
        { error: "AI-сервис временно недоступен" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Content Planner AI] Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
