
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { TestResult, TestDefinition } from '../types';
import { getInterpretation } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';

interface ResultViewProps {
  result: TestResult;
  testDef: TestDefinition;
  onReset: () => void;
}

const LoadingIndicator = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Анализируем ваши ответы...",
    "Изучаем паттерны реакций...",
    "Формируем рекомендации...",
    "Сверяемся с нормами..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 space-y-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      <div className="text-center">
        <p className="text-slate-600 font-medium text-sm animate-pulse">{messages[messageIndex]}</p>
      </div>
    </div>
  );
};

export const ResultView: React.FC<ResultViewProps> = ({ result, testDef, onReset }) => {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Принудительный скролл к результату при загрузке
    if (topRef.current) {
        topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    let isMounted = true;
    const fetchInterpretation = async () => {
      const text = await getInterpretation(result, testDef);
      if (isMounted) {
        setInterpretation(text);
        setLoading(false);
      }
    };
    fetchInterpretation();
    return () => { isMounted = false; };
  }, [result, testDef]);

  const handleCopyReport = () => {
    if (interpretation) {
      navigator.clipboard.writeText(interpretation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const chartData = useMemo(() => {
    if (!result.subscaleScores) return [];
    return Object.keys(result.subscaleScores).map(key => ({
      subject: key,
      value: result.subscaleScores![key]
    }));
  }, [result]);

  const handleShareResult = async () => {
    const shareText = `Мой результат в тесте "${testDef.title}": ${result.totalScore} баллов. Пройти тест от центра «Диалектика»: ${window.location.origin}`;
    
    try {
      if (navigator.share && !window.location.href.includes('localhost')) {
        await navigator.share({
          title: 'Мой результат теста',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Результат и ссылка скопированы в буфер обмена');
      }
    } catch (e) { 
      // Fallback if share is cancelled or fails
      await navigator.clipboard.writeText(shareText);
      alert('Результат скопирован');
    }
  };

  const handleShareTest = async () => {
    const shareText = `Рекомендую пройти психологический тест "${testDef.title}" от центра «Диалектика». Это полезно для самопроверки: ${window.location.origin}`;
    try {
      if (navigator.share && !window.location.href.includes('localhost')) {
        await navigator.share({
          title: 'Рекомендую тест',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Ссылка на тест скопирована');
      }
    } catch (e) {
      await navigator.clipboard.writeText(shareText);
      alert('Ссылка скопирована');
    }
  };

  return (
    <div ref={topRef} className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12 px-1">
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 md:p-10 text-center border-b border-slate-50">
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
            Результаты диагностики
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 leading-tight">
            {testDef.title}
          </h2>
          <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('ru-RU')}</p>
        </div>

        {/* Score Section */}
        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 bg-teal-50/50 rounded-2xl p-8 text-center border border-teal-100 flex flex-col justify-center">
              <span className="text-teal-800 text-[10px] font-black uppercase tracking-widest mb-2">Набрано баллов</span>
              <span className="text-6xl font-black text-teal-600">{result.totalScore}</span>
              <span className="text-teal-500/50 text-xs mt-1 font-bold">из {result.maxPossibleScore}</span>
            </div>
            
            {result.subscaleScores && (
              <div className="flex-[2] h-64 md:h-auto min-h-[200px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="subject" type="category" width={90} tick={{fontSize: 9, fill: '#64748b', fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI Report Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                Разбор от ИИ-ассистента
              </h3>
              {!loading && interpretation && (
                <button onClick={handleCopyReport} className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100 active:scale-95 transition-all">
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              )}
            </div>

            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="p-5 md:p-8 text-slate-700 text-sm md:text-base leading-relaxed break-words overflow-hidden">
                  <ReactMarkdown 
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-base font-black text-teal-800 mb-3 mt-6 first:mt-0 flex items-center gap-2 border-l-4 border-teal-500 pl-3" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="space-y-2 mb-4 list-none p-0" {...props} />,
                      li: ({node, ...props}) => <li className="flex gap-2 items-start before:content-['•'] before:text-teal-500 before:font-bold" {...props} />,
                    }}
                  >
                    {interpretation || ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Disclaimer Block */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex gap-4 items-start">
              <div className="text-slate-400 shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div className="text-[10px] md:text-xs text-slate-500 leading-normal font-medium">
                <strong>Ограничение ответственности:</strong> Данный отчет сформирован алгоритмами искусственного интеллекта. Он не является медицинским диагнозом и не заменяет консультацию врача. Пожалуйста, обсудите результаты со специалистом.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={handleShareResult} className="flex items-center justify-center p-4 bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all active:scale-95 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Поделиться результатом
            </button>
            <button onClick={handleShareTest} className="flex items-center justify-center p-4 bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all active:scale-95 gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Порекомендовать тест
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
            <button onClick={onReset} className="flex-1 py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-all">
              К списку тестов
            </button>
            <a href="https://cnpp.ru" target="_blank" rel="noreferrer" className="flex-[2] inline-flex items-center justify-center py-4 bg-teal-600 text-white font-black rounded-xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 active:scale-95 uppercase text-xs tracking-widest">
              Записаться на консультацию
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
