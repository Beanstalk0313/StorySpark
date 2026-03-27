
import React, { useState, useEffect, useRef } from 'react';
import { MultiplayerPlayer, RoomState, ChatMessage, AIProvider, Book } from '../../types';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { sendChatMessage, setPlayerAction, appendNarrative, streamNarrative, setGeneratingStatus, clearAllActions, updateNarrativeTurn } from '../../services/rtdbService';
import { writeChapterStream as aiWriteChapterStream } from '../../services/aiService';

interface MultiplayerGameScreenProps {
    roomId: string;
    currentUserUid: string;
    roomState: RoomState;
    players: Record<string, MultiplayerPlayer>;
    chat: Record<string, ChatMessage>;
    onLeave: () => void;
    aiProvider: AIProvider;
}

interface NarrativeItem {
    id: string;
    content: string;
    turnNumber: number;
}

// Minimal Markdown to HTML converter
const mdToHtml = (md: string) => {
    if (!md) return '';
    let html = md
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<em>$1</em>')
        .replace(/\n/gim, '<br />');
    return html;
};

// Strips analysis metadata
const cleanContent = (content: string) => {
    return content.split('___ANALYSIS_START___')[0].trim();
};

// Parses out personalized blocks
const getPersonalizedContent = (fullText: string, myName: string, isHost: boolean) => {
    const cleaned = cleanContent(fullText);
    
    // Split by specific delimiter regex
    const sections = cleaned.split(/(?=:::)/g);
    
    let finalText = '';
    
    sections.forEach(section => {
        const match = section.match(/^:::\s*(.*?)\s*:::/);
        if (match) {
            const targetName = match[1].trim();
            const body = section.replace(match[0], '').trim();
            
            // Host sees all, Player sees their own + General (non-marked sections)
            // But wait, "General" usually doesn't have a marker.
            // If section has marker, check target.
            
            if (isHost) {
                finalText += `<div class="my-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded text-sm"><span class="text-xs font-bold uppercase text-indigo-500 mb-1 block">Private to ${targetName}</span>${mdToHtml(body)}</div>`;
            } else if (targetName.toLowerCase() === myName.toLowerCase()) {
                finalText += `<div class="my-4 p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded text-sm"><span class="text-xs font-bold uppercase text-amber-500 mb-1 block">Secret</span>${mdToHtml(body)}</div>`;
            }
            // If not host and not target, hide it.
        } else {
            // No marker -> General text
            finalText += `<div class="mb-4">${mdToHtml(section)}</div>`;
        }
    });
    
    return finalText;
};

const MultiplayerGameScreen: React.FC<MultiplayerGameScreenProps> = ({ roomId, currentUserUid, roomState, players, chat, onLeave, aiProvider }) => {
    const [actionInput, setActionInput] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [sidebarTab, setSidebarTab] = useState<'chat'|'history'>('chat');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Host Edit State
    const [editingTurnId, setEditingTurnId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const currentPlayer = players[currentUserUid];
    // Safety check: if currentPlayer is missing (e.g. just joined and RTDB hasn't synced), use defaults
    const isHost = roomState.hostUid === currentUserUid; 
    // Fallback: If no hostUid set, assume I am host if I am first player (handled by joinRoom usually)
    
    const playerList = Object.values(players || {}) as MultiplayerPlayer[];
    const chatList = (Object.values(chat || {}) as ChatMessage[]).sort((a, b) => a.timestamp - b.timestamp);

    const rawHistory = roomState.narrativeHistory;
    
    // Explicitly cast to known interface to avoid 'unknown' type errors when using Object.values
    const narrativeHistory = (rawHistory 
        ? (Array.isArray(rawHistory) ? rawHistory : Object.values(rawHistory))
        : []) as NarrativeItem[];

    narrativeHistory.sort((a, b) => a.turnNumber - b.turnNumber);

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const narrativeRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatList.length, sidebarOpen, sidebarTab]);

    // Auto-scroll narrative
    useEffect(() => {
         if (narrativeRef.current && !editingTurnId) {
            narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
        }
    }, [narrativeHistory.length, roomState.currentTurnText, editingTurnId]);

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendChatMessage(roomId, {
            senderUid: currentUserUid,
            senderName: currentPlayer?.displayName || 'Unknown',
            content: chatInput.trim()
        });
        setChatInput('');
    };

    const submitAction = () => {
        if (!actionInput.trim()) return;
        setPlayerAction(roomId, currentUserUid, actionInput.trim());
        setActionInput('');
    };

    const handleHostAdvanceTurn = async () => {
        if (!isHost || roomState.isGenerating) return;

        const actions = playerList.map(p => 
            `- ${p.persona?.name || p.displayName}: ${p.currentAction || 'Doing nothing.'}`
        ).join('\n');

        setGeneratingStatus(roomId, true);

        const context = narrativeHistory.slice(-3).map(h => `Turn ${h.turnNumber}: ${h.content}`).join('\n\n');
        
        const mockBook: any = {
            title: "Multiplayer Adventure",
            chapters: narrativeHistory.map((h, i) => ({ id: h.id, content: h.content, index: i })),
            request: {
                type: 'ADVENTURE',
                plot: roomState.settings.plotPremise,
                chapterLength: roomState.settings.chapterLength,
                persona: { name: 'THE PARTY', activeTraits: [], unlockedMemories: [] }
            },
            researchSummary: `Genre: ${roomState.settings.genre}. This is a multiplayer party RPG.`,
            userNotes: `IMPORTANT: Provide specific outcomes for each player action.
            If a player discovers something private, use this format:
            ::: [PlayerName] :::
            (Private information here)
            :::
            
            Keep the main narrative general.`,
            longTermGoals: ''
        };

        const partyPrompt = `PARTY ACTIONS:\n${actions}\n\nBased on these actions, what happens next? Address the group.`;

        try {
            const stream = aiWriteChapterStream(mockBook, partyPrompt);
            
            let fullContent = '';
            for await (const chunk of stream) {
                fullContent += chunk;
                streamNarrative(roomId, fullContent);
            }
            
            await appendNarrative(roomId, fullContent, roomState.turnIndex);
            await clearAllActions(roomId, Object.keys(players || {}));

        } catch (e) {
            console.error(e);
            streamNarrative(roomId, "Error: The GM fainted. Please try again.");
            setGeneratingStatus(roomId, false);
        }
    };

    const startEditing = (turnId: string, currentContent: string) => {
        setEditingTurnId(turnId);
        setEditContent(currentContent);
    };

    const saveEdit = async () => {
        if (editingTurnId) {
            await updateNarrativeTurn(roomId, editingTurnId, editContent);
            setEditingTurnId(null);
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden animate-fade-in font-inter">
            
            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col h-full relative">
                <header className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/40 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-lg">AI RPG <span className="text-[var(--accent-color)]">#{roomId}</span></h1>
                        <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">Turn {roomState.turnIndex + 1}</span>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-2xl">
                             📜
                         </button>
                         <Button variant="ghost" onClick={onLeave} className="text-red-500 hover:text-red-600 text-xs">Exit</Button>
                    </div>
                </header>

                <div ref={narrativeRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar bg-white/40 dark:bg-slate-900/50 scroll-smooth">
                    {narrativeHistory.length === 0 && (
                        <div className="text-center italic text-slate-500 mt-10">
                            The adventure begins...<br/>
                            <span className="text-sm">Host: Ask everyone to submit their first move!</span>
                        </div>
                    )}
                    
                    {narrativeHistory.map(turn => (
                        <div key={turn.id} id={`turn-${turn.turnNumber}`} className="prose dark:prose-invert max-w-none bg-white/80 dark:bg-black/40 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Turn {turn.turnNumber}</span>
                                {isHost && !editingTurnId && (
                                    <button onClick={() => startEditing(turn.id, turn.content)} className="text-[10px] text-[var(--accent-color)] hover:underline font-bold">EDIT</button>
                                )}
                            </div>
                            
                            {editingTurnId === turn.id ? (
                                <div className="space-y-2">
                                    <Textarea label="Edit Turn" id="edit-turn" value={editContent} onChange={e => setEditContent(e.target.value)} rows={6} className="!bg-white dark:!bg-black/50" />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" onClick={() => setEditingTurnId(null)} className="text-xs">Cancel</Button>
                                        <Button onClick={saveEdit} className="text-xs">Save Changes</Button>
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className="leading-relaxed"
                                    dangerouslySetInnerHTML={{ 
                                        __html: getPersonalizedContent(
                                            turn.content, 
                                            currentPlayer?.persona?.name || currentPlayer?.displayName || 'User', 
                                            isHost
                                        ) 
                                    }} 
                                />
                            )}
                        </div>
                    ))}
                    
                    {roomState.currentTurnText && (
                        <div className="prose dark:prose-invert max-w-none bg-white/80 dark:bg-black/40 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-white/5 animate-pulse">
                             <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: mdToHtml(roomState.currentTurnText) }} />
                             <span className="inline-block w-2 h-4 bg-[var(--accent-color)] ml-1"></span>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/80 dark:bg-black/60 border-t border-slate-200 dark:border-white/10 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto flex flex-col gap-3">
                        {currentPlayer?.currentAction ? (
                             <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex justify-between items-center">
                                 <div>
                                     <div className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">Action Submitted</div>
                                     <div className="text-sm italic text-slate-700 dark:text-slate-300">"{currentPlayer.currentAction}"</div>
                                 </div>
                                 <Button variant="ghost" onClick={() => setPlayerAction(roomId, currentUserUid, null as any)} className="text-xs">Change</Button>
                             </div>
                        ) : (
                            <div className="flex gap-2">
                                <Textarea 
                                    label="" 
                                    id="action-input" 
                                    value={actionInput} 
                                    onChange={e => setActionInput(e.target.value)} 
                                    placeholder={roomState.isGenerating ? "Wait for the GM..." : "What do you do?"}
                                    rows={2} 
                                    className="!bg-white dark:!bg-black/40"
                                    disabled={roomState.isGenerating}
                                />
                                <Button onClick={submitAction} disabled={!actionInput.trim() || roomState.isGenerating} className="h-auto">
                                    Act
                                </Button>
                            </div>
                        )}
                        
                        {isHost && (
                            <div className="flex items-center justify-between bg-slate-100 dark:bg-white/5 p-2 rounded-lg mt-2">
                                <div className="text-xs text-slate-500 pl-2">
                                    {playerList.filter(p => p.currentAction).length} / {playerList.length} Players Ready
                                </div>
                                <Button 
                                    onClick={handleHostAdvanceTurn} 
                                    disabled={roomState.isGenerating}
                                    className={`text-xs py-1.5 ${playerList.some(p => !p.currentAction) ? 'bg-slate-500' : 'bg-green-600'}`}
                                >
                                    {roomState.isGenerating ? 'AI Thinking...' : 'Advance Turn'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 transform transition-transform duration-300 z-20 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-white/10">
                        <button onClick={() => setSidebarTab('chat')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === 'chat' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>Chat & Status</button>
                        <button onClick={() => setSidebarTab('history')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === 'history' ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}>History</button>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden px-4 text-slate-400">&times;</button>
                    </div>

                    {sidebarTab === 'chat' && (
                        <>
                            <div className="h-1/3 border-b border-slate-200 dark:border-white/10 flex flex-col">
                                <div className="p-2 bg-slate-50 dark:bg-black/20 text-[10px] uppercase text-slate-500 font-bold text-center">Party</div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {playerList.map(p => (
                                        <div key={p.uid} className={`p-2 rounded-lg border flex items-center gap-2 ${p.currentAction ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900' : 'bg-slate-50 dark:bg-white/5 border-transparent'}`}>
                                            <div className="relative">
                                                <div className="w-8 h-8 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                                                    {p.displayName[0]}
                                                </div>
                                                {p.isHost && <div className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white px-1 rounded">GM</div>}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-sm font-bold truncate">{p.displayName}</div>
                                                <div className="text-[10px] text-slate-500 truncate">{p.persona?.name}</div>
                                            </div>
                                            <div className={`text-xs font-bold ${p.currentAction ? 'text-green-600' : 'text-slate-400'}`}>
                                                {p.currentAction ? 'READY' : '...'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                 <div className="p-2 bg-slate-50 dark:bg-black/20 text-[10px] uppercase text-slate-500 font-bold text-center">Live Comms</div>
                                 <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                                    {chatList.map(msg => (
                                        <div key={msg.id} className="flex flex-col">
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-xs font-bold ${msg.senderUid === currentUserUid ? 'text-[var(--accent-color)]' : 'text-slate-600 dark:text-slate-400'}`}>
                                                    {msg.senderName}
                                                </span>
                                                <span className="text-[9px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className="text-sm text-slate-800 dark:text-slate-200 bg-black/5 dark:bg-white/5 p-2 rounded-lg rounded-tl-none mt-1 break-words">
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                 </div>
                                 <form onSubmit={handleSendChat} className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
                                     <input 
                                        className="w-full bg-white dark:bg-black/40 border border-slate-300 dark:border-slate-700 rounded-full px-3 py-2 text-sm outline-none focus:border-[var(--accent-color)]"
                                        placeholder="Chat..."
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                     />
                                 </form>
                            </div>
                        </>
                    )}

                    {sidebarTab === 'history' && (
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50 dark:bg-black/10">
                            {narrativeHistory.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">No history yet.</p>}
                            {narrativeHistory.map((turn, i) => (
                                <button 
                                    key={turn.id} 
                                    onClick={() => {
                                        const el = document.getElementById(`turn-${turn.turnNumber}`);
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="w-full text-left p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:border-[var(--accent-color)] transition-colors group"
                                >
                                    <div className="flex justify-between">
                                        <span className="text-xs font-bold text-slate-500">Turn {turn.turnNumber}</span>
                                        <span className="text-[10px] text-slate-400 group-hover:text-[var(--accent-color)]">Jump &rarr;</span>
                                    </div>
                                    <div className="text-sm text-slate-800 dark:text-slate-300 line-clamp-2 mt-1">
                                        {cleanContent(turn.content).replace(/:::/g, '').substring(0, 60)}...
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default MultiplayerGameScreen;