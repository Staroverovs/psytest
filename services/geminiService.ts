
import { TestResult, TestDefinition } from '../types';

export const getInterpretation = async (result: TestResult, testDef: TestDefinition): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result, testDef }),
    });

    if (!response.ok) {
      // Если мы здесь, значит упали и Gemini, и Groq, и Static (что маловероятно для static, но возможно при 500)
      if (response.status === 429) {
         return `### ⏳ Высокая нагрузка\n\nСервисы искусственного интеллекта сейчас перегружены. Мы попробовали несколько каналов связи, но безуспешно.\n\n**Ваш результат сохранен: ${result.totalScore} баллов.**\n\nПожалуйста, подождите минуту и попробуйте снова.`;
      }
      if (response.status === 503) {
        return `### 🛠 Технические работы\n\nИИ-сервисы временно недоступны.\n\n**Ваш результат: ${result.totalScore} баллов.**`;
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка сервера');
    }

    const data = await response.json();
    return data.text || "Ошибка: Пустой ответ от сервиса.";
  } catch (error: any) {
    console.error("Fetch Error:", error);
    return `### ⚠️ Режим оффлайн\n\nНе удалось соединиться с сервером аналитики.\n\nВаш результат: **${result.totalScore} баллов**. \n\nПожалуйста, сохраните этот результат. Вы можете обсудить его со специалистом центра «Диалектика».`;
  }
};
