
import { GoogleGenAI } from "@google/genai";
import { TestResult, TestDefinition } from '../types';

export const getInterpretation = async (result: TestResult, testDef: TestDefinition): Promise<string> => {
  // Прямое обращение к process.env.API_KEY согласно правилам SDK.
  // В Vercel эта переменная подставляется автоматически при наличии в настройках проекта.
  
  try {
    // Проверка наличия ключа перед инициализацией
    const key = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    
    if (!key) {
      console.error("Gemini API Key is missing in process.env.API_KEY");
      return `### ⚠️ Ошибка доступа к ИИ\n\nКлюч API не найден в настройках сервера. \n\n**Ваш результат: ${result.totalScore} баллов.**\n\n**Инструкция для исправления:**\n1. Зайдите в панель управления Vercel.\n2. Добавьте Environment Variable с именем \`API_KEY\`.\n3. Сделайте **Redeploy** проекта.`;
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
        for (const [key, val] of Object.entries(result.subscaleScores)) {
          scoresSummary += `\n- ${key}: ${val}`;
        }
      }
    }

    const prompt = `
      Вы — экспертный психолог центра «Диалектика» (сайт cnpp.ru). Составьте отчет по тесту «${testDef.title}».
      Результаты пациента: ${scoresSummary}
      
      Требования к отчету:
      1. Профессиональный, поддерживающий и эмпатичный тон.
      2. Структура: Дисклеймер (ИИ-анализ), Краткий разбор баллов, Интерпретация, Рекомендации.
      3. В конце добавьте: "Для глубокой проработки этих состояний вы можете обратиться к специалистам нашего центра на cnpp.ru".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Не удалось получить текстовый ответ от ИИ.";

  } catch (error: any) {
    console.error("Gemini Execution Error:", error);
    
    if (error.message?.includes('API_KEY_INVALID') || error.status === 403) {
      return `### 🔑 Проблема с ключом\n\nКлюч API отклонен сервером Google. Проверьте, что ключ активен в Google AI Studio.`;
    }

    return `### ⚠️ Ошибка анализа\nНе удалось связаться с сервером ИИ. \n\n**Ваш результат: ${result.totalScore} баллов.**\n\nПожалуйста, сохраните этот результат для обсуждения со специалистом центра «Диалектика».`;
  }
};
