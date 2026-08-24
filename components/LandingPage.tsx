
import React from 'react';
import Button from './ui/Button';

interface LandingPageProps {
    onLaunch: () => void;
    onViewExtension?: () => void; // Optional prop for navigation
}

const LandingPage: React.FC<LandingPageProps & { onViewExtension?: () => void }> = ({ onLaunch, onViewExtension }) => {
    
    // Helper to handle navigation if passed, otherwise default to location
    const handleExtensionClick = () => {
        if (onViewExtension) {
            onViewExtension();
        } else {
            window.history.pushState({}, '', '/extension');
            // Trigger a popstate event so App.tsx catches it if this component isn't strictly controlled
            window.dispatchEvent(new PopStateEvent('popstate'));
        }
    }

    return (
        <div className="min-h-screen flex flex-col font-inter text-slate-900 dark:text-white">
            {/* Nav */}
            <nav className="fixed w-full z-50 bg-white/60 dark:bg-black/60 backdrop-blur-md border-b border-slate-200 dark:border-white/5">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
                            <g transform="translate(1.2, 3.3) scale(0.9)">
                                <path fill="#38BDF8" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                <path fill="#38BDF8" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </g>
                            <g transform="translate(7.2, 4.2) scale(0.4)">
                                <polygon fill="#FBBF24" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </g>
                        </svg>
                        <span className="text-xl font-bold tracking-tight">StorySpark</span>
                    </div>
                    <div>
                        <Button onClick={onLaunch} className="shadow-xl shadow-[var(--accent-color)]/20">Launch App</Button>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className="pt-40 pb-20 px-6 container mx-auto text-center relative z-10">
                <div className="animate-fade-in space-y-8">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--accent-color)] bg-opacity-10 text-[var(--accent-color)] text-sm font-bold tracking-wide border border-[var(--accent-color)] border-opacity-20">
                        v6.0 Independence Update
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
                        Write Your Legacy.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-color)] to-purple-600">One Story at a Time.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        An AI-powered creative suite designed for serious writers. Create original novels, continue your favorite franchises, or roleplay in a reactive world.
                    </p>
                    <div className="pt-4 flex justify-center gap-4">
                        <Button onClick={onLaunch} className="text-lg px-8 py-4 shadow-2xl shadow-[var(--accent-color)]/30 hover:scale-105 transition-transform">Start Writing Now</Button>
                    </div>
                </div>
            </header>

            {/* Features */}
            <section className="py-20 bg-white/40 dark:bg-black/20 backdrop-blur-sm">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/5 shadow-lg hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Infinite Context</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Most AIs forget the beginning of the book by chapter 3. StorySpark uses intelligent summarization and context injection to keep your plot consistent for 100+ chapters.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/5 shadow-lg hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Adventure Mode</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Don't just write—play. Import a "Hero's Journey" persona file (.sspf) and let the AI function as your Game Master in an interactive roleplaying experience.</p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/5 shadow-lg hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Cloud Secure</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Your stories belong to you. Export to PDF or Word Docx at any time. All your progress, including Perchance modes, syncs securely to your account via Firestore.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Extension Promo */}
            <section className="py-16 bg-[var(--accent-color)] bg-opacity-10 border-y border-[var(--accent-color)] border-opacity-20">
                <div className="container mx-auto px-6 text-center md:text-left flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Hit API Limits? Go Limitless.</h2>
                        <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
                            Experience StorySpark directly inside <strong>ChatGPT</strong> or <strong>Google Gemini</strong> with our new desktop browser extension. 
                            Use your own accounts to bypass free-tier API restrictions.
                        </p>
                        <Button onClick={handleExtensionClick} className="bg-[var(--accent-color)] text-white hover:opacity-90 shadow-lg">
                            Get the Extension &rarr;
                        </Button>
                    </div>
                    <div className="w-full md:w-1/3 flex justify-center">
                        <div className="w-48 h-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex items-center justify-center text-6xl rotate-6 hover:rotate-0 transition-transform duration-500 border border-white/20">
                            🚀
                        </div>
                    </div>
                </div>
            </section>

            {/* Desktop App Promo */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10 pointer-events-none"></div>
                <div className="container mx-auto px-6">
                    <div className="bg-gradient-to-br from-slate-900 to-black rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl border border-white/10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 blur-[100px] -mr-48 -mt-48"></div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                            <div className="flex-1 text-center md:text-left space-y-6">
                                <span className="inline-block px-3 py-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">New: StorySpark Desktop</span>
                                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">Take Your Writing <br/><span className="text-orange-500">To The Next Level.</span></h2>
                                <p className="text-lg text-slate-400 max-w-xl">
                                    Our native desktop app unlocks exclusive features: Perchance Story & Chat modes, a specialized Classic RPG engine, native file handling, and superior performance with automated RAM reclamation.
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-orange-600 text-white border-none px-8 py-4 text-lg font-bold rounded-2xl shadow-xl shadow-orange-900/20 opacity-50 cursor-not-allowed text-center">
                                            Beta App Coming Soon
                                        </div>
                                        <p className="text-xs text-orange-500/70 text-center md:text-left">
                                            Contact <strong>beanstalk313@outlook.com</strong> to join the Beta.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 text-sm italic py-4">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        Includes Installer & Standalone
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-2/5 aspect-square bg-slate-800/50 rounded-3xl border border-white/10 backdrop-blur-3xl flex items-center justify-center relative group">
                                <div className="text-8xl group-hover:scale-110 transition-transform duration-500">🖥️</div>
                                <div className="absolute -bottom-4 -right-4 bg-orange-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg rotate-3 group-hover:rotate-0 transition-transform">EXCLUSIVE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

             {/* Research */}
             <section className="py-20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-12">
                     <div className="flex-1 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-bold">Research the Multiverse.</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Writing fan fiction? StorySpark can generate "Canon Research Files" (.ssrf) for any franchise—Star Wars, Harry Potter, Dune, you name it. It pulls specific lore, character details, and timelines to ensure the AI stays true to the source material.
                        </p>
                         <ul className="space-y-3">
                            {['Auto-generated Wiki Data', 'Editable Knowledge Graph', 'Multiple Franchise Crossovers'].map(item => (
                                <li key={item} className="flex items-center gap-3">
                                    <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                     </div>
                     <div className="flex-1 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 p-1 rounded-2xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                         <div className="bg-white dark:bg-slate-950 rounded-xl p-8 h-80 flex items-center justify-center border border-white/10">
                             <div className="text-center">
                                 <span className="text-6xl mb-4 block">📚</span>
                                 <div className="text-sm font-mono text-slate-500">research_topic.ssrf</div>
                             </div>
                         </div>
                     </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
