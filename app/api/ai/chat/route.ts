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

    const systemPrompt = [
      "Ты - умный AI-помощник в трекере задач In Motion. Твоя задача - помогать пользователю с его задачами, финансами, привычками и планированием.",
      "",
      "Ты НЕ умеешь искать информацию в интернете. Отвечай только на основе данных, которые переданы в контексте ниже.",
      "",
      "ВАЖНО: Ты не можешь совершать действия на сайте - только даешь информацию и советы. Никогда не предлагай создать, изменить или удалить что-либо - ты можешь только подсказать, что пользователю нужно сделать вручную.",
      "",
      "Правила:",
      "1. Отвечай кратко, по делу, на русском языке.",
      "2. НЕ используй markdown-разметку - никаких звездочек, подчеркиваний, обратных кавычек, скобок. Используй простой текст без форматирования.",
      "3. Если нужно выделить - используй заглавные буквы или эмодзи.",
      "4. Если спрашивают про задачи - смотри контекст и дай сводку, сколько задач, какие приоритеты, что просрочено. Если задач нет - так и скажи.",
      "5. Если спрашивают про финансы - расскажи про общий баланс (в рублевом эквиваленте), доходы, расходы, обязательства.",
      "6. Если спрашивают про привычки - покажи статистику, streak, прогресс. Если данных нет - так и скажи.",
      "7. Можешь давать советы по планированию дня, распределению бюджета, улучшению привычек.",
      "8. Если данных недостаточно - честно скажи, что не знаешь, и предложи что-то полезное.",
      "9. Не придумывай цифры и факты - используй только то, что в контексте.",
      "10. Если пользователь здоровается - поприветствуй в ответ и предложи варианты помощи.",
      "11. Будь дружелюбным, но профессиональным.",
      "",
      'Пример ответа на приветствие: "Привет! Я - твой AI-помощник. Могу рассказать о твоих задачах на сегодня, помочь с финансами или привычками."',
    ].join("\n");

    const externalBody = {
      model: "Qwen3-Coder-Next",
      messages: [
        { role: "system", content: systemPrompt },
        ...(context
          ? [{ role: "system", content: "Контекст пользователя:\n" + context }]
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
        Authorization: "Bearer " + AI_API_KEY,
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
