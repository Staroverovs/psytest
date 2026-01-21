
import { GoogleGenAI } from "@google/genai";
import { TestResult, TestDefinition } from '../types';

/**
 * Пытается найти API ключ в различных глобальных хранилищах.
 * На Vercel для фронтенд-приложений важно использовать префикс VITE_ 
 * или настраивать билд-стек.
 */
const findApiKey = (): string | undefined => {
  try {
    // 1. Стандартный путь для Node/билдеров
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.API_KEY) return process.env.API_KEY;
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.VITE_API_KEY) return process.env.VITE_API_KEY;
    
    // 2. Путь для Vite (import.meta)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) return import.meta.env.VITE_API_KEY;
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env?.API_KEY) return import.meta.env.API_KEY;

    // 3. Проверка глобального объекта window (иногда ключи инжектятся туда)
    // @ts-ignore
    if (typeof window !== 'undefined' && window._ENV_?.API_KEY) return window._ENV_.API_KEY;
  } catch (e) {
    console.warn("Ошибка при поиске API_KEY:", e);
  }
  return undefined;
};

export const getInterpretation = async (result: TestResult, testDef: TestDefinition): Promise<string> => {
  const key = findApiKey();
  
  if (!key || key.length < 10) {
    console.error("CRITICAL: API_KEY not found in environment.");
    return `
### ⚠️ Ошибка доступа к ИИ

Ключ API не найден в настройках вашего приложения на Vercel.

**Как исправить (инструкция для владельца):**
1. В панели Vercel (Settings -> Environment Variables) убедитесь, что ключ называется **VITE_API_KEY**.
2. Если вы используете простую загрузку без Vite, убедитесь, что в Vercel в настройках **Build Command** указано что-то вроде \`npm run build\` или \`vite build\`.
3. Обязательно сделайте **Redeploy** после переименования ключа.

---
Ваш результат: **${result.totalScore} баллов**.
    `;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });

    const isBPD = testDef.id === 'bpd-screen';
    const isPHQ = testDef.id === 'phq-9';
    const isGAD = testDef.id === 'gad-7';
    const isBDI = testDef.id === 'bdi-ii';
    const isBAI = testDef.id === 'bai';
    const isDERS = testDef.id === 'ders-36';
    
    let scoresSummary = "";
    if (isBPD) {
      scoresSummary = `Результат: ${result.totalScore} из ${result.maxPossibleScore}. Порог ПРЛ — 7 баллов.`;
    } else if (isPHQ) {
      scoresSummary = `Результат: ${result.totalScore} баллов (Макс: 27). 0-4 норма, 5-9 легкая, 10-14 средняя, 15-19 умеренно-тяжелая, 20+ тяжелая.`;
    } else if (isGAD) {
      scoresSummary = `Результат: ${result.totalScore} баллов (Макс: 21). 0-4 норма, 5-9 легкая, 10-14 средняя, 15+ тяжелая тревога.`;
    } else if (isBDI) {
      scoresSummary = `Результат: ${result.totalScore} баллов (Макс: 63). 0-13 норма, 14-19 легкая, 20-28 средняя, 29+ тяжелая.`;
    } else if (isBAI) {
      scoresSummary = `Результат: ${result.totalScore} баллов (Макс: 63). 0-7 норма, 8-15 легкая, 16-25 средняя, 26+ тяжелая.`;
    } else if (isDERS) {
      scoresSummary = `Общий балл дисрегуляции: ${result.totalScore} (Макс: 180).`;
      if (result.subscaleScores) {
        for (const [subName, val] of Object.entries(result.subscaleScores)) {
          scoresSummary += `\n- ${subName}: ${val}`;
        }
      }
    }

    const prompt = `
      Вы — экспертный клинический психолог центра «Диалектика» (сайт cnpp.ru). 
      Ваша задача: интерпретировать результаты теста «${testDef.title}».
      
      Данные пациента:
      - Общий балл: ${result.totalScore} из ${result.maxPossibleScore}
      - Детализация: ${scoresSummary}
      
      Напишите отчет, который:
      1. Начинается с фразы "Данный анализ подготовлен искусственным интеллектом на основе ваших ответов..."
      2. Объясняет значение полученных баллов понятным языком.
      3. Описывает возможные психологические механизмы (без постановки окончательного диагноза).
      4. Дает 3 кратких рекомендации по самопомощи.
      5. Заканчивается приглашением на консультацию в центр «Диалектика».
      
      Стиль: Профессиональный, бережный, без пугающих формулировок. Используйте Markdown для оформления.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Ошибка: ИИ вернул пустой ответ.";

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `### ⚠️ Ошибка связи с ИИ\n\nНе удалось получить интерпретацию. Ваш балл: **${result.totalScore}**. Пожалуйста, попробуйте позже или обратитесь напрямую в центр.`;
  }
};
