


import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AIProvider, PuterImageModel } from '../types';
import Button from './ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  puterImageModel: PuterImageModel;
  setPuterImageModel: (model: PuterImageModel) => void;
}

const COLORS = [
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, aiProvider, setAiProvider, puterImageModel, setPuterImageModel }) => {
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const [activeTab, setActiveTab] = useState<'appearance' | 'general'>('appearance');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-white/10">
            <button 
                onClick={() => setActiveTab('appearance')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
                Appearance
            </button>
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'general' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
                General
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
                <div className="space-y-8">
                    {/* Theme Mode */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Theme Mode</h3>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={`flex-1 p-4 rounded-xl border transition-all ${theme === 'light' ? 'bg-slate-100 border-[var(--accent-color)] ring-2 ring-[var(--accent-color)] ring-opacity-50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                     <span className="text-slate-900 font-medium">Light</span>
                                </div>
                            </button>
                            <button 
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={`flex-1 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'bg-slate-800 border-[var(--accent-color)] ring-2 ring-[var(--accent-color)] ring-opacity-50' : 'bg-slate-900 border-slate-700 hover:bg-slate-800'}`}
                            >
                                <div className="flex flex-col items-center gap-2">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                     <span className="text-white font-medium">Dark</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Accent Color */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Accent Color</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => setAccentColor(c.hex)}
                                    className={`w-full aspect-square rounded-full flex items-center justify-center transition-transform hover:scale-105 ${accentColor === c.hex ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
                                    style={{ backgroundColor: c.hex }}
                                    title={c.name}
                                >
                                    {accentColor === c.hex && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white drop-shadow-md" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                             <span className="text-sm text-slate-500 dark:text-slate-400">Custom Hex:</span>
                             <div className="flex-grow flex items-center bg-slate-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-slate-200 dark:border-white/10">
                                 <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: accentColor }}></div>
                                 <input 
                                    type="text" 
                                    value={accentColor} 
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm font-mono text-slate-800 dark:text-slate-200 w-full"
                                 />
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'general' && (
                <div className="space-y-8">
                    {/* AI Provider */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">AI Provider</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose which service powers the story generation.</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => setAiProvider(AIProvider.Gemini)}
                                className={`relative w-full flex items-center p-4 rounded-xl border text-left transition-all ${aiProvider === AIProvider.Gemini ? 'bg-[var(--accent-color)] bg-opacity-10 border-[var(--accent-color)]' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                            >
                                <div className="absolute top-1 right-2 flex gap-1">
                                    <div className="px-1.5 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">RECOMMENDED</div>
                                </div>
                                <div className={`p-2 rounded-full mr-4 ${aiProvider === AIProvider.Gemini ? 'bg-[var(--accent-color)] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">Google Gemini API</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Fast, reliable, high quality.</div>
                                </div>
                                {aiProvider === AIProvider.Gemini && (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-[var(--accent-color)]" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>

                            <button 
                                onClick={() => setAiProvider(AIProvider.Cerebras)}
                                className={`relative w-full flex items-center p-4 rounded-xl border text-left transition-all ${aiProvider === AIProvider.Cerebras ? 'bg-[var(--accent-color)] bg-opacity-10 border-[var(--accent-color)]' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                            >
                                <div className="absolute top-1 right-2 flex gap-1">
                                    <div className="px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">RECOMMENDED</div>
                                </div>
                                <div className={`p-2 rounded-full mr-4 ${aiProvider === AIProvider.Cerebras ? 'bg-[var(--accent-color)] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 font-black text-center w-10'}`}>C</div>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">Cerebras</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Extreme speed Llama models.</div>
                                </div>
                                {aiProvider === AIProvider.Cerebras && (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-[var(--accent-color)]" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>

                            <button 
                                onClick={() => setAiProvider(AIProvider.Puter)}
                                className={`w-full flex items-center p-4 rounded-xl border text-left transition-all ${aiProvider === AIProvider.Puter ? 'bg-[var(--accent-color)] bg-opacity-10 border-[var(--accent-color)]' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                            >
                                <div className={`p-2 rounded-full mr-4 ${aiProvider === AIProvider.Puter ? 'bg-[var(--accent-color)] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <div>
                                    <div className="font-semibold text-slate-900 dark:text-white">Puter.js</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Alternative integration.</div>
                                </div>
                                {aiProvider === AIProvider.Puter && (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-[var(--accent-color)]" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Puter.js Image Model Settings */}
                    {aiProvider === AIProvider.Puter && (
                        <div>
                             <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Puter.js Image Model</h3>
                             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Choose which model Puter should use for illustrations.</p>
                             <div className="flex gap-4">
                                <button
                                    onClick={() => setPuterImageModel(PuterImageModel.GptImage)}
                                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${puterImageModel === PuterImageModel.GptImage ? 'bg-[var(--accent-color)] bg-opacity-10 border-[var(--accent-color)] text-[var(--accent-color)]' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50'}`}
                                >
                                    GPT Image
                                </button>
                                <button
                                    onClick={() => setPuterImageModel(PuterImageModel.GeminiImage)}
                                    className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${puterImageModel === PuterImageModel.GeminiImage ? 'bg-[var(--accent-color)] bg-opacity-10 border-[var(--accent-color)] text-[var(--accent-color)]' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50'}`}
                                >
                                    Nano Banana (Gemini)
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
             <Button onClick={onClose} className="w-full">Done</Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
