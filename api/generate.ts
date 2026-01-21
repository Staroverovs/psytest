
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
      Ваша задача: провести автоматизированную интерпретацию баллов теста «${testDef.title}».
      
      ВАЖНЫЕ ПРАВИЛА:
      1. Вы ДОЛЖНЫ четко заявить в начале, что вы — ИИ, а не живой врач.
      2. Не используйте фразы "я как ваш врач" или "на моей практике".
      3. Используйте фразы "алгоритмический анализ", "статистическая интерпретация", "на основе заложенных клинических норм".
      4. Дайте понять, что это предварительный скрининг.

      Данные для анализа:
      - Результат: ${scoresSummary}
      
      Структура ответа (Markdown):
      1. Дисклеймер: "Данный анализ сформирован искусственным интеллектом на базе предоставленных вами ответов..."
      2. Расшифровка баллов: что они означают согласно методике.
      3. Возможные направления работы: на что стоит обратить внимание.
      4. Рекомендация: "Для получения точного диагноза и плана лечения рекомендуем обратиться к специалистам центра «Диалектика» (cnpp.ru)".
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
