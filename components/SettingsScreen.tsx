import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AIProvider, PuterImageModel, PuterModel, GeminiModel } from '../types';
import Button from './ui/Button';
import { 
    APP_VERSION, 
    DEFAULT_RESEARCH_PROMPT, 
    DEFAULT_WRITING_TEMPLATE, 
    DEFAULT_REGENERATE_TEMPLATE, 
    PUTER_TEXT_MODELS, 
    GEMINI_TEXT_MODELS, 
    OPENROUTER_TEXT_MODELS,
    ANTHROPIC_TEXT_MODELS,
    OPENAI_TEXT_MODELS,
    DEEPSEEK_TEXT_MODELS, 
    GROQ_TEXT_MODELS, 
    CEREBRAS_TEXT_MODELS,
    GROK_TEXT_MODELS, 
    MISTRAL_TEXT_MODELS, 
    GOOGLE_AI_STUDIO_URL 
    } from '../constants';import Checkbox from './ui/Checkbox';
import Modal from './ui/Modal';
import Textarea from './ui/Textarea';
import Input from './ui/Input';
import Select from './ui/Select';

interface SettingsScreenProps {
  onBack: () => void;
  onOpenGeminiGuide: () => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  puterImageModel: PuterImageModel;
  setPuterImageModel: (model: PuterImageModel) => void;
  puterModel: PuterModel;
  setPuterModel: (model: PuterModel) => void;
  geminiModel: GeminiModel;
  setGeminiModel: (model: GeminiModel) => void;
  openRouterModel: string;
  setOpenRouterModel: (model: string) => void;
  anthropicModel: string;
  setAnthropicModel: (model: string) => void;
  openaiModel: string;
  setOpenaiModel: (model: string) => void;
  deepseekModel: string;
  setDeepseekModel: (model: string) => void;
  groqModel: string;
  setGroqModel: (model: string) => void;
  cerebrasModel: string;
  setCerebrasModel: (model: string) => void;
  grokModel: string;
  setGrokModel: (model: string) => void;
  mistralModel: string;
  setMistralModel: (model: string) => void;
  customAiModel: string;
  setCustomAiModel: (model: string) => void;
  customAiEndpoint: string;
  setCustomAiEndpoint: (endpoint: string) => void;
  onOpenChangelog: () => void;
  developerMode: boolean; 
  setDeveloperMode: (enabled: boolean) => void;
}

const COLORS = [
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    onBack, 
    onOpenGeminiGuide,
    aiProvider, 
    setAiProvider, 
    puterImageModel, 
    setPuterImageModel,
    puterModel,
    setPuterModel,
    geminiModel, 
    setGeminiModel,
    openRouterModel,
    setOpenRouterModel,
    anthropicModel,
    setAnthropicModel,
    openaiModel,
    setOpenaiModel,
    deepseekModel,
    setDeepseekModel,
    groqModel,
    setGroqModel,
    cerebrasModel,
    setCerebrasModel,
    grokModel,
    setGrokModel,
    mistralModel,
    setMistralModel,
    customAiModel,
    setCustomAiModel,
    customAiEndpoint,
    setCustomAiEndpoint,
    onOpenChangelog,
    developerMode,
    setDeveloperMode
    }) => {
    const { theme, toggleTheme, accentColor, setAccentColor, isLiteMode, toggleLiteMode } = useTheme();
    const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'developer' | 'about'>('appearance');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Developer Options State
    const [logConsole, setLogConsole] = useState(localStorage.getItem('storyspark-dev-log-console') === 'true');
    const [downloadLogs, setDownloadLogs] = useState(localStorage.getItem('storyspark-dev-download') === 'true');
    const [logSdkDetails, setLogSdkDetails] = useState(localStorage.getItem('storyspark-dev-log-gemini-sdk') === 'true');
    const [firestoreDebug, setFirestoreDebug] = useState(localStorage.getItem('storyspark-dev-firestore-debug') === 'true');

    // BYOK State
    const [customGeminiKey, setCustomGeminiKey] = useState(localStorage.getItem('storyspark-custom-gemini-key') || '');
    const [openRouterKey, setOpenRouterKey] = useState(localStorage.getItem('storyspark-openrouter-key') || '');
    const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem('storyspark-anthropic-key') || '');
    const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('storyspark-openai-key') || '');
    const [deepseekKey, setDeepseekKey] = useState(localStorage.getItem('storyspark-deepseek-key') || '');
    const [groqKey, setGroqKey] = useState(localStorage.getItem('storyspark-groq-key') || '');
    const [cerebrasKey, setCerebrasKey] = useState(localStorage.getItem('storyspark-cerebras-key') || '');
    const [grokKey, setGrokKey] = useState(localStorage.getItem('storyspark-grok-key') || '');
    const [mistralKey, setMistralKey] = useState(localStorage.getItem('storyspark-mistral-key') || '');
    const [customAiKey, setCustomAiKey] = useState(localStorage.getItem('storyspark-custom-ai-key') || '');
  // Modals
  const [showWarning, setShowWarning] = useState(false);
  const [showPromptsModal, setShowPromptsModal] = useState(false);
  
  // Custom Prompts
  const [customWritingTemplate, setCustomWritingTemplate] = useState(localStorage.getItem('storyspark-sys-template-writing') || DEFAULT_WRITING_TEMPLATE);
  const [customResearchPrompt, setCustomResearchPrompt] = useState(localStorage.getItem('storyspark-sys-prompt-research') || DEFAULT_RESEARCH_PROMPT);
  const [customRegenTemplate, setCustomRegenTemplate] = useState(localStorage.getItem('storyspark-sys-template-regenerate') || DEFAULT_REGENERATE_TEMPLATE);

  // Sync state to local storage
  useEffect(() => { localStorage.setItem('storyspark-dev-log-console', String(logConsole)); }, [logConsole]);
  useEffect(() => { localStorage.setItem('storyspark-dev-download', String(downloadLogs)); }, [downloadLogs]);
  useEffect(() => { localStorage.setItem('storyspark-custom-gemini-key', customGeminiKey); }, [customGeminiKey]);
  useEffect(() => { localStorage.setItem('storyspark-openrouter-key', openRouterKey); }, [openRouterKey]);
  useEffect(() => { localStorage.setItem('storyspark-anthropic-key', anthropicKey); }, [anthropicKey]);
  useEffect(() => { localStorage.setItem('storyspark-openai-key', openaiKey); }, [openaiKey]);
  useEffect(() => { localStorage.setItem('storyspark-deepseek-key', deepseekKey); }, [deepseekKey]);
  useEffect(() => { localStorage.setItem('storyspark-groq-key', groqKey); }, [groqKey]);
  useEffect(() => { localStorage.setItem('storyspark-cerebras-key', cerebrasKey); }, [cerebrasKey]);
  useEffect(() => { localStorage.setItem('storyspark-grok-key', grokKey); }, [grokKey]);
  useEffect(() => { localStorage.setItem('storyspark-mistral-key', mistralKey); }, [mistralKey]);
  useEffect(() => { localStorage.setItem('storyspark-custom-ai-key', customAiKey); }, [customAiKey]);
  
  // Auto-fallback for Pro models if key is entered
  useEffect(() => {
    if (customGeminiKey.trim().length > 0) {
        const currentModel = GEMINI_TEXT_MODELS.find(m => m.id === geminiModel);
        if (currentModel?.isPro) {
            setGeminiModel(GeminiModel.Gemini3Flash);
        }
    }
  }, [customGeminiKey, geminiModel, setGeminiModel]);

  // Sync prompts to local storage
  const saveCustomPrompts = () => {
      localStorage.setItem('storyspark-sys-template-writing', customWritingTemplate);
      localStorage.setItem('storyspark-sys-prompt-research', customResearchPrompt);
      localStorage.setItem('storyspark-sys-template-regenerate', customRegenTemplate);
      setShowPromptsModal(false);
  };

  const handleToggleDev = (checked: boolean) => {
      if (checked) {
          setShowWarning(true);
      } else {
          setDeveloperMode(false);
      }
  };

  const confirmEnableDev = () => {
      setDeveloperMode(true);
      setShowWarning(false);
  };

  const MenuItem = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => { setActiveTab(id); setIsSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
      style={activeTab === id ? { backgroundColor: 'var(--accent-color)' } : {}}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  const openGeminiExternal = () => {
      window.open(GOOGLE_AI_STUDIO_URL, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-50 flex flex-col md:flex-row animate-fade-in">
        {showWarning && (
            <Modal isOpen={true} title="Enable Developer Options?" onClose={() => setShowWarning(false)} confirmText="Enable" onConfirm={confirmEnableDev} cancelText="Cancel">
                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-300 dark:border-amber-700 mb-4">
                    <p className="text-amber-900 dark:text-amber-100 font-bold">Warning: Advanced Users Only</p>
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                    Some of these settings are experimental and intended for developers and advanced users only. 
                    Incorrect configurations may break story generation or lead to unexpected errors.
                </p>
                <p className="mt-2 text-slate-700 dark:text-slate-300">If you do not know what you are doing, we recommend you don't turn this on.</p>
            </Modal>
        )}

        {showPromptsModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customize System Prompt Templates</h3>
                        <button onClick={() => setShowPromptsModal(false)} className="p-2 hover:bg-black/10 rounded-full">&times;</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-base font-bold text-[var(--accent-color)] uppercase tracking-wider">Main Story Generator</label>
                                    <button onClick={() => setCustomWritingTemplate(DEFAULT_WRITING_TEMPLATE)} className="text-xs text-slate-500 hover:text-[var(--accent-color)] underline">Reset to Default</button>
                                </div>
                                <Textarea 
                                    label="" 
                                    id="cp-write" 
                                    value={customWritingTemplate} 
                                    onChange={e => setCustomWritingTemplate(e.target.value)} 
                                    rows={16} 
                                    className="font-mono text-xs !bg-slate-100 dark:!bg-black/30" 
                                />
                            </div>
                            <div className="lg:col-span-1 bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 h-fit">
                                <h4 className="font-bold text-sm mb-3">Available Variables</h4>
                                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-400 font-mono">
                                    <li><code className="text-indigo-500">{`{{title}}`}</code> - Book Title</li>
                                    <li><code className="text-indigo-500">{`{{chapterIndex}}`}</code> - Number</li>
                                    <li><code className="text-indigo-500">{`{{plot}}`}</code> - User Plot</li>
                                    <li><code className="text-indigo-500">{`{{modeInstruction}}`}</code> - RPG/Novelist Rules</li>
                                    <li><code className="text-indigo-500">{`{{styleInstruction}}`}</code> - Voice/Tone</li>
                                    <li><code className="text-indigo-500">{`{{targetLength}}`}</code> - Word Count Guide</li>
                                    <li><code className="text-indigo-500">{`{{researchSummary}}`}</code> - Lore Context</li>
                                    <li><code className="text-indigo-500">{`{{userNotes}}`}</code> - Custom Notes</li>
                                    <li><code className="text-indigo-500">{`{{milestoneInstruction}}`}</code></li>
                                    <li><code className="text-indigo-500">{`{{upcomingMilestones}}`}</code></li>
                                </ul>
                                <p className="text-[10px] mt-4 text-amber-600 dark:text-amber-400">Warning: Removing critical sections like "___ANALYSIS_START___" will break the app.</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-white/10 pt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Regeneration Logic</label>
                                    <button onClick={() => setCustomRegenTemplate(DEFAULT_REGENERATE_TEMPLATE)} className="text-xs text-slate-500 hover:underline">Reset</button>
                                </div>
                                <Textarea label="" id="cp-regen" value={customRegenTemplate} onChange={e => setCustomRegenTemplate(e.target.value)} rows={6} className="font-mono text-xs" />
                                <div className="mt-2 text-[10px] text-slate-500 font-mono">Vars: {`{{chapterIndex}}`}, {`{{researchSummary}}`}, {`{{plot}}`}</div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Lore Research Logic</label>
                                    <button onClick={() => setCustomResearchPrompt(DEFAULT_RESEARCH_PROMPT)} className="text-xs text-slate-500 hover:underline">Reset</button>
                                </div>
                                <Textarea label="" id="cp-res" value={customResearchPrompt} onChange={e => setCustomResearchPrompt(e.target.value)} rows={6} className="font-mono text-xs" />
                                <div className="mt-2 text-[10px] text-slate-500">This prompt is appended with the subject name and context.</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setShowPromptsModal(false)}>Cancel</Button>
                        <Button onClick={saveCustomPrompts}>Save Templates</Button>
                    </div>
                </div>
            </div>
        )}

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-white/10 z-20">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
            <div className="flex gap-2">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg bg-slate-100 dark:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                 <button onClick={onBack} className="p-2 rounded-lg bg-slate-100 dark:bg-white/10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-700 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
            </div>
        </div>

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 p-6 transform transition-transform duration-300 ease-in-out z-30 md:translate-x-0 md:relative ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="mb-8 hidden md:block">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h2>
                </div>
                
                <nav className="space-y-2 flex-1">
                    <MenuItem 
                        id="appearance" 
                        label="Appearance" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>} 
                    />
                    <MenuItem 
                        id="ai" 
                        label="AI Configuration" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>} 
                    />
                    <MenuItem 
                        id="developer" 
                        label="Developer Options" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} 
                    />
                    <MenuItem 
                        id="about" 
                        label="About" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    />
                </nav>

                <div className="pt-6 border-t border-slate-200 dark:border-white/10 hidden md:block">
                    <Button onClick={onBack} variant="secondary" className="w-full">
                        Close Settings
                    </Button>
                </div>
            </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 h-full">
             <div className="max-w-4xl mx-auto space-y-8 pb-20 md:pb-0">
                {activeTab === 'appearance' && (
                    <div className="animate-fade-in space-y-10">
                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Theme Preference</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button 
                                    onClick={() => theme === 'dark' && toggleTheme()}
                                    className={`relative p-6 rounded-2xl border-2 text-left transition-all ${theme === 'light' ? 'bg-white border-[var(--accent-color)] shadow-lg' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-lg">Light Mode</div>
                                            <div className="text-slate-500 text-sm">Bright and clear</div>
                                        </div>
                                    </div>
                                    {theme === 'light' && <div className="absolute top-4 right-4 text-[var(--accent-color)]"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg></div>}
                                </button>
                                <button 
                                    onClick={() => theme === 'light' && toggleTheme()}
                                    className={`relative p-6 rounded-2xl border-2 text-left transition-all ${theme === 'dark' ? 'bg-slate-800 border-[var(--accent-color)] shadow-lg' : 'bg-slate-800/50 border-transparent hover:bg-slate-800'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-900/50 rounded-full text-indigo-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">Dark Mode</div>
                                            <div className="text-slate-400 text-sm">Easy on the eyes</div>
                                        </div>
                                    </div>
                                    {theme === 'dark' && <div className="absolute top-4 right-4 text-[var(--accent-color)]"><svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg></div>}
                                </button>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Performance</h3>
                            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Lite Mode</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md">
                                            Disables liquid backgrounds, blur effects, and animations to improve performance on older devices and save battery.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={toggleLiteMode}
                                        className={`w-14 h-8 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${isLiteMode ? 'bg-[var(--accent-color)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    >
                                        <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform shadow-sm ${isLiteMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Accent Color</h3>
                            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                                    {COLORS.map(c => (
                                        <button
                                            key={c.name}
                                            onClick={() => setAccentColor(c.hex)}
                                            className={`group w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${accentColor === c.hex ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-offset-slate-900 scale-105' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: c.hex }}
                                        >
                                            {accentColor === c.hex && (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-md" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-8">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Custom Hex Code</label>
                                    <div className="flex items-center bg-slate-100 dark:bg-black/20 rounded-xl px-4 py-3 border border-slate-200 dark:border-white/10 max-w-sm">
                                        <div className="w-6 h-6 rounded-lg mr-3 shadow-inner" style={{ backgroundColor: accentColor }}></div>
                                        <input 
                                            type="text" 
                                            value={accentColor} 
                                            onChange={(e) => setAccentColor(e.target.value)}
                                            className="bg-transparent border-none focus:ring-0 text-base font-mono font-semibold text-slate-800 dark:text-slate-200 w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="animate-fade-in space-y-10">
                        <section>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">AI Provider</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button 
                                    onClick={() => setAiProvider(AIProvider.Gemini)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Gemini ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    <div className="absolute -top-3 left-6 flex gap-2">
                                        {aiProvider === AIProvider.Gemini && <div className="px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                        <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">RECOMMENDED</div>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Google Gemini</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Direct high-speed generation with free tier.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.Cerebras)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Cerebras ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    <div className="absolute -top-3 left-6 flex gap-2">
                                        {aiProvider === AIProvider.Cerebras && <div className="px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                        <div className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">RECOMMENDED</div>
                                    </div>
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mr-4 font-black text-xl flex items-center justify-center">C</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Cerebras</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Llama 3.1 & 3.3 models with world-record speed.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.Puter)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Puter ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.Puter && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Puter.js</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Universal browser AI integration.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.OpenRouter)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.OpenRouter ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.OpenRouter && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">OpenRouter</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Access hundreds of models including free ones.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.Anthropic)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Anthropic ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.Anthropic && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Anthropic</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Premium models like Claude 3.5 Sonnet.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.OpenAI)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.OpenAI ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.OpenAI && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">OpenAI</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Industry standard GPT models.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.DeepSeek)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.DeepSeek ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.DeepSeek && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">DeepSeek</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Powerful, affordable Chinese AI.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.Groq)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Groq ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.Groq && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Groq</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">LPU-powered extreme speed inference.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.Grok)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Grok ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.Grok && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white rounded-2xl mr-4 font-black">X</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">xAI Grok</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Direct access to Grok models.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setAiProvider(AIProvider.Mistral)}
                                    className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Mistral ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                >
                                    {aiProvider === AIProvider.Mistral && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mr-4 font-black">M</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white">Mistral AI</h4>
                                        <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">European AI leader.</p>
                                    </div>
                                </button>

                                {developerMode && (
                                    <button 
                                        onClick={() => setAiProvider(AIProvider.Custom)}
                                        className={`relative flex items-start p-6 rounded-3xl border-2 text-left transition-all ${aiProvider === AIProvider.Custom ? 'bg-white dark:bg-slate-800 border-[var(--accent-color)] shadow-xl' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                    >
                                        {aiProvider === AIProvider.Custom && <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--accent-color)] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">ACTIVE</div>}
                                        <div className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl mr-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Custom Endpoint</h4>
                                            <p className="text-slate-500 text-[10px] mt-1 line-clamp-2">Connect to any OpenAI-compatible API.</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </section>

                        {aiProvider === AIProvider.Gemini && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">🔑</div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Setup Your Free Gemini Key</h4>
                                            <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
                                                To use Gemini, you need a personal API Key from <strong>Google AI Studio</strong>. 
                                                It is <strong>100% free</strong> and only requires a standard Google account. 
                                            </p>
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                <Button onClick={onOpenGeminiGuide} variant="secondary" className="text-xs bg-white dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">View Step-by-Step Guide</Button>
                                                <Button onClick={openGeminiExternal} className="text-xs bg-indigo-600 hover:bg-indigo-700 border-none">Get Free Key External &rarr;</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Gemini Configuration</h4>
                                    <Input 
                                        label="Personal API Key" 
                                        id="custom-gemini-key" 
                                        type="password"
                                        value={customGeminiKey} 
                                        onChange={(e) => setCustomGeminiKey(e.target.value)} 
                                        placeholder="Paste your API key here..."
                                    />
                                    
                                    <div className="mt-6">
                                        <Select 
                                            label="Active AI Model" 
                                            id="gemini-text-model" 
                                            value={geminiModel} 
                                            onChange={(e) => setGeminiModel(e.target.value as GeminiModel)}
                                        >
                                            {GEMINI_TEXT_MODELS.map(m => {
                                                const isDisabled = m.isPro && customGeminiKey.trim().length > 0;
                                                return (
                                                    <option key={m.id} value={m.id} disabled={isDisabled}>
                                                        {m.name} {isDisabled ? '(Restricted to AI Studio Environment)' : ''}
                                                    </option>
                                                );
                                            })}
                                        </Select>

                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                <span className="text-[var(--accent-color)] font-bold uppercase tracking-widest text-[9px] mr-2">Note:</span> 
                                                {GEMINI_TEXT_MODELS.find(m => m.id === geminiModel)?.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Cerebras && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-start gap-4">
                                        <div className="text-3xl">⚡</div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Setup Cerebras Inference</h4>
                                            <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                                                Cerebras offers the world's fastest inference for Llama models. 
                                                Get a free API key from their dashboard to experience near-instant story generation.
                                            </p>
                                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                                <Button onClick={() => window.open('https://cloud.cerebras.ai', '_blank')} className="text-xs bg-emerald-600 hover:bg-emerald-700 border-none text-white">Get Cerebras Key &rarr;</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Cerebras Config</h4>
                                    <Input 
                                        label="API Key" 
                                        id="cerebras-key" 
                                        type="password"
                                        value={cerebrasKey} 
                                        onChange={(e) => setCerebrasKey(e.target.value)} 
                                        placeholder="csk-..."
                                    />
                                    
                                    <div className="mt-6">
                                        <Select 
                                            label="Active Model" 
                                            id="cerebras-model" 
                                            value={cerebrasModel} 
                                            onChange={(e) => setCerebrasModel(e.target.value)}
                                        >
                                            {CEREBRAS_TEXT_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </Select>

                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                                <span className="text-[var(--accent-color)] font-bold uppercase tracking-widest text-[9px] mr-2">Note:</span> 
                                                {CEREBRAS_TEXT_MODELS.find(m => m.id === cerebrasModel)?.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Puter && (
                            <section className="animate-fade-in space-y-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Puter.js Model Selection</h3>
                                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                                        <Select 
                                            label="Text Generation Model" 
                                            id="puter-text-model" 
                                            value={puterModel} 
                                            onChange={(e) => setPuterModel(e.target.value as PuterModel)}
                                        >
                                            {PUTER_TEXT_MODELS.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </Select>
                                        <div className="mt-4 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                <span className="text-[var(--accent-color)] font-bold">Note:</span> {PUTER_TEXT_MODELS.find(m => m.id === puterModel)?.note}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Puter.js Image Model</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setPuterImageModel(PuterImageModel.GeminiImage)}
                                            className={`p-4 rounded-xl border text-center transition-all ${puterImageModel === PuterImageModel.GeminiImage ? 'text-white border-transparent shadow-md' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                                            style={puterImageModel === PuterImageModel.GeminiImage ? { backgroundColor: 'var(--accent-color)' } : {}}
                                        >
                                            <span className="font-bold text-sm">Gemini Flash Image</span>
                                        </button>
                                        <button
                                            onClick={() => setPuterImageModel(PuterImageModel.GptImage)}
                                            className={`p-4 rounded-xl border text-center transition-all ${puterImageModel === PuterImageModel.GptImage ? 'text-white border-transparent shadow-md' : 'bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                                            style={puterImageModel === PuterImageModel.GptImage ? { backgroundColor: 'var(--accent-color)' } : {}}
                                        >
                                            <span className="font-bold text-sm">GPT Image</span>
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.OpenRouter && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">OpenRouter Config</h4>
                                    <Input label="API Key" id="or-key" type="password" value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} placeholder="sk-or-..." />
                                    <div className="mt-6">
                                        <Select label="Model" id="or-model" value={openRouterModel} onChange={(e) => setOpenRouterModel(e.target.value)}>
                                            {OPENROUTER_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{OPENROUTER_TEXT_MODELS.find(m => m.id === openRouterModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Anthropic && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Anthropic Config</h4>
                                    <Input label="API Key" id="anth-key" type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." />
                                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-200">
                                        Note: Anthropic API keys are expensive and do not offer a free tier.
                                    </div>
                                    <div className="mt-6">
                                        <Select label="Model" id="anth-model" value={anthropicModel} onChange={(e) => setAnthropicModel(e.target.value)}>
                                            {ANTHROPIC_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{ANTHROPIC_TEXT_MODELS.find(m => m.id === anthropicModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.OpenAI && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">OpenAI Config</h4>
                                    <Input label="API Key" id="oa-key" type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." />
                                    <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200">
                                        Note: OpenAI does not have a free tier.
                                    </div>
                                    <div className="mt-6">
                                        <Select label="Model" id="oa-model" value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}>
                                            {OPENAI_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{OPENAI_TEXT_MODELS.find(m => m.id === openaiModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.DeepSeek && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">DeepSeek Config</h4>
                                    <Input label="API Key" id="ds-key" type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} placeholder="sk-..." />
                                    <div className="mt-6">
                                        <Select label="Model" id="ds-model" value={deepseekModel} onChange={(e) => setDeepseekModel(e.target.value)}>
                                            {DEEPSEEK_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{DEEPSEEK_TEXT_MODELS.find(m => m.id === deepseekModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Groq && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Groq Config</h4>
                                    <Input label="API Key" id="groq-key" type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="gsk_..." />
                                    <div className="mt-6">
                                        <Select label="Model" id="groq-model" value={groqModel} onChange={(e) => setGroqModel(e.target.value)}>
                                            {GROQ_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{GROQ_TEXT_MODELS.find(m => m.id === groqModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Grok && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">xAI Grok Config</h4>
                                    <Input label="API Key" id="grok-key" type="password" value={grokKey} onChange={(e) => setGrokKey(e.target.value)} placeholder="xai-..." />
                                    <div className="mt-6">
                                        <Select label="Model" id="grok-model" value={grokModel} onChange={(e) => setGrokModel(e.target.value)}>
                                            {GROK_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{GROK_TEXT_MODELS.find(m => m.id === grokModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Mistral && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Mistral Config</h4>
                                    <Input label="API Key" id="mistral-key" type="password" value={mistralKey} onChange={(e) => setMistralKey(e.target.value)} placeholder="API Key" />
                                    <div className="mt-6">
                                        <Select label="Model" id="mistral-model" value={mistralModel} onChange={(e) => setMistralModel(e.target.value)}>
                                            {MISTRAL_TEXT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </Select>
                                        <div className="mt-3 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                            <p className="text-xs text-slate-500">{MISTRAL_TEXT_MODELS.find(m => m.id === mistralModel)?.note}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {aiProvider === AIProvider.Custom && developerMode && (
                            <section className="animate-fade-in space-y-6">
                                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">Custom AI Endpoint</h4>
                                    <Input label="Endpoint URL" id="custom-endpoint" value={customAiEndpoint} onChange={(e) => setCustomAiEndpoint(e.target.value)} placeholder="https://api.example.com/v1" />
                                    <Input label="API Key" id="custom-key" type="password" value={customAiKey} onChange={(e) => setCustomAiKey(e.target.value)} placeholder="sk-..." />
                                    <Input label="Model ID" id="custom-model" value={customAiModel} onChange={(e) => setCustomAiModel(e.target.value)} placeholder="my-model-name" />
                                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                                        Use this to connect to local LLMs (Ollama/LM Studio) or other OpenAI-compatible services.
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'developer' && (
                    <div className="animate-fade-in space-y-8">
                        <div>
                             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Developer Options</h3>
                             <p className="text-slate-500 dark:text-slate-400 mb-6">Advanced tools for debugging and custom configuration.</p>
                             
                             <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between mb-8">
                                <span className="font-bold text-slate-900 dark:text-white">Enable Developer Options?</span>
                                <Checkbox 
                                    id="dev-enable"
                                    label=""
                                    checked={developerMode}
                                    onChange={e => handleToggleDev(e.target.checked)}
                                    className="!w-6 !h-6"
                                />
                             </div>

                             <div className={`space-y-6 transition-opacity duration-300 ${!developerMode ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                <div className="bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Log raw prompt to console</h4>
                                            <p className="text-xs text-slate-500 mt-1">Outputs the full system instructions and user inputs to browser DevTools.</p>
                                        </div>
                                        <Checkbox id="log-console" label="" checked={logConsole} onChange={e => setLogConsole(e.target.checked)} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Log Gemini SDK & Request Info</h4>
                                            <p className="text-xs text-slate-500 mt-1">Logs internal SDK initialization details and proves whether system or custom keys are being used.</p>
                                        </div>
                                        <Checkbox id="log-sdk" label="" checked={logSdkDetails} onChange={e => setLogSdkDetails(e.target.checked)} />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Download Prompt & Response Logs</h4>
                                            <p className="text-xs text-slate-500 mt-1">Automatically downloads a .txt file after every AI generation containing the full exchange.</p>
                                        </div>
                                        <Checkbox id="log-download" label="" checked={downloadLogs} onChange={e => setDownloadLogs(e.target.checked)} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Verbose Firestore Logging</h4>
                                            <p className="text-xs text-slate-500 mt-1">Logs every read/write operation to the console with payload details.</p>
                                        </div>
                                        <Checkbox id="firestore-debug" label="" checked={firestoreDebug} onChange={e => setFirestoreDebug(e.target.checked)} />
                                    </div>
                                </div>

                                <div className="bg-white/50 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                                     <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">System Prompt Configuration</h4>
                                            <p className="text-xs text-slate-500 mt-1">Modify the base instructions sent to the AI.</p>
                                        </div>
                                        <Button variant="secondary" onClick={() => setShowPromptsModal(true)}>Customize System Prompts</Button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="animate-fade-in max-w-2xl">
                         <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">StorySpark</h3>
                         <p className="text-lg font-medium mb-8" style={{ color: 'var(--accent-color)' }}>Version {APP_VERSION}</p>
                         
                         <div className="prose dark:prose-invert">
                             <h4>About</h4>
                             <p>StorySpark is an AI-powered creative writing suite designed to help you generate infinite stories, fan-fiction, and interactive adventures. It uses advanced large language models to weave intricate plots and remember your context over long sessions.</p>
                             
                             <h4>Privacy Policy</h4>
                             <p>Your stories and "Hero's Journey" personas are stored locally on your device (in Guest Mode) or secured in your Firebase account (when logged in). We do not use your private stories to train our models. Your keys and data belong to you.</p>
                             
                             <h4>Build Information</h4>
                             <ul className="text-sm text-slate-500 mb-6">
                                 <li>React 19.2.0</li>
                                 <li>Google GenAI SDK 1.29.1</li>
                                 <li>Puter.js Integration</li>
                                 <li>Tailwind CSS</li>
                             </ul>

                             <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                <Button variant="secondary" onClick={onOpenChangelog} className="text-sm">View Changelog</Button>
                             </div>
                         </div>
                    </div>
                )}
             </div>
        </main>
    </div>
  );
};

export default SettingsScreen;