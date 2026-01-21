
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
          // Скроллим к началу теста на мобилках при смене вопроса
          if (window.innerWidth < 768) {
             window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } else {
          finishTest({ ...answers, [currentQuestion.id]: value });
        }
    }, 200);
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
              scoreValue = rawValue - 1;
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
        { val: 3, label: "Больше половины" },
        { val: 4, label: "Почти каждый день" }
      ];
    }
    if (['bdi-ii', 'bai'].includes(test.id)) {
      return [
        { val: 1, label: "Совсем нет" },
        { val: 2, label: "Слабо" },
        { val: 3, label: "Умеренно" },
        { val: 4, label: "Сильно" }
      ];
    }
    return [
      { val: 1, label: "Никогда" },
      { val: 2, label: "Иногда" },
      { val: 3, label: "Часто" },
      { val: 4, label: "Почти всегда" }
    ];
  };

  const options = getOptions();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="h-1.5 bg-slate-100 w-full">
          <div 
            className="h-full bg-teal-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="p-5 md:p-8">
            <div className="flex justify-between items-center mb-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Вопрос {currentStep + 1} / {totalSteps}</span>
                <button onClick={onCancel} className="hover:text-red-500 transition-colors">Выйти</button>
            </div>

            <h2 className="text-lg md:text-2xl font-semibold text-slate-800 mb-8 leading-snug">
                {currentQuestion.text}
            </h2>

            <div className={`space-y-3 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                {test.scaleType === 'binary' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleAnswer(1)} className="p-4 md:p-6 rounded-xl border-2 text-center hover:bg-teal-50 transition-all border-slate-100 text-slate-700 font-bold text-lg active:scale-95">Да</button>
                        <button onClick={() => handleAnswer(0)} className="p-4 md:p-6 rounded-xl border-2 text-center hover:bg-red-50 transition-all border-slate-100 text-slate-700 font-bold text-lg active:scale-95">Нет</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => handleAnswer(opt.val)}
                                className="w-full p-4 md:p-5 rounded-xl border-2 text-left transition-all flex justify-between items-center group border-slate-50 hover:border-teal-200 hover:bg-teal-50/30 text-slate-700 active:scale-[0.98]"
                            >
                                <span className="font-medium text-sm md:text-base">{opt.label}</span>
                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-200 group-hover:border-teal-400 shrink-0 ml-3">
                                    {answers[currentQuestion.id] === opt.val && <div className="w-2.5 h-2.5 bg-teal-600 rounded-full"></div>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-8">
                <button 
                    disabled={currentStep === 0 || isProcessing}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="text-slate-400 font-bold text-sm hover:text-slate-600 disabled:opacity-0 transition-all"
                >
                    ← Назад
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
