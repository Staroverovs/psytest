
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
    "Связываемся с ИИ-ассистентом...",
    "Анализируем ваши паттерны...",
    "Подбираем рекомендации...",
    "Завершаем диагностику..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
      <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-6"></div>
      <p className="text-slate-600 font-bold text-center text-sm md:text-base animate-pulse">{messages[messageIndex]}</p>
    </div>
  );
};

export const ResultView: React.FC<ResultViewProps> = ({ result, testDef, onReset }) => {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const getShareUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set('tid', testDef.id);
    url.searchParams.set('score', result.totalScore.toString());
    return url.toString();
  };

  const handleShareResult = async () => {
    const shareUrl = getShareUrl();
    const shareText = `Мой результат в тесте "${testDef.title}": ${result.totalScore} баллов. Пройти психологический разбор от центра «Диалектика»:`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Мои результаты диагностики',
          text: `${shareText}\n${shareUrl}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Ссылка на результат скопирована');
      }
    } catch (e) { 
      if ((e as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Результат скопирован');
      }
    }
  };

  const handleShareTest = async () => {
    const shareUrl = window.location.origin + window.location.pathname;
    const shareText = `Рекомендую пройти психологический тест "${testDef.title}" от центра «Диалектика». Очень полезно для самопознания:`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Рекомендую тест',
          text: `${shareText}\n${shareUrl}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Ссылка на тест скопирована');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Ссылка скопирована');
      }
    }
  };

  return (
    <div ref={topRef} className="max-w-3xl mx-auto space-y-6 pb-12 px-2 md:px-0">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-8 md:p-12 text-center border-b border-slate-50">
          <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Отчет сформирован</span>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-2 leading-tight">{testDef.title}</h2>
          <p className="text-slate-400 font-bold text-sm">{new Date().toLocaleDateString('ru-RU')}</p>
        </div>

        {/* Score & Chart */}
        <div className="p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-teal-50 rounded-3xl p-8 text-center border border-teal-100 flex flex-col justify-center">
              <span className="text-teal-800 text-[10px] font-black uppercase tracking-widest mb-2">Общий балл</span>
              <span className="text-6xl font-black text-teal-600 leading-none">{result.totalScore}</span>
              <span className="text-teal-500/50 text-xs mt-3 font-bold uppercase tracking-tighter">из {result.maxPossibleScore}</span>
            </div>
            
            {result.subscaleScores && Object.keys(result.subscaleScores).length > 0 && (
              <div className="md:col-span-2 h-64 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="subject" type="category" width={100} tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="value" fill="#0d9488" radius={[0, 8, 8, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI Content */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
                Разбор ИИ-ассистента
              </h3>
              {!loading && interpretation && (
                <button onClick={handleCopyReport} className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-4 py-2 rounded-xl border border-teal-100 active:scale-95 transition-all">
                  {copied ? "✓ Готово" : "Копировать текст"}
                </button>
              )}
            </div>

            {loading ? (
              <LoadingIndicator />
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 md:p-10 prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm md:text-base break-words overflow-x-hidden">
                  <ReactMarkdown 
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-lg font-black text-teal-800 mb-4 mt-8 first:mt-0 flex items-center gap-2 border-l-4 border-teal-500 pl-4 py-1" {...props} />,
                      p: ({node, ...props}) => <p className="mb-5 last:mb-0 break-words overflow-wrap-anywhere" {...props} />,
                      ul: ({node, ...props}) => <ul className="space-y-3 mb-6 list-none p-0" {...props} />,
                      li: ({node, ...props}) => <li className="flex gap-3 items-start before:content-['→'] before:text-teal-500 before:font-bold before:mt-0.5 break-words" {...props} />,
                    }}
                  >
                    {interpretation || ''}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex gap-4 items-start">
              <div className="text-slate-400 shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed font-medium">
                <strong>Важное уведомление:</strong> Данный отчет подготовлен искусственным интеллектом. Он предназначен для самопознания и не может служить основанием для постановки медицинского диагноза. Пожалуйста, проконсультируйтесь с профессиональным психологом или врачом.
              </p>
            </div>
          </div>

          {/* Share & Actions */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleShareResult} className="flex items-center justify-center py-5 bg-teal-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-teal-700 transition-all active:scale-95 gap-3 shadow-xl shadow-teal-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Поделиться результатом
            </button>
            <button onClick={handleShareTest} className="flex items-center justify-center py-5 bg-white border-2 border-slate-100 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95 gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Порекомендовать тест
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 flex flex-col sm:flex-row gap-6">
            <button onClick={onReset} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-800 transition-all">
              К списку тестов
            </button>
            <a href="https://cnpp.ru" target="_blank" rel="noreferrer" className="flex-[2] inline-flex items-center justify-center py-5 border-2 border-teal-600 text-teal-600 font-black rounded-2xl hover:bg-teal-50 transition-all active:scale-95 uppercase text-xs tracking-widest">
              Записаться в «Диалектику»
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
