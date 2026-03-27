
import React from 'react';
import Button from './ui/Button';

interface PageProps {
    onBack: () => void;
}

export const PrivacyPolicy: React.FC<PageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen pt-20 pb-12 px-4 container mx-auto max-w-3xl animate-fade-in">
            <Button variant="ghost" onClick={onBack} className="mb-6">&larr; Back to Home</Button>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl prose dark:prose-invert max-w-none text-slate-900 dark:text-white">
                <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
                <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
                
                <h3 className="text-xl font-bold mt-6 mb-2">1. Data Storage</h3>
                <p>StorySpark operates on a "Local First" and "Cloud Optional" basis.</p>
                <ul className="list-disc ml-5 mb-4 space-y-2">
                    <li><strong>Guest Mode:</strong> All stories, personas, and research data are stored strictly in your browser's LocalStorage. We do not have access to this data. Clearing your browser cache will delete this data.</li>
                    <li><strong>Logged In Mode:</strong> If you choose to create an account, your stories are securely stored in Google Firebase (Firestore). This allows you to sync data across devices.</li>
                </ul>

                <h3 className="text-xl font-bold mt-6 mb-2">2. AI Data Usage</h3>
                <p>Your prompts and story content are sent to third-party AI providers (Puter.js or Google Gemini) solely for the purpose of generating text. <strong>We do not use your content to train our own models.</strong></p>

                <h3 className="text-xl font-bold mt-6 mb-2">3. Account Information</h3>
                <p>We only collect your email address and display name for authentication purposes via Firebase Auth.</p>

                <h3 className="text-xl font-bold mt-6 mb-2">4. Contact</h3>
                <p>For privacy concerns, please contact the repository maintainer.</p>
            </div>
        </div>
    );
};

export const Disclaimer: React.FC<PageProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen pt-20 pb-12 px-4 container mx-auto max-w-3xl animate-fade-in">
            <Button variant="ghost" onClick={onBack} className="mb-6">&larr; Back to Home</Button>
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl prose dark:prose-invert max-w-none text-slate-900 dark:text-white">
                <h1 className="text-3xl font-bold mb-4">AI Service Disclaimer</h1>
                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 rounded text-amber-900 dark:text-amber-100 not-prose mb-6">
                    <p className="font-bold">Important Notice regarding Third-Party AI</p>
                </div>
                
                <h3 className="text-xl font-bold mt-6 mb-2">Independent Application</h3>
                <p>StorySpark is an independent application and is <strong>not affiliated, endorsed, or sponsored by Puter.js, Google, or OpenAI</strong>.</p>

                <h3 className="text-xl font-bold mt-6 mb-2">Service Availability & Reliability</h3>
                <p>StorySpark utilizes external AI APIs (such as Puter.js and Google Gemini) to generate content. Consequently:</p>
                <ul className="list-disc ml-5 mb-4 space-y-2">
                    <li>We cannot guarantee the uptime, speed, or availability of these AI services.</li>
                    <li><strong>Usage Limits:</strong> Free tiers provided by Puter.js or Gemini may hit rate limits or daily quotas, resulting in generation failures.</li>
                    <li>Providers reserve the right to throttle or modify their API access at any time without notice.</li>
                </ul>
                
                <h3 className="text-xl font-bold mt-6 mb-2">Content Generation</h3>
                <p>AI models can sometimes hallucinate facts, generate inconsistent logic, or refuse prompts based on safety filters. StorySpark provides the framework for writing, but the content quality depends on the underlying AI model.</p>

                <h3 className="text-xl font-bold mt-6 mb-2">Mitigating Limits</h3>
                <p>If you experience frequent errors or timeouts due to API limits, consider using the <strong>StorySpark Browser Extension</strong>, which allows you to run the logic directly inside ChatGPT or Google Gemini's web interface, bypassing API quotas.</p>
            </div>
        </div>
    );
};
