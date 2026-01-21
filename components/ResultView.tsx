import React, { useEffect, useState, useMemo } from 'react';
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
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
      </div>
      <div className="text-center">
        <p className="text-slate-600 font-medium animate-pulse">{messages[messageIndex]}</p>
        <p className="text-slate-400 text-xs mt-2">Это может занять до 15 секунд</p>
      </div>
    </div>
  );
};

export const ResultView: React.FC<ResultViewProps> = ({ result, testDef, onReset }) => {
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Ссылка на ваш основной сайт для шеринга
  const MAIN_SITE_URL = 'https://cnpp.ru';

  useEffect(() => {
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
          title: 'Результаты психологического теста',
          text: shareText,
          url: MAIN_SITE_URL,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${MAIN_SITE_URL}`);
        alert('Результат скопирован в буфер обмена');
      }
    } catch (e) { console.error(e); }
  };

  const handleShareTest = async () => {
    const shareText = `Рекомендую пройти психологический тест "${testDef.title}" от центра «Диалектика». Это полезно для самопознания:`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Психологический тест',
          text: shareText,
          url: MAIN_SITE_URL,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${MAIN_SITE_URL}`);
        alert('Ссылка на тесты скопирована');
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Результаты анализа</h2>
          <p className="text-slate-500 font-medium">{testDef.title}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center mb-10">
          <div className="bg-teal-50 p-8 rounded-2xl text-center w-full md:w-1/3 border border-teal-100 shadow-sm">
            <span className="block text-teal-800 text-xs font-bold uppercase tracking-widest mb-2">Общий результат</span>
            <span className="block text-6xl font-black text-teal-600 mb-2">{result.totalScore}</span>
            {getTestSpecificInfo() && (
                <div className="px-4 py-1.5 bg-white rounded-full text-teal-700 font-bold text-sm border border-teal-100 inline-block shadow-sm">
                  {getTestSpecificInfo()}
                </div>
            )}
          </div>

          <div className="w-full md:w-2/3 h-64">
             {result.subscaleScores ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                   <XAxis type="number" hide />
                   <YAxis dataKey="subject" type="category" width={100} tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                   <Bar dataKey="A" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={24} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-sm leading-relaxed italic">
                    {testDef.id === 'bpd-screen' 
                        ? (result.totalScore >= 7 ? "Показатель выше клинического порога. Рекомендуется обсудить результаты со специалистом." : "Показатель в пределах статистической нормы.")
                        : "Баллы рассчитаны по стандартной методике. Ниже представлена детальная расшифровка."}
                </div>
             )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              Мнение экспертного ИИ
            </h3>
            {!loading && interpretation && (
              <button 
                onClick={handleCopy}
                className="text-xs font-bold text-teal-700 hover:bg-teal-100 flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl transition-all active:scale-95"
              >
                {copied ? "✓ Скопировано" : "📑 Копировать"}
              </button>
            )}
          </div>
          
          {loading ? (
            <LoadingIndicator />
          ) : (
            <div className="prose prose-slate prose-teal max-w-none text-slate-700 bg-slate-50/70 p-8 md:p-10 rounded-3xl border border-slate-100 leading-relaxed shadow-inner">
              <ReactMarkdown>{interpretation || ''}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="mt-12 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={handleShareResult} className="flex items-center justify-center px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-teal-200 hover:bg-teal-50/30 transition-all gap-3 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Поделиться результатом
              </button>
              <button onClick={handleShareTest} className="flex items-center justify-center px-6 py-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-2xl hover:border-teal-200 hover:bg-teal-50/30 transition-all gap-3 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                Поделиться тестом
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onReset} className="flex-1 px-8 py-4 border-2 border-transparent text-slate-500 font-bold rounded-2xl hover:text-slate-800 transition-all active:scale-95">
                ← К списку тестов
              </button>
              <a href="https://cnpp.ru" target="_blank" rel="noreferrer" className="flex-[2] inline-flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 active:scale-95">
                Записаться в «Диалектику»
              </a>
            </div>
        </div>
      </div>
    </div>
  );
};