
import React, { useState, useEffect, useRef } from 'react';
import { AVAILABLE_TESTS } from './constants';
import { TestCard } from './components/TestCard';
import { Questionnaire } from './components/Questionnaire';
import { ResultView } from './components/ResultView';
import { TestDefinition, TestResult } from './types';

type ViewState = 'HOME' | 'TEST' | 'RESULT';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [activeTest, setActiveTest] = useState<TestDefinition | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [isEmbed, setIsEmbed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('embed') === 'true' || window.self !== window.top) {
        setIsEmbed(true);
      }
    } catch (e) {
      setIsEmbed(false);
    }
  }, []);

  // Передача высоты родительскому окну для адаптивности iframe
  useEffect(() => {
    if (!isEmbed) return;

    const sendHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        window.parent.postMessage({ type: 'setHeight', height }, '*');
      }
    };

    const resizeObserver = new ResizeObserver(() => sendHeight());
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    sendHeight();
    return () => resizeObserver.disconnect();
  }, [view, isEmbed, activeTest, result]);

  const startTest = (test: TestDefinition) => {
    setActiveTest(test);
    setView('TEST');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = (res: TestResult) => {
    setResult(res);
    setView('RESULT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setActiveTest(null);
    setResult(null);
    setView('HOME');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHeader = !isEmbed && view !== 'TEST';

  return (
    <div ref={contentRef} className={`min-h-screen flex flex-col ${isEmbed ? 'bg-transparent overflow-hidden' : 'bg-slate-50'}`}>
      {/* Header - Hides during test for focus */}
      {showHeader && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm animate-fade-in">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-teal-50">D</div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none tracking-tight">Диалектика</h1>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Центр психологии</p>
              </div>
            </div>
            <a href="https://cnpp.ru" target="_blank" rel="noreferrer" className="hidden sm:block text-xs text-teal-600 hover:text-teal-700 font-bold bg-teal-50 px-4 py-2 rounded-xl transition-all border border-teal-100">
              Перейти на cnpp.ru
            </a>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${isEmbed ? 'py-1' : (view === 'TEST' ? 'py-4 md:py-8' : 'py-8 md:py-16')} px-3 md:px-4`}>
        {view === 'HOME' && (
          <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Психологическая диагностика</h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
                Выберите один из клинически признанных опросников. <br className="hidden md:block" /> Анализ результатов проводится при поддержке ИИ.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
              {AVAILABLE_TESTS.map(test => (
                <TestCard key={test.id} test={test} onStart={startTest} />
              ))}
            </div>
          </div>
        )}

        {view === 'TEST' && activeTest && (
          <div className="animate-fade-in">
             <Questionnaire 
                test={activeTest} 
                onComplete={handleComplete} 
                onCancel={handleReset}
             />
          </div>
        )}

        {view === 'RESULT' && result && activeTest && (
          <ResultView 
            result={result} 
            testDef={activeTest} 
            onReset={handleReset} 
          />
        )}
      </main>

      {/* Footer */}
      {!isEmbed && (
        <footer className="bg-white border-t border-slate-100 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">
               © {new Date().getFullYear()} Центр «Диалектика» • Технологии осознанности
             </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
