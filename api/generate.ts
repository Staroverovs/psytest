
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { result, testDef } = await req.json();
    const apiKey = process.env.API_KEY || process.env.VITE_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured on server' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const isDERS = testDef.id === 'ders-36';
    let scoresSummary = `Общий балл: ${result.totalScore} из ${result.maxPossibleScore}.`;
    if (isDERS && result.subscaleScores) {
      scoresSummary += "\nПоказатели по шкалам:";
      for (const [subName, val] of Object.entries(result.subscaleScores)) {
        scoresSummary += `\n- ${subName}: ${val}`;
      }
    }

    const prompt = `
      Вы — ИИ-ассистент (искусственный интеллект) центра психологии «Диалектика». 
      Ваша задача: провести автоматизированный анализ баллов теста «${testDef.title}».
      
      ВАЖНЫЕ ПРАВИЛА:
      1. Начните с четкого заявления: "Я — искусственный интеллект, ассистент центра «Диалектика»..."
      2. Не имитируйте живого врача. Используйте формулировки "анализ данных", "статистические показатели".
      3. Оформляйте ответ строго в Markdown с использованием ### для заголовков.
      4. Пишите лаконично, короткими абзацами, чтобы текст легко читался на экранах мобильных телефонов.
      
      ДАННЫЕ:
      - Результат: ${scoresSummary}
      
      СТРУКТУРА:
      ### 📊 Оценка состояния
      ### 🧠 Возможные причины
      ### 🌱 Рекомендации
      
      В конце добавьте: "Для получения точного диагноза обратитесь к специалистам центра «Диалектика»."
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return new Response(JSON.stringify({ text: response.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
