
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
    // При изменении шага скроллим к началу карточки вопроса
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isStarted, currentStep]);

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
        { val: 1, label: "Совсем нет" },
        { val: 2, label: "Слабо (не беспокоило)" },
        { val: 3, label: "Умеренно (было неприятно)" },
        { val: 4, label: "Сильно (почти невыносимо)" }
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
      <div ref={containerRef} className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
          <div className="mb-10">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">{test.title}</h2>
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100">
               <p className="text-teal-900 text-sm italic font-medium leading-relaxed">{test.description}</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
              Инструкция:
            </h3>
            <ul className="space-y-5 text-slate-600">
              <li className="flex gap-4 items-center">
                <span className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-sm font-black text-teal-600 shrink-0 shadow-sm">1</span>
                <span className="font-medium text-sm">Отвечайте искренне. Нет «правильных» ответов.</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-sm font-black text-teal-600 shrink-0 shadow-sm">2</span>
                <span className="font-medium text-sm">Вспоминайте свое состояние за <strong>последние 2 недели</strong>.</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-sm font-black text-teal-600 shrink-0 shadow-sm">3</span>
                <span className="font-medium text-sm">Первая мысль обычно самая верная.</span>
              </li>
            </ul>
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
              Отмена
            </button>
          </div>
        </div>
      </div>
    );
  }

  const options = getOptions();

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="h-2 bg-slate-100 w-full">
          <div 
            className="h-full bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="p-7 md:p-12">
            <div className="flex justify-between items-center mb-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <span>Вопрос {currentStep + 1} / {totalSteps}</span>
                <button onClick={onCancel} className="hover:text-red-500 transition-colors bg-slate-50 px-3 py-1 rounded-full border border-slate-100">Прервать</button>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-12 leading-snug">
                {currentQuestion.text}
            </h2>

            <div className={`space-y-4 ${isProcessing ? 'opacity-40 pointer-events-none' : ''}`}>
                {test.scaleType === 'binary' ? (
                    <div className="grid grid-cols-2 gap-5">
                        <button onClick={() => handleAnswer(1)} className="p-8 md:p-12 rounded-3xl border-2 text-center hover:bg-teal-50 hover:border-teal-200 transition-all border-slate-50 text-slate-700 font-black text-2xl active:scale-95 shadow-sm">Да</button>
                        <button onClick={() => handleAnswer(0)} className="p-8 md:p-12 rounded-3xl border-2 text-center hover:bg-red-50 hover:border-red-100 transition-all border-slate-50 text-slate-700 font-black text-2xl active:scale-95 shadow-sm">Нет</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {options.map((opt) => (
                            <button
                                key={opt.val}
                                onClick={() => handleAnswer(opt.val)}
                                className="w-full p-5 md:p-6 rounded-[1.25rem] border-2 text-left transition-all flex justify-between items-center group border-slate-50 bg-slate-50/30 hover:border-teal-400 hover:bg-white text-slate-700 active:scale-[0.98] shadow-sm hover:shadow-md"
                            >
                                <span className="font-bold text-base md:text-lg">{opt.label}</span>
                                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-slate-200 group-hover:border-teal-400 shrink-0 ml-4 transition-colors">
                                    <div className={`w-4 h-4 rounded-full transition-all ${answers[currentQuestion.id] === opt.val ? 'bg-teal-600 scale-100' : 'bg-transparent scale-0'}`}></div>
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
                    className="text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-800 disabled:opacity-0 transition-all py-2"
                >
                    ← Назад
                </button>
                <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
                  Dialectica AI Diagnostic
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
