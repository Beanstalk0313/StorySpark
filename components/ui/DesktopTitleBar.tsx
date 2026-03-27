import React, { useState, useRef, useEffect } from 'react';
import { isElectron, windowControl, triggerImport } from '../../services/electronService';

interface DesktopTitleBarProps {}

const DesktopTitleBar: React.FC<DesktopTitleBarProps> = () => {
    const [showFileMenu, setShowFileMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowFileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!isElectron()) return null;

    const handleAction = (action: 'minimize' | 'maximize' | 'close') => {
        windowControl(action);
    };

    const handleImport = (type: 'RESEARCH' | 'PERSONA') => {
        triggerImport(type);
        setShowFileMenu(false);
    };

    return (
        <div className="h-8 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between select-none sticky top-0 z-[10000] shrink-0">
            {/* Drag Area */}
            <div className="absolute inset-0" style={{ WebkitAppRegion: 'drag' } as any} />

            <div className="flex items-center relative z-10 px-2 h-full">
                {/* Stylized File Menu */}
                <div className="relative h-full flex items-center" ref={menuRef} style={{ WebkitAppRegion: 'no-drag' } as any}>
                    <button 
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className={`px-3 h-6 rounded-md text-xs font-bold transition-all duration-200 ${showFileMenu ? 'bg-[var(--accent-color)] text-white shadow-lg shadow-[var(--accent-color)]/20' : 'hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'}`}
                    >
                        File
                    </button>

                    {showFileMenu && (
                        <div className="absolute top-8 left-0 w-64 bg-white/90 dark:bg-slate-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-2 animate-in fade-in zoom-in duration-150 origin-top-left">
                            <div className="px-3 py-1 mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Import Laboratory</span>
                            </div>
                            <button onClick={() => handleImport('RESEARCH')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[var(--accent-color)] hover:text-white transition-colors flex justify-between items-center group">
                                <span>Research Data</span>
                                <span className="text-[10px] opacity-40 group-hover:opacity-100 font-mono">.ssrf</span>
                            </button>
                            <button onClick={() => handleImport('PERSONA')} className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[var(--accent-color)] hover:text-white transition-colors flex justify-between items-center group">
                                <span>Persona Profile</span>
                                <span className="text-[10px] opacity-40 group-hover:opacity-100 font-mono">.sspf</span>
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-white/5 my-1 mx-2" />
                            <button onClick={() => handleAction('close')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                Quit StorySpark
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="h-3 w-px bg-slate-300 dark:bg-white/10 mx-3" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-600 uppercase">StorySpark</span>
            </div>

            {/* Window Controls */}
            <div className="flex items-center h-full relative z-10" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button 
                    onClick={() => handleAction('minimize')} 
                    className="w-12 h-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/5 transition-colors group"
                    title="Minimize"
                >
                    <div className="w-3 h-[1.5px] bg-slate-500 group-hover:bg-slate-800 dark:group-hover:bg-white" />
                </button>
                <button 
                    onClick={() => handleAction('maximize')} 
                    className="w-12 h-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/5 transition-colors group"
                    title="Maximize"
                >
                    <div className="w-3.5 h-3.5 border-2 border-slate-500 group-hover:border-slate-800 dark:group-hover:border-white rounded-[2px]" />
                </button>
                <button 
                    onClick={() => handleAction('close')} 
                    className="w-12 h-full flex items-center justify-center hover:bg-red-500 transition-colors group"
                    title="Close"
                >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default DesktopTitleBar;
