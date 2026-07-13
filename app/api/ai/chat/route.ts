import { NextRequest, NextResponse } from "next/server";

const AI_API_URL =
  "https://chat.immers.cloud/v1/endpoints/qwen3-coder-next-tensor/generate/chat/completions";
const AI_API_KEY = "8nUHGXIguyWCZDVOB_8VjpkV1W-oG4pu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body as {
      message: string;
      context?: string;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const systemPrompt = `Ты — умный AI-помощник в трекере задач "In Motion". Твоя задача — помогать пользователю с его задачами, финансами, привычками и планированием.

Ты НЕ умеешь искать информацию в интернете. Отвечай только на основе данных, которые переданы в контексте ниже.

Правила:
1. Отвечай кратко, по делу, на русском языке.
2. Если спрашивают про задачи — смотри контекст и дай сводку, сколько задач, какие приоритеты, что просрочено.
3. Если спрашивают про финансы — расскажи про баланс, доходы, расходы, обязательства.
4. Если спрашивают про привычки — покажи статистику, streak, прогресс.
5. Можешь давать советы по планированию дня, распределению бюджета, улучшению привычек.
6. Если данных недостаточно — честно скажи, что не знаешь, и предложи что-то полезное.
7. Не придумывай цифры и факты — используй только то, что в контексте.
8. Если пользователь здоровается — поприветствуй в ответ и предложи варианты помощи.
9. Будь дружелюбным, но профессиональным.

Пример ответа на приветствие:
"Привет! 👋 Я — твой AI-помощник. Могу рассказать о твоих задачах на сегодня, помочь с финансами или привычками. Вот что я умею:
• 📋 Посмотреть задачи на сегодня
• 💰 Анализ финансов и бюджета
• 📊 Статистика привычек
• 💡 Советы по планированию

Что тебя интересует?"`;

    const externalBody = {
      model: "Qwen3-Coder-Next",
      messages: [
        { role: "system", content: systemPrompt },
        ...(context
          ? [{ role: "system", content: `Контекст пользователя:\n${context}` }]
          : []),
        { role: "user", content: message },
      ],
      temperature: 0,
      max_tokens: 2048,
    };

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(externalBody),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Chat] External API error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI-сервис временно недоступен" },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 },
    );
  }
}
