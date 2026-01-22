
import React, { useState, useEffect, useRef } from 'react';
import { TestDefinition, TestResult } from '../types';

interface QuestionnaireProps {
  test: TestDefinition;
  onComplete: (result: TestResult) => void;
  onCancel: () => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({ test, onComplete, onCancel }) => {
  const [isStarted, setIsStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const totalSteps = test.questions.length;
  const currentQuestion = test.questions[currentStep];
  const progress = isStarted ? ((currentStep + 1) / totalSteps) * 100 : 0;

  useEffect(() => {
    // Улучшенный скроллинг для мобильных
    if (isStarted && containerRef.current) {
      const headerOffset = 80; // учитываем шапку или просто делаем отступ
      const elementPosition = containerRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, [isStarted, currentStep]);

  const handleAnswer = (value: number) => {
    if (isProcessing || !currentQuestion) return;
    
    setIsProcessing(true);
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
    
    // Небольшая задержка для визуального отклика
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

  const getOptions = () => {
    if (['phq-9', 'gad-7'].includes(test.id)) {
      return [
        { val: 1, label: "Совсем нет" },
        { val: 2, label: "Несколько дней" },
        { val: 3, label: "Больше половины" },
        { val: 4, label: "Каждый день" }
      ];
    }
    if (['bdi-ii', 'bai'].includes(test.id)) {
      return [
        { val: 1, label: "Совсем нет" },
        { val: 2, label: "Слабо (не беспокоило)" },
        { val: 3, label: "Умеренно (неприятно)" },
        { val: 4, label: "Сильно (невыносимо)" }
      ];
    }
    return [
      { val: 1, label: "Никогда" },
      { val: 2, label: "Иногда" },
      { val: 3, label: "Часто" },
      { val: 4, label: "Почти всегда" }
    ];
  };

  if (!isStarted) {
    return (
      <div ref={containerRef} className="max-w-2xl mx-auto px-2 pt-4">
        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">{test.title}</h2>
            <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100 mb-8">
               <p className="text-teal-900 text-sm md:text-base leading-relaxed font-medium">{test.description}</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Инструкция:</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Пожалуйста, выберите наиболее подходящие ответы, основываясь на вашем состоянии за последние <strong>2 недели</strong>. Отвечайте честно, правильных или неправильных ответов нет.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => setIsStarted(true)} 
              className="flex-[2] py-5 bg-teal-600 text-white font-black rounded-2xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 active:scale-95 uppercase text-sm tracking-widest"
            >
              Начать тест
            </button>
            <button 
              onClick={onCancel} 
              className="flex-1 py-5 text-slate-400 font-bold hover:text-slate-600 transition-all uppercase text-xs tracking-widest"
            >
              Назад
            </button>
          </div>
        </div>
      </div>
    );
  }

  const options = getOptions();

  return (
    <div ref={containerRef} className="max-w-xl mx-auto px-2 pt-4">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="h-2 bg-slate-100 w-full">
          <div 
            className="h-full bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="p-6 md:p-12">
            <div className="flex justify-between items-center mb-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>{test.id.toUpperCase()} • Вопрос {currentStep + 1} / {totalSteps}</span>
                <button onClick={onCancel} className="hover:text-red-500 transition-colors bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Отмена</button>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-10 leading-tight">
                {currentQuestion.text}
            </h2>

            <div className={`space-y-3 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                {test.scaleType === 'binary' ? (
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => handleAnswer(1)} className="p-8 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 transition-all text-slate-700 font-black text-2xl active:scale-95 shadow-sm">Да</button>
                        <button onClick={() => handleAnswer(0)} className="p-8 rounded-2xl border-2 border-slate-50 bg-slate-50 hover:bg-red-50 hover:border-red-400 transition-all text-slate-700 font-black text-2xl active:scale-95 shadow-sm">Нет</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {options.map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => handleAnswer(opt.val)}
                                className="w-full p-5 rounded-2xl border-2 border-slate-50 bg-slate-50/50 hover:border-teal-400 hover:bg-white text-left transition-all flex justify-between items-center group active:scale-[0.98] shadow-sm hover:shadow-md"
                            >
                                <span className="font-bold text-slate-700 text-sm md:text-base leading-snug">{opt.label}</span>
                                <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-teal-400 shrink-0 ml-4 flex items-center justify-center transition-colors">
                                    <div className={`w-3 h-3 rounded-full bg-teal-600 transition-transform ${answers[currentQuestion.id] === opt.val ? 'scale-100' : 'scale-0'}`}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-50">
                <button 
                    disabled={currentStep === 0 || isProcessing}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 disabled:opacity-0 transition-all py-2"
                >
                    ← Назад
                </button>
                <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">
                  DIALECTICA DIAGNOSTIC
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
