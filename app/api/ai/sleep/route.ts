import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

const AI_API_URL =
  "https://chat.immers.cloud/v1/endpoints/qwen3-coder-next-tensor/generate/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "8nUHGXIguyWCZDVOB_8VjpkV1W-oG4pu";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;

  try {
    const body = await request.json();
    const { message } = body as { message: string };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const systemPrompt = [
      "Ты — Sleep AI, эксперт по сну и восстановлению. Твоя задача — помогать пользователю с вопросами о сне, циклах сна, качестве отдыха, трактовке сновидений и рекомендациях по режиму.",
      "",
      "Ты НЕ умеешь искать информацию в интернете. Отвечай только на основе своих знаний.",
      "",
      "Правила:",
      "1. Отвечай кратко, по делу, на русском языке.",
      "2. НЕ используй markdown-разметку — никаких звездочек, подчеркиваний, обратных кавычек. Используй простой текст.",
      "3. Если нужно выделить — используй заглавные буквы или эмодзи.",
      "4. Давай конкретные рекомендации по времени сна, количеству циклов, гигиене сна.",
      "5. Трактуй сны на основе общих психологических интерпретаций, но предупреждай что это общие значения.",
      "6. Объясняй что такое циклы сна, фазы (NREM, REM), как считать оптимальное время подъёма.",
      "7. Если вопрос не связан с жизнью — вежливо перенаправь на общего AI-помощника.",
      "8. Не придумывай медицинские диагнозы. При серьёзных проблемах со сном рекомендуй обратиться к врачу.",
      "9. Будь дружелюбным и заботливым. Ты как друг, который разбирается в сне.",
      "10. Один цикл сна = ~90 минут. Оптимально 5-6 циклов = 7.5-9 часов.",
      "11. Учитывай что время на засыпание обычно 10-20 минут.",
      "12. Можешь помочь рассчитать оптимальное время сна/подъёма по циклам.",
      "13. Рассказывай про влияние света, температуры, кофеина, еды на сон.",
      "14. Объясняй概念睡眠овых стадий: засыпание, лёгкий сон, глубокий сон, REM-фаза.",
    ].join("\n");

    const externalBody = {
      model: "Qwen3-Coder-Next",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
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
      console.error("[Sleep AI] External API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI-сервис временно недоступен" },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Sleep AI] Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
