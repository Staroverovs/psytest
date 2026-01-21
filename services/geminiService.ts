
import { GoogleGenAI } from "@google/genai";
import { TestResult, TestDefinition } from '../types';

// Примечание: При деплое на Vercel или использовании прокси, запросы будут проходить успешно.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInterpretation = async (result: TestResult, testDef: TestDefinition): Promise<string> => {
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
      for (const [key, val] of Object.entries(result.subscaleScores)) {
        scoresSummary += `\n- ${key}: ${val}`;
      }
    }
  }

  const prompt = `
    Вы — экспертный психолог центра «Диалектика». Составьте отчет по тесту «${testDef.title}».
    Результаты: ${scoresSummary}
    
    Требования:
    - Тон: профессиональный, эмпатичный, поддерживающий.
    - Структура: Дисклеймер (ИИ-анализ), Анализ состояния, Рекомендации.
    - Обязательно объясните, что значат эти цифры для жизни человека.
    - В конце добавьте: "Для глубокой проработки этих состояний вы можете обратиться к специалистам нашего центра на cnpp.ru".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    if (!response || !response.text) throw new Error("Empty response");
    return response.text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Проверка на типичные ошибки блокировки
    if (error.message?.includes('fetch') || error.message?.includes('User location')) {
      return "### 🌐 Ограничение доступа\nПохоже, прямой доступ к API Google ограничен в вашем регионе. \n\n**Ваш результат: " + result.totalScore + " баллов.**\n\nДля получения полной интерпретации рекомендуем использовать VPN или обратиться к нам на сайте **cnpp.ru**.";
    }
    
    return "### ⚠️ Ошибка анализа\nНам не удалось связаться с ИИ для интерпретации. \n**Ваш балл: " + result.totalScore + "**. Пожалуйста, сохраните этот результат для консультации со специалистом.";
  }
};
