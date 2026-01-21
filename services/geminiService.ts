
import { TestResult, TestDefinition } from '../types';

export const getInterpretation = async (result: TestResult, testDef: TestDefinition): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, testDef }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка сервера');
    }

    const data = await response.json();
    return data.text || "Ошибка: ИИ вернул пустой ответ.";
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return `### ⚠️ Проблема с доступом к ИИ\n\nНе удалось соединиться с сервером интерпретации. \n\nВаш результат: **${result.totalScore} баллов**. \n\nПожалуйста, попробуйте обновить страницу или сохраните ваш результат для обсуждения со специалистом.`;
  }
};
