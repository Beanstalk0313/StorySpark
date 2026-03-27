
import React from 'react';
import Button from './ui/Button';

interface ExtensionGuideProps {
    onBack: () => void;
}

const ExtensionGuide: React.FC<ExtensionGuideProps> = ({ onBack }) => {

    const handleDownload = () => {
        // Simulates downloading the zip from the public/root folder
        const link = document.createElement('a');
        link.href = '/storyspark-extension.zip'; 
        link.download = 'storyspark-extension.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen pt-20 pb-20 px-4 container mx-auto max-w-5xl animate-fade-in font-inter text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" onClick={onBack}>&larr; Back to App</Button>
            </div>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                        No API Keys Required
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">StorySpark Anywhere</h1>
                    <p className="text-lg md:text-xl text-indigo-100 max-w-2xl mb-8 leading-relaxed">
                        Bypass API limits by running StorySpark directly inside ChatGPT or Google Gemini. 
                        Bring your personas, context, and infinite story engine to the most powerful web interfaces.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleDownload} className="bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-xl text-lg px-8 py-4">
                            Download Extension (.zip)
                        </Button>
                        <a 
                            href="https://gemini.google.com/gem/1BAbafi2rQxv3SO4JWvmnruI2j5qLG3z2?usp=sharing" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-2.5 font-semibold rounded-full transition-all duration-300 bg-indigo-800/50 hover:bg-indigo-800/80 border border-white/20 text-white"
                        >
                            Open Gemini Gem &rarr;
                        </a>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Compatibility Warning */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-r-xl">
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-100 mb-2">Desktop Only</h3>
                        <p className="text-amber-700 dark:text-amber-200/80">
                            This extension is designed for <strong>Desktop Chromium Browsers</strong> (Chrome, Edge, Opera, Brave, Vivaldi). 
                            Mobile browsers and Safari are not officially supported. The experience on mobile devices may be suboptimal or non-functional.
                        </p>
                    </div>

                    {/* Step 1: Install */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xl">1</div>
                            <h2 className="text-2xl font-bold">Installation</h2>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-4">
                            <ol className="list-decimal ml-5 space-y-3 text-slate-700 dark:text-slate-300">
                                <li>Click the download button above to get <code>storyspark-extension.zip</code>.</li>
                                <li>Extract the ZIP file to a folder on your computer. Remember this location.</li>
                                <li>Open your browser and navigate to <code>chrome://extensions</code> (or select Extensions from the menu).</li>
                                <li>Toggle <strong>Developer Mode</strong> in the top right corner.</li>
                                <li>Click the <strong>Load Unpacked</strong> button that appears.</li>
                                <li>Select the folder where you extracted the extension files.</li>
                            </ol>
                            <div className="mt-4 p-4 bg-slate-100 dark:bg-black/30 rounded-lg text-sm text-slate-500">
                                <em>Tip: Pin the StorySpark icon to your browser toolbar for easy access.</em>
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Usage */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xl">2</div>
                            <h2 className="text-2xl font-bold">How to Use</h2>
                        </div>
                        <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-lg mb-2">The Standard Method</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Works on ChatGPT and Gemini.</p>
                                    <ol className="list-decimal ml-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                        <li>Open the AI website (e.g., chatgpt.com).</li>
                                        <li>Click the StorySpark Extension icon.</li>
                                        <li>Click <strong>"Copy Master Prompt"</strong>.</li>
                                        <li>Paste this into the chat box and send it.</li>
                                        <li>The AI will confirm it is ready.</li>
                                        <li>Click <strong>"Initialize StorySpark"</strong> in the extension popup.</li>
                                    </ol>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <h3 className="font-bold text-lg mb-2 text-indigo-700 dark:text-indigo-300">The Gemini Shortcut</h3>
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-4">Skip the Master Prompt step entirely.</p>
                                    <ol className="list-decimal ml-5 space-y-2 text-sm text-indigo-800 dark:text-indigo-200">
                                        <li>Click the <strong>"Open Gemini Gem"</strong> button at the top of this page.</li>
                                        <li>This loads a pre-configured version of Gemini.</li>
                                        <li>Simply click the StorySpark Extension icon.</li>
                                        <li>Click <strong>"Initialize StorySpark"</strong> immediately.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 p-6 rounded-2xl sticky top-24">
                        <h3 className="font-bold text-xl mb-4">Why use the Extension?</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <strong className="block text-slate-900 dark:text-white">Unlimited Generation</strong>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Bypass Puter.js and API rate limits by using the web interface directly.</span>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <strong className="block text-slate-900 dark:text-white">Smarter Models</strong>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Access GPT-4o or Gemini Advanced if you have a subscription.</span>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <div>
                                    <strong className="block text-slate-900 dark:text-white">Same Great Tools</strong>
                                    <span className="text-sm text-slate-600 dark:text-slate-400">The extension injects the StorySpark UI (Hero's Journey, Inventory, Dice Rolling) directly into the chat page.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExtensionGuide;
