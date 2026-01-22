
import { GoogleGenAI } from "@google/genai";
import { getStaticInterpretation } from "../utils/staticInterpretations";

export const config = {
  runtime: 'edge',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- GEMINI LOGIC ---
async function generateWithGemini(apiKey: string, prompt: string, retries = 1): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!response.text) throw new Error("Empty response from Gemini");
    return response.text;
  } catch (error: any) {
    const status = error.status || error.response?.status;
    if ((status === 429 || status === 503) && retries > 0) {
      await delay(1000);
      return generateWithGemini(apiKey, prompt, retries - 1);
    }
    throw error;
  }
}

// --- GROQ LOGIC ---
async function generateWithGroq(apiKey: string, prompt: string, retries = 1): Promise<string> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Мощная и быстрая модель
        messages: [
          { 
            role: "system", 
            content: "Ты — профессиональный клинический психолог. Ты отвечаешь строго в формате Markdown. Твоя задача — дать глубокую, эмпатичную интерпретацию результатов теста." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      // Если лимит запросов (429), пробуем еще раз
      if (response.status === 429 && retries > 0) {
        await delay(1000);
        return generateWithGroq(apiKey, prompt, retries - 1);
      }
      throw new Error(`Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    throw error;
  }
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { result, testDef } = await req.json();
    
    // Получаем ключи
    const geminiKey = process.env.API_KEY || process.env.VITE_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    // Формируем сводку и промпт
    let scoresSummary = `Общий балл: ${result.totalScore} из ${result.maxPossibleScore}.`;
    if (result.subscaleScores && Object.keys(result.subscaleScores).length > 0) {
      scoresSummary += "\nПоказатели по конкретным аспектам:";
      for (const [subName, val] of Object.entries(result.subscaleScores)) {
        scoresSummary += `\n- ${subName}: ${val}`;
      }
    }

    const prompt = `
      Вы — ведущий эксперт-психолог центра «Диалектика». Ваша задача — интерпретировать результаты теста «${testDef.title}».
      
      ДАННЫЕ ТЕСТИРОВАНИЯ:
      ${scoresSummary}
      
      ИНСТРУКЦИИ ПО КОНТЕНТУ:
      1. Тон голоса: профессиональный, теплый, валидирующий (в стиле КПТ или DBT).
      2. Не пугайте диагнозами, говорите о состояниях и паттернах.
      3. Опишите внутреннюю механику: почему такие баллы могли получиться.
      4. Дайте 3 конкретных микро-практики (дыхание, техники заземления, когнитивные техники).
      
      ОФОРМЛЕНИЕ (MARKDOWN):
      Заголовки только ###.
      Короткие абзацы.
      
      СТРУКТУРА ОТВЕТА:
      ### 🧭 Глубинный анализ состояния
      ### 🧬 Психологический механизм
      ### 🛠 Персональные рекомендации
      
      Начни с: "Я — ИИ-ассистент центра «Диалектика». Основываясь на ваших ответах..."
      Закончи приглашением в центр «Диалектика» (cnpp.ru).
    `;

    // --- CASCADE STRATEGY ---
    
    // 1. Попытка GEMINI
    if (geminiKey) {
      try {
        const text = await generateWithGemini(geminiKey, prompt);
        return new Response(JSON.stringify({ text }), { status: 200, headers: {'Content-Type': 'application/json'} });
      } catch (geminiError) {
        console.warn("Gemini failed, trying fallback...", geminiError);
      }
    }

    // 2. Попытка GROQ (если Gemini упал или ключа нет)
    if (groqKey) {
      try {
        console.log("Attempting Groq generation...");
        const text = await generateWithGroq(groqKey, prompt);
        return new Response(JSON.stringify({ text }), { status: 200, headers: {'Content-Type': 'application/json'} });
      } catch (groqError) {
        console.warn("Groq failed, trying static fallback...", groqError);
      }
    }

    // 3. STATIC FALLBACK (если все упало)
    console.warn("All AI services failed/missing. Using static interpretation.");
    const staticText = getStaticInterpretation(result, testDef);
    return new Response(JSON.stringify({ text: staticText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Critical Server Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
