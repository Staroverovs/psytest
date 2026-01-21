export interface Question {
  id: number;
  text: string;
  reverse?: boolean; // For DERS-36 reverse scoring
}

export interface TestDefinition {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  scaleType: 'likert_5' | 'binary'; // 1-5 or Yes/No
  subscales?: Record<string, number[]>; // Map subscale name to question IDs
}

export interface TestResult {
  testId: string;
  totalScore: number;
  subscaleScores?: Record<string, number>;
  maxPossibleScore: number;
  answers: Record<number, number>; // questionId -> value
  date: string;
}

export interface InterpretationResponse {
  markdownText: string;
}
