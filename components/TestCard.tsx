import React from 'react';
import { TestDefinition } from '../types';

interface TestCardProps {
  test: TestDefinition;
  onStart: (test: TestDefinition) => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onStart }) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `Тест: ${test.title}`,
      text: `Пройдите психологический тест "${test.title}" на сайте центра "Диалектика": ${test.description}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard if Share API is not supported
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Ссылка на тест и описание скопированы в буфер обмена');
      }
    } catch (err) {
      console.error('Ошибка при попытке поделиться:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 p-6 flex flex-col h-full group cursor-default transform will-change-transform">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-slate-800 group-hover:text-teal-700 transition-colors duration-300 pr-2">
          {test.title}
        </h3>
        <button
          onClick={handleShare}
          title="Поделиться"
          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
      <p className="text-slate-600 mb-6 flex-grow leading-relaxed">
        {test.description}
      </p>
      <button
        onClick={() => onStart(test)}
        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transform"
      >
        <span>Начать тест</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
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