
import { GoogleGenAI } from "@google/genai";
import { TestResult, TestDefinition } from '../types';

export const getInterpretation = async (result: TestResult, testDef: TestDefinition): Promise<string> => {
  try {
    /**
     * ПРАВИЛА ПОЛУЧЕНИЯ КЛЮЧА ДЛЯ VERCEL (Client-side):
     * 1. Стандартные переменные (API_KEY) доступны только на бэкенде.
     * 2. Для фронтенда (React/Vite) Vercel требует префикс VITE_ или NEXT_PUBLIC_.
     */
    
    // Пытаемся получить ключ из всех возможных мест, где его может оставить сборщик
    // @ts-ignore
    const key = process.env.API_KEY || 
                // @ts-ignore
                (typeof process !== 'undefined' ? process.env?.VITE_API_KEY : undefined) ||
                // @ts-ignore
                (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_KEY : undefined);
    
    if (!key || key === "undefined" || key.length < 10) {
      console.error("Ключ API не найден. Проверьте консоль и настройки Vercel.");
      return `
### ⚠️ ИИ не видит ключ API

Ваш результат: **${result.totalScore} баллов**.

**Инструкция для владельца сайта:**
Для того чтобы ИИ заработал на Vercel во фронтенд-приложении, переменная окружения **ОБЯЗАТЕЛЬНО** должна называться так:
1. Переименуйте в Vercel \`API_KEY\` в **\`VITE_API_KEY\`**.
2. Нажмите **Redeploy** в панели управления Vercel.

Это необходимо, чтобы сборщик Vite разрешил передать ключ в браузер.
      `;
    }

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
