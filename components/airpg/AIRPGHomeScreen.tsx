import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { User } from '../../types';
import { isElectron } from '../../services/electronService';

interface AIRPGHomeScreenProps {
    user: User | null;
    onStartSolo: () => void;
    onCreateLobby: () => void;
    onJoinLobby: (code: string) => void;
    onBack: () => void;
    onStartPerchanceRPG: () => void;
}

const AIRPGHomeScreen: React.FC<AIRPGHomeScreenProps> = ({ user, onStartSolo, onCreateLobby, onJoinLobby, onBack, onStartPerchanceRPG }) => {
    const [joinCode, setJoinCode] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();
        // Handle full URLs pasted
        if (code.includes('/airpg?code=')) {
            const extracted = code.split('code=')[1];
            if (extracted) onJoinLobby(extracted);
        } else {
            if (code.length < 4) return alert("Invalid Room Code");
            onJoinLobby(code);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                AI RPG
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12">
                Step into the story. Play alone or with friends in a reactive, AI-narrated world.
            </p>

            <div className={`grid ${isElectron() ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 max-w-5xl mx-auto`}>
                {/* SOLO CARD */}
                <div className="bg-white/40 dark:bg-white/5 border border-purple-200 dark:border-purple-900/50 rounded-3xl p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-2 shadow-xl">
                    <div className="text-4xl mb-4">🗡️</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Solo Adventure</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                        You are the sole protagonist. The world revolves around your choices.
                    </p>
                    <Button onClick={onStartSolo} className="w-full bg-purple-600 hover:bg-purple-700 border-none shadow-purple-500/30">
                        Start Solo Journey
                    </Button>
                </div>

                {/* MULTIPLAYER CARD */}
                <div className="bg-white/40 dark:bg-white/5 border border-pink-200 dark:border-pink-900/50 rounded-3xl p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-2 shadow-xl">
                    <div className="text-4xl mb-4">⚔️</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Multiplayer Party</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
                        Form a party. The AI acts as the Game Master for you and your friends.
                    </p>
                    
                    {user ? (
                        <div className="space-y-4">
                            <Button onClick={onCreateLobby} className="w-full bg-pink-600 hover:bg-pink-700 border-none shadow-pink-500/30">
                                Host New Room
                            </Button>
                            
                            <div className="relative flex items-center gap-2 pt-2">
                                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1"></div>
                                <span className="text-xs text-slate-400 font-bold">OR JOIN</span>
                                <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1"></div>
                            </div>

                            <form onSubmit={handleJoin} className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Enter Code" 
                                    className="flex-1 bg-white/50 dark:bg-black/30 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-center font-mono uppercase tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value)}
                                />
                                <button type="submit" className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white px-4 rounded-lg font-bold transition-colors">
                                    &rarr;
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                            Please log in or continue as Guest to play multiplayer.
                        </div>
                    )}
                </div>

                {/* PERCHANCE RPG CARD (ELECTRON ONLY) */}
                {isElectron() && (
                    <div className="bg-white/40 dark:bg-white/5 border border-orange-200 dark:border-orange-900/50 rounded-3xl p-8 hover:bg-white/60 dark:hover:bg-white/10 transition-all hover:-translate-y-2 shadow-xl flex flex-col">
                        <div className="text-4xl mb-4">🧙‍♂️</div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Perchance RPG</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm flex-grow">
                            Classic StorySpark RPG experience powered by Perchance. Great for quick, free-form roleplay.
                        </p>
                        <Button onClick={onStartPerchanceRPG} className="w-full bg-orange-600 hover:bg-orange-700 border-none shadow-orange-500/30">
                            Launch Classic RPG
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-12">
                 <Button variant="ghost" onClick={onBack}>&larr; Back to Main App</Button>
            </div>
        </div>
    );
};

export default AIRPGHomeScreen;