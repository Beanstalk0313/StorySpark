
import React from 'react';

interface AppFooterProps {
    onNavigate: (path: string) => void;
}

const AppFooter: React.FC<AppFooterProps> = ({ onNavigate }) => {
    return (
        <footer className="w-full bg-white/50 dark:bg-black/40 backdrop-blur-md border-t border-slate-200 dark:border-white/5 py-8 mt-12">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <button onClick={() => onNavigate('/')} className="hover:text-[var(--accent-color)] transition-colors">Home</button>
                    <button onClick={() => onNavigate('/create')} className="hover:text-[var(--accent-color)] transition-colors">Launch App</button>
                    <button onClick={() => onNavigate('/extension')} className="hover:text-[var(--accent-color)] transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Get Extension
                    </button>
                    <button onClick={() => onNavigate('/privacy')} className="hover:text-[var(--accent-color)] transition-colors">Privacy Policy</button>
                    <button onClick={() => onNavigate('/disclaimer')} className="hover:text-[var(--accent-color)] transition-colors">AI Disclaimer</button>
                    <a href="https://discord.gg/your-discord-link" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] transition-colors flex items-center gap-1">
                        Discord
                    </a>
                </div>
                <div className="mb-6 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed bg-white/30 dark:bg-white/5 p-3 rounded-2xl border border-white/40 dark:border-white/5">
                    <p className="font-bold mb-1">Feedback & Support</p>
                    Reach out to <a href="mailto:beanstalk0013+StorySpark@gmail.com" className="text-[var(--accent-color)] font-mono hover:underline">beanstalk0013+StorySpark@gmail.com</a>. 
                    <p className="mt-1 opacity-60 italic">Adding the "+StorySpark" suffix ensures your request is prioritized and helps me know exactly what you're looking for!</p>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-600">
                    <p>&copy; {new Date().getFullYear()} StorySpark. All rights reserved.</p>
                    <p className="mt-1">StorySpark is not affiliated with Puter.js, Google, or any referenced franchises.</p>
                </div>
            </div>
        </footer>
    );
};

export default AppFooter;
