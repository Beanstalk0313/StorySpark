import React from 'react';
import { AIProvider } from '../../types';

interface AIToggleProps {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  disabled?: boolean;
}

const AIToggle: React.FC<AIToggleProps> = ({ provider, setProvider, disabled }) => {
  const isPuter = provider === AIProvider.Puter;

  return (
    <div className={`flex items-center justify-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <button
        onClick={() => !disabled && setProvider(AIProvider.Gemini)}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${!isPuter ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        disabled={disabled}
        aria-pressed={!isPuter}
      >
        Gemini API
      </button>
      <button
        onClick={() => !disabled && setProvider(AIProvider.Puter)}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${isPuter ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        disabled={disabled}
        aria-pressed={isPuter}
      >
        Puter.js
      </button>
    </div>
  );
};

export default AIToggle;