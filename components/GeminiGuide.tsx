import React from 'react';
import Button from './ui/Button';
import { GOOGLE_AI_STUDIO_URL } from '../constants';

interface GeminiGuideProps {
    onBack: () => void;
}

const GeminiGuide: React.FC<GeminiGuideProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-12 pb-20 px-4 animate-fade-in font-inter">
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" onClick={onBack} className="mb-8">&larr; Back to Settings</Button>
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-slate-200 dark:border-white/5">
                    <header className="mb-10 text-center">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">
                            🔑
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Gemini API Setup Guide</h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Create your own free "brain" for StorySpark in less than 2 minutes.
                        </p>
                    </header>

                    <div className="space-y-12">
                        {/* Step 1 */}
                        <section className="flex gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">1</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Visit Google AI Studio</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    Google AI Studio is a free tool for creators. Click the button below to open it in a new tab.
                                </p>
                                <a 
                                    href={GOOGLE_AI_STUDIO_URL} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-6 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl font-bold text-blue-600 dark:text-blue-400 transition-colors"
                                >
                                    Open AI Studio &rarr;
                                </a>
                            </div>
                        </section>

                        {/* Step 2 */}
                        <section className="flex gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">2</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sign In with Google</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Sign in using your regular personal Google account (the same one you use for Gmail or YouTube). 
                                    If it asks you to agree to terms, check the boxes to continue.
                                </p>
                            </div>
                        </section>

                        {/* Step 3 */}
                        <section className="flex gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">3</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generate Your Key</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    Look for the sidebar on the left and click on <strong className="text-slate-900 dark:text-white">"Get API key"</strong>. 
                                    Then, click the blue button that says <strong className="text-slate-900 dark:text-white">"Create API key in new project"</strong>.
                                </p>
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm italic text-blue-800 dark:text-blue-200">
                                    "Google Cloud" might sound scary, but don't worry! This is a standard process and doesn't cost anything.
                                </div>
                            </div>
                        </section>

                        {/* Step 4 */}
                        <section className="flex gap-6">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-600/20">4</div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Copy & Paste</h3>
                                <p className="text-slate-600 dark:text-slate-400">
                                    Once the key is created, click <strong className="text-slate-900 dark:text-white">"Copy"</strong>. 
                                    Come back here to StorySpark Settings and paste it into the "Personal API Key" box.
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="mt-16 pt-10 border-t border-slate-200 dark:border-white/5 text-center">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">All Set?</h4>
                        <Button onClick={onBack} className="px-10">Return to Settings</Button>
                    </div>
                </div>

                <div className="mt-8 text-center text-slate-500 text-sm">
                    <p>Having trouble? Ensure you are using a <strong>Personal Account</strong>. Workspace/School accounts often have API access disabled by administrators.</p>
                </div>
            </div>
        </div>
    );
};

export default GeminiGuide;