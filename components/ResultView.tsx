
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
    "Формируем персональные рекомендации...",
    "Сверяемся с клиническими нормами..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
      <div className="text-center">
        <p className="text-slate-600 font-medium animate-pulse">{messages[messageIndex]}</p>
        <p className="text-slate-400 text-xs mt-2">Обработка данных искусственным интеллектом...</p>
      </div>
    </div>
  );
};

export const ResultView: React.FC<ResultViewProps> = ({ result, testDef, onReset }) => {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const MAIN_SITE_URL = 'https://cnpp.ru';

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

  const handleCopy = () => {
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
      A: result.subscaleScores![key]
    }));
  }, [result]);

  const getTestSpecificInfo = () => {
    if (testDef.id === 'bdi-ii') {
        if (result.totalScore >= 29) return "Тяжелая депрессия";
        if (result.totalScore >= 20) return "Средняя депрессия";
        if (result.totalScore >= 14) return "Легкая депрессия";
        return "Норма";
    }
    if (testDef.id === 'bai') {
        if (result.totalScore >= 26) return "Тяжелая тревога";
        if (result.totalScore >= 16) return "Средняя тревога";
        if (result.totalScore >= 8) return "Легкая тревога";
        return "Норма";
    }
    return null;
  };

  const handleShareResult = async () => {
    const info = getTestSpecificInfo() ? ` (${getTestSpecificInfo()})` : '';
    const shareText = `Мой результат в тесте "${testDef.title}": ${result.totalScore} баллов${info}. Пройдите самодиагностику на сайте центра «Диалектика»:`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Мои результаты теста',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
        alert('Текст и ссылка скопированы в буфер обмена');
      }
    } catch (e) { console.error(e); }
  };

  const handleShareTest = async () => {
    const shareText = `Рекомендую пройти психологический тест "${testDef.title}" от центра «Диалектика». Это полезно для самопознания:`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Рекомендую тест',
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
        alert('Ссылка на тест скопирована');
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div ref={topRef} className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-12 overflow-hidden">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
            Отчет о тестировании
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight leading-tight">{testDef.title}</h2>
          <p className="text-slate-400 font-medium">Результат рассчитан {new Date().toLocaleDateString('ru-RU')}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-stretch justify-center mb-12">
          <div className="bg-gradient-to-br from-teal-50 to-white p-10 rounded-3xl text-center w-full md:w-1/3 border border-teal-100 shadow-sm flex flex-col justify-center">
            <span className="block text-teal-800 text-xs font-bold uppercase tracking-widest mb-3">Ваш общий балл</span>
            <span className="block text-7xl font-black text-teal-600 mb-4">{result.totalScore}</span>
            {getTestSpecificInfo() && (
                <div className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-100 inline-block">
                  {getTestSpecificInfo()}
                </div>
            )}
          </div>

          <div className="w-full md:w-2/3 h-72 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
             {result.subscaleScores ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="subject" type="category" width={100} tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)'}} />
                   <Bar dataKey="A" fill="#0d9488" radius={[0, 8, 8, 0]} barSize={28} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-center p-8 text-slate-500 text-sm leading-relaxed font-medium">
                    {testDef.id === 'bpd-screen' 
                        ? (result.totalScore >= 7 ? "Показатель MSI-BPD выше клинического порога (7 баллов). Рекомендуется консультация специалиста." : "Показатель находится в пределах статистической нормы.")
                        : "Баллы рассчитаны по стандартной шкале методики. Ниже приведена детальная интерпретация от ИИ-ассистента."}
                </div>
             )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-100 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              Разбор ИИ-ассистента
            </h3>
            {!loading && interpretation && (
              <button 
                onClick={handleCopy}
                className="text-xs font-bold text-teal-700 hover:bg-teal-100 flex items-center gap-2 bg-teal-50 px-5 py-2.5 rounded-xl transition-all active:scale-95 border border-teal-100"
              >
                {copied ? "✓ Скопировано" : "📑 Копировать отчет"}
              </button>
            )}
          </div>
          
          {loading ? (
            <LoadingIndicator />
          ) : (
            <div className="space-y-8">
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed bg-white border border-slate-100 p-8 md:p-12 rounded-[2rem] shadow-sm">
                  <ReactMarkdown 
                    components={{
                      h3: ({node, ...props}) => <h3 className="text-xl font-black text-teal-800 mb-6 mt-8 first:mt-0 flex items-center gap-2 before:content-[''] before:w-1 before:h-6 before:bg-teal-500 before:rounded-full" {...props} />,
                      p: ({node, ...props}) => <p className="mb-5 last:mb-0 text-slate-600 font-medium" {...props} />,
                      ul: ({node, ...props}) => <ul className="space-y-3 mb-6 list-none p-0" {...props} />,
                      li: ({node, ...props}) => <li className="flex gap-3 items-start before:content-['→'] before:text-teal-500 before:font-bold before:mt-0.5" {...props} />,
                    }}
                  >
                    {interpretation || ''}
                  </ReactMarkdown>
                </div>

                {/* Отдельный блок дисклеймера */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start">
                    <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-700 mb-1 uppercase tracking-wider">Ограничение ответственности</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Данный анализ сформирован искусственным интеллектом на базе предоставленных вами ответов. Он носит справочный характер и не является постановкой медицинского диагноза. Пожалуйста, обсудите эти результаты с квалифицированным психологом или психотерапевтом.
                        </p>
                    </div>
                </div>
            </div>
          )}
        </div>

        <div className="mt-12 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={handleShareResult} className="flex items-center justify-center px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-teal-200 hover:bg-teal-50/30 transition-all gap-3 active:scale-95 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Поделиться результатом
              </button>
              <button onClick={handleShareTest} className="flex items-center justify-center px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-teal-200 hover:bg-teal-50/30 transition-all gap-3 active:scale-95 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                Порекомендовать тест
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onReset} className="flex-1 px-8 py-5 border-2 border-transparent text-slate-400 font-bold rounded-2xl hover:text-slate-600 transition-all active:scale-95 uppercase text-xs tracking-widest">
                ← К списку тестов
              </button>
              <a href="https://cnpp.ru" target="_blank" rel="noreferrer" className="flex-[2] inline-flex items-center justify-center px-8 py-5 bg-teal-600 text-white font-black rounded-2xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 active:scale-95 uppercase text-sm tracking-widest">
                Записаться на консультацию
              </a>
            </div>
        </div>
      </div>
    </div>
  );
};
