
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Безопасная проверка URL параметров
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('embed') === 'true' || window.self !== window.top) {
        setIsEmbed(true);
      }
    } catch (e) {
      console.warn("Embed check failed", e);
    }
  }, []);

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

  return (
    <div className={`min-h-screen flex flex-col ${isEmbed ? 'bg-transparent' : 'bg-slate-50'}`}>
      {/* Header */}
      {!isEmbed && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">D</div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-none">Диалектика</h1>
                <p className="text-xs text-slate-500 mt-1">Центр психологии</p>
              </div>
            </div>
            <a href="https://cnpp.ru" target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:text-teal-700 font-medium bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
              На главную cnpp.ru
            </a>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-grow ${isEmbed ? 'py-4' : 'py-12'} px-4`}>
        {view === 'HOME' && (
          <div className="max-w-6xl mx-auto animate-fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Психологическое тестирование</h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Выберите тест для самодиагностики. Результаты обрабатываются автоматически и дополняются рекомендациями искусственного интеллекта.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {AVAILABLE_TESTS.map(test => (
                <TestCard key={test.id} test={test} onStart={startTest} />
              ))}
            </div>
            
            <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-6 max-w-3xl mx-auto text-center shadow-sm">
              <p className="text-blue-800 text-sm leading-relaxed">
                <strong>Важно:</strong> Данные тесты являются инструментом скрининга и самопознания. Они не заменяют профессиональную диагностику.
              </p>
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
        <footer className="bg-white border-t border-slate-200 py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
             <p className="text-slate-400 text-sm font-medium">© {new Date().getFullYear()} Центр психологии "Диалектика"</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
