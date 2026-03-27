

import React, { useState } from 'react';
import { CHANGELOG, APP_VERSION } from '../constants';
import Button from './ui/Button';
import Checkbox from './ui/Checkbox';

interface ChangelogModalProps {
    onClose: () => void;
}

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    const selectedLog = CHANGELOG[selectedIndex];

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('storyspark-last-seen-version', APP_VERSION);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={handleClose}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-[var(--accent-color)] p-6 text-white relative overflow-hidden flex-shrink-0">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium opacity-90 uppercase tracking-wider">What's New</p>
                            <h2 className="text-3xl font-bold">StorySpark Updates</h2>
                        </div>
                        <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md">
                            Current: v{APP_VERSION}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-1/3 bg-slate-50 dark:bg-black/20 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                        {CHANGELOG.map((log, idx) => (
                            <button
                                key={log.version}
                                onClick={() => setSelectedIndex(idx)}
                                className={`w-full text-left px-4 py-3 text-sm border-b border-slate-100 dark:border-slate-800 transition-colors ${idx === selectedIndex ? 'bg-white dark:bg-slate-800 border-l-4 border-l-[var(--accent-color)] font-bold text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                                <span className="block">v{log.version}</span>
                                <span className="text-xs font-normal opacity-70 truncate">{log.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="w-2/3 p-6 md:p-8 overflow-y-auto bg-white dark:bg-slate-900">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">v{selectedLog.version}</h3>
                            <h4 className="text-lg text-[var(--accent-color)] font-medium">{selectedLog.title}</h4>
                        </div>
                        
                        <ul className="space-y-4">
                            {selectedLog.changes.map((change, idx) => (
                                <li key={idx} className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                    <span className="flex-shrink-0 mt-1 text-[var(--accent-color)]">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                    <span>{change}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
                     <Checkbox 
                        id="hide-changelog" 
                        label="Don't show for this version" 
                        checked={dontShowAgain}
                        onChange={e => setDontShowAgain(e.target.checked)}
                     />
                     <Button onClick={handleClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;