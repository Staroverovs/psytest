import React, { useState } from 'react';
import { TestDefinition, TestResult } from '../types';

interface QuestionnaireProps {
  test: TestDefinition;
  onComplete: (result: TestResult) => void;
  onCancel: () => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ test, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const totalSteps = test.questions.length;

  const currentQuestion = test.questions[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleAnswer = (value: number) => {
    if (isProcessing || !currentQuestion) return;
    
    setIsProcessing(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    setTimeout(() => {
        if (currentStep < totalSteps - 1) {
          setCurrentStep(prev => prev + 1);
          setIsProcessing(false);
        } else {
          finishTest({ ...answers, [currentQuestion.id]: value });
        }
    }, 250);
  };

  const finishTest = (finalAnswers: Record<number, number>) => {
    let totalScore = 0;
    const subscaleScores: Record<string, number> = {};

    if (test.subscales) {
        Object.keys(test.subscales).forEach(key => subscaleScores[key] = 0);
    }

    test.questions.forEach(q => {
        const rawValue = finalAnswers[q.id];
        let scoreValue = rawValue || 0;

        const is0to3Scale = ['phq-9', 'gad-7', 'bdi-ii', 'bai'].includes(test.id);

        if (test.scaleType === 'likert_5') {
            if (is0to3Scale) {
              scoreValue = rawValue - 1; // Map 1-4 UI to 0-3 scores
            } else if (q.reverse) {
              scoreValue = 6 - rawValue; 
            }
        }
        
        totalScore += scoreValue;

        if (test.subscales) {
            Object.entries(test.subscales).forEach(([key, ids]) => {
                if ((ids as number[]).includes(q.id)) {
                    subscaleScores[key] += scoreValue;
                }
            });
        }
    });

    const result: TestResult = {
        testId: test.id,
        totalScore,
        maxPossibleScore: ['phq-9'].includes(test.id) ? 27 : 
                          (['gad-7'].includes(test.id) ? 21 : 
                          (['bdi-ii', 'bai'].includes(test.id) ? 63 : 
                          (test.scaleType === 'likert_5' ? totalSteps * 5 : totalSteps))),
        subscaleScores: test.subscales ? subscaleScores : undefined,
        answers: finalAnswers,
        date: new Date().toISOString()
    };

    onComplete(result);
  };

  if (!currentQuestion) return null;

  const getOptions = () => {
    if (['phq-9', 'gad-7'].includes(test.id)) {
      return [
        { val: 1, label: "Совсем нет" },
        { val: 2, label: "Несколько дней" },
        { val: 3, label: "Больше половины дней" },
        { val: 4, label: "Почти каждый день" }
      ];
    }
    if (['bdi-ii', 'bai'].includes(test.id)) {
      return [
        { val: 1, label: "Совсем нет (или не беспокоит)" },
        { val: 2, label: "Слабо / Незначительно" },
        { val: 3, label: "Умеренно (неприятно, но терпимо)" },
        { val: 4, label: "Сильно (почти невыносимо)" }
      ];
    }
    return [
      { val: 1, label: "Почти никогда" },
      { val: 2, label: "Иногда" },
      { val: 3, label: "Примерно половину времени" },
      { val: 4, label: "Часто" },
      { val: 5, label: "Почти всегда" }
    ];
  };

  const options = getOptions();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-2 bg-slate-100 w-full">
          <div 
            className="h-full bg-teal-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="p-8">
            <div className="flex justify-between items-center mb-8 text-sm text-slate-400">
                <span>Вопрос {currentStep + 1} из {totalSteps}</span>
                <button onClick={onCancel} className="hover:text-red-500 transition-colors">Выйти</button>
            </div>

            <h2 className="text-xl md:text-2xl font-medium text-slate-800 mb-8 leading-relaxed">
                {currentQuestion.text}
            </h2>

            <div className={`space-y-3 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                {test.scaleType === 'binary' ? (
                    <>
                        <button onClick={() => handleAnswer(1)} className="w-full p-4 rounded-lg border text-left hover:bg-slate-50 transition-colors border-slate-200 text-slate-700 font-medium">Да</button>
                        <button onClick={() => handleAnswer(0)} className="w-full p-4 rounded-lg border text-left hover:bg-slate-50 transition-colors border-slate-200 text-slate-700 font-medium">Нет</button>
                    </>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => handleAnswer(opt.val)}
                                className="w-full p-4 rounded-lg border text-left transition-all flex justify-between items-center group border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-600"
                            >
                                <span className="font-medium">{opt.label}</span>
                                <div className="w-5 h-5 rounded-full border flex items-center justify-center border-slate-300 group-hover:border-teal-400">
                                    {answers[currentQuestion.id] === opt.val && <div className="w-3 h-3 bg-teal-600 rounded-full"></div>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-8 flex justify-between">
                <button 
                    disabled={currentStep === 0 || isProcessing}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2"
                >
                    Назад
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};