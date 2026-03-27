import React, { useState } from 'react';
import { User } from '../types';
import Button from './ui/Button';
import { runFirestoreDiagnostics } from '../services/firestoreService';

interface AccountScreenProps {
    user: User;
    onBack: () => void;
    onLogout: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ user, onBack, onLogout }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [showRulesHelp, setShowRulesHelp] = useState(false);
    const [indexLink, setIndexLink] = useState<string | null>(null);

    const handleCopyUid = () => {
        navigator.clipboard.writeText(user.uid);
        alert("User ID copied to clipboard.");
    };

    const handleRunDiagnostics = async () => {
        setIsRunningTests(true);
        setShowRulesHelp(false);
        setIndexLink(null);
        setLogs(["Initializing diagnostics..."]);
        try {
            const results = await runFirestoreDiagnostics(user.uid);
            setLogs(prev => [...prev, ...results, "Done."]);
            
            const foundLink = results.find(l => l.startsWith('https://console.firebase.google.com'));
            if (foundLink) setIndexLink(foundLink);

            const hasCriticalFailure = results.some(l => l.includes('❌ Standard Search Failed'));
            if (hasCriticalFailure) setShowRulesHelp(true);
        } catch (e) {
            setLogs(prev => [...prev, "Diagnostics failed hard."]);
        } finally {
            setIsRunningTests(false);
        }
    };

    const manualIndexLink = `https://console.firebase.google.com/project/storyspark-b313/firestore/indexes/composite/add?collectionGroup=chapters&fieldPaths=userId&fieldOrder=ASCENDING`;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={onBack}>&larr; Back to App</Button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account & Data</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 shadow-xl">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--accent-color)] to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user.displayName?.charAt(0).toUpperCase() || 'U'
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{user.displayName || 'Anonymous User'}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{user.email || 'No email linked'}</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <code className="bg-slate-100 dark:bg-black/30 px-3 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-400 select-all">
                                {user.uid}
                            </code>
                            <button onClick={handleCopyUid} className="text-xs text-[var(--accent-color)] hover:underline font-bold">Copy UID</button>
                        </div>
                    </div>
                    <div>
                        <Button variant="secondary" onClick={onLogout} className="text-red-500 hover:text-white hover:bg-red-500 border-red-200 dark:border-red-900">Sign Out</Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Database Diagnostics</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Check your connection and find missing indexes.
                    </p>
                    <Button onClick={handleRunDiagnostics} disabled={isRunningTests} className="w-full mb-4">
                        {isRunningTests ? 'Running Tests...' : 'Run Connection Test'}
                    </Button>
                    
                    {logs.length > 0 && (
                        <div className="bg-black text-green-400 font-mono text-xs p-4 rounded-lg h-40 overflow-y-auto">
                            {logs.map((l, i) => <div key={i} className="mb-1 border-b border-white/10 pb-1 last:border-0">{l}</div>)}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <span className="text-amber-500">⚠️</span> Missing Index Fix
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            If you see an error about "Collection Group Indexes", click below to open the Firebase Console with the correct settings pre-filled.
                        </p>
                    </div>
                    <a 
                        href={manualIndexLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full inline-flex justify-center items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
                    >
                        Create Chapters Index &rarr;
                    </a>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Security Configuration</h3>
                    <Button variant="ghost" onClick={() => setShowRulesHelp(!showRulesHelp)} className="text-xs">
                        {showRulesHelp ? 'Hide Rules' : 'View Recommended Rules'}
                    </Button>
                </div>
                
                {showRulesHelp && (
                    <div className="animate-fade-in space-y-4">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                            Paste these into Firestore &gt; Rules to secure your data and enable sharing.
                        </p>
                        <div className="relative">
                            <pre className="bg-black/80 text-gray-300 p-4 rounded-lg text-[11px] overflow-x-auto font-mono whitespace-pre leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isOwner(data) {
      return request.auth != null && (
        (data != null && data.userId == request.auth.uid) || 
        (data != null && data.get('userId', '') == request.auth.uid)
      );
    }

    match /_diagnostics/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /books/{bookId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      
      allow read: if isOwner(resource.data) || (resource.data != null && resource.data.get('isPublic', false) == true);
      
      allow update, delete: if isOwner(resource.data);

      match /chapters/{chapterId} {
        allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
        
        allow read: if isOwner(resource.data)
                    || (exists(/databases/$(database)/documents/books/$(bookId)) && get(/databases/$(database)/documents/books/$(bookId)).data.get('isPublic', false) == true);
                    
        allow update, delete: if isOwner(resource.data);
      }
    }
    
    match /{path=**}/chapters/{chapterId} {
      allow read: if isOwner(resource.data);
    }
  }
}`}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountScreen;