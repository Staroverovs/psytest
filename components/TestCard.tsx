
import React from 'react';
import { TestDefinition } from '../types';

interface TestCardProps {
  test: TestDefinition;
  onStart: (test: TestDefinition) => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onStart }) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + window.location.pathname;
    const shareData = {
      title: `Пройти тест: ${test.title}`,
      text: `Психологический тест "${test.title}" от центра "Диалектика": ${test.description}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('Ссылка и описание теста скопированы');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Ошибка при попытке поделиться:', err);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full group cursor-default transform will-change-transform">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-slate-800 group-hover:text-teal-700 transition-colors duration-300 pr-2 leading-tight">
          {test.title}
        </h3>
        <button
          onClick={handleShare}
          title="Поделиться"
          className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-teal-100 active:scale-90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
      <p className="text-slate-600 mb-6 flex-grow leading-relaxed text-sm font-medium">
        {test.description}
      </p>
      <button
        onClick={() => onStart(test)}
        className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-teal-100 active:scale-95 transform uppercase text-xs tracking-widest"
      >
        <span>Пройти тест</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="group-hover:translate-x-1 transition-transform duration-300"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </button>
    </div>
  );
};
