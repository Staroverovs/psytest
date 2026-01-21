
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
      Вы — ИИ-ассистент центра психологии «Диалектика». 
      Проведите клиническую интерпретацию баллов теста «${testDef.title}».
      
      ДАННЫЕ:
      - Результат: ${scoresSummary}
      
      ИНСТРУКЦИИ ПО ОФОРМЛЕНИЮ:
      1. Используйте Markdown. Заголовки уровня ###.
      2. Сделайте 3 раздела: 
         ### 📊 Что означают ваши баллы
         ### 🧠 Психологические механизмы
         ### 🌱 Рекомендации по самопомощи
      3. Тон: Профессиональный, поддерживающий, лаконичный.
      4. НЕ пишите приветствия ("Здравствуйте") и НЕ пишите дисклеймер (он будет добавлен автоматически).
      5. В конце добавьте блок: "Для глубокой проработки этих состояний приглашаем вас в центр «Диалектика»."
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
