import React, { useState, useEffect } from 'react';
import { MultiplayerPlayer, RoomState, Persona, ChapterLength } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { GENRES } from '../../constants';
import { setPlayerPersona, setPlayerReady, startGame, leaveRoom } from '../../services/rtdbService';
import { getPersonas, savePersona, deletePersona } from '../../services/localStorageService';
import { importPersona } from '../../services/fileService';
import Modal from '../ui/Modal';

interface LobbyScreenProps {
    roomId: string;
    currentUserUid: string;
    roomState: RoomState;
    players: Record<string, MultiplayerPlayer>;
    onBack: () => void;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({ roomId, currentUserUid, roomState, players, onBack }) => {
    const [savedPersonas, setSavedPersonas] = useState<Persona[]>([]);
    const [isCreatingPersona, setIsCreatingPersona] = useState(false);
    const [showLore, setShowLore] = useState(false);
    
    // Draft Persona State
    const [draftName, setDraftName] = useState('');
    const [draftAge, setDraftAge] = useState('');
    const [draftGender, setDraftGender] = useState('');
    const [draftAppearance, setDraftAppearance] = useState('');
    const [draftDesc, setDraftDesc] = useState('');

    const currentPlayer = players[currentUserUid];
    const isHost = currentPlayer?.isHost;
    const playerList = Object.values(players) as MultiplayerPlayer[];

    useEffect(() => {
        setSavedPersonas(getPersonas());
    }, []);

    const refreshPersonas = () => setSavedPersonas(getPersonas());

    const handleSelectPersona = (p: Persona) => {
        setPlayerPersona(roomId, currentUserUid, p);
        setIsCreatingPersona(false);
    };

    const handleSaveAndSelect = () => {
        if (!draftName || !draftDesc) return alert("Name and description required");
        const newP: Persona = {
            id: `persona-${Date.now()}`,
            name: draftName,
            age: draftAge || 'Unknown',
            gender: draftGender || 'Unknown',
            appearance: draftAppearance,
            description: draftDesc,
            activeTraits: [],
            unlockedMemories: []
        };
        savePersona(newP);
        refreshPersonas();
        handleSelectPersona(newP);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.sspf';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if(file) {
                try {
                    const p = await importPersona(file);
                    savePersona({ ...p, id: undefined }); // Save as new
                    refreshPersonas();
                } catch(err) {
                    alert('Invalid character file.');
                }
            }
        };
        input.click();
    };

    const handleDeleteLocal = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Delete this persona from your local storage?")) {
            deletePersona(id);
            refreshPersonas();
        }
    };

    const toggleReady = () => {
        if (!currentPlayer.persona) return alert("Select a character first!");
        setPlayerReady(roomId, currentUserUid, !currentPlayer.isReady);
    };

    const handleStartGame = () => {
        if (!isHost) return;
        const unready = playerList.some(p => !p.isReady);
        if (unready) {
            if (!confirm("Some players are not ready. Start anyway?")) return;
        }
        startGame(roomId);
    };

    const copyLink = () => {
        const url = `${window.location.origin}/airpg?code=${roomId}`;
        navigator.clipboard.writeText(url);
        alert("Lobby link copied!");
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in min-h-screen flex flex-col">
            {showLore && (
                <Modal isOpen={true} title="World Lore" onClose={() => setShowLore(false)} confirmText="Close" onConfirm={() => setShowLore(false)}>
                    <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {roomState.settings.researchSummary || "No lore data generated."}
                    </div>
                </Modal>
            )}

            <header className="flex justify-between items-center mb-8 bg-white/50 dark:bg-black/40 p-6 rounded-2xl backdrop-blur-md border border-white/20">
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Lobby Code</div>
                    <div className="text-4xl font-mono font-bold text-[var(--accent-color)] tracking-wider flex items-center gap-4">
                        {roomId}
                        <button onClick={copyLink} className="text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full hover:bg-white hover:shadow-md transition-all">
                            Copy Link
                        </button>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => { leaveRoom(roomId, currentUserUid); onBack(); }} className="text-red-500">
                    Leave
                </Button>
            </header>

            <div className="grid lg:grid-cols-3 gap-8 flex-1">
                {/* LEFT: Game Settings & Host Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Campaign Info</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Setting</label>
                                <div className="text-lg font-medium dark:text-white">
                                    {roomState.settings.storyType === 'CONTINUATION' ? roomState.settings.series : (roomState.settings.genre || 'Original')}
                                </div>
                            </div>
                            {roomState.settings.crossovers && roomState.settings.crossovers.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Crossovers</label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {roomState.settings.crossovers.map(c => <span key={c} className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">{c}</span>)}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Premise</label>
                                <div className="text-sm text-slate-700 dark:text-slate-300 italic p-3 bg-black/5 dark:bg-black/30 rounded-lg max-h-40 overflow-y-auto">
                                    "{roomState.settings.plotPremise}"
                                </div>
                            </div>
                            
                            {roomState.settings.researchSummary && (
                                <Button variant="secondary" onClick={() => setShowLore(true)} className="w-full text-xs">View World Lore</Button>
                            )}

                            {isHost && (
                                <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                    <p className="text-xs text-slate-500 mb-2 text-center">Waiting for players...</p>
                                    <Button onClick={handleStartGame} className="w-full py-4 text-lg shadow-xl shadow-[var(--accent-color)]/20">
                                        Start Adventure 🚀
                                    </Button>
                                </div>
                            )}
                            {!isHost && (
                                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-center font-bold text-sm animate-pulse">
                                    Waiting for Host to start...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Player List */}
                <div className="lg:col-span-1">
                     <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 h-full flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex justify-between items-center">
                            Party Members <span className="text-sm bg-black/10 dark:bg-white/10 px-2 py-1 rounded-full">{playerList.length}</span>
                        </h3>
                        <div className="space-y-3 flex-1 overflow-y-auto">
                            {playerList.map(p => (
                                <div key={p.uid} className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${p.isReady ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-black/20 border-transparent'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${p.isReady ? 'bg-green-500' : 'bg-slate-400'}`}>
                                        {p.displayName[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {p.displayName}
                                            {p.isHost && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded uppercase">Host</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {p.persona ? p.persona.name : 'Choosing character...'}
                                        </div>
                                    </div>
                                    {p.isReady && <div className="text-green-500">✓</div>}
                                </div>
                            ))}
                        </div>
                     </div>
                </div>

                {/* RIGHT: Character Selection */}
                <div className="lg:col-span-1">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 h-full flex flex-col">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Your Persona</h3>
                        
                        {currentPlayer?.persona ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-24 h-24 bg-[var(--accent-color)] rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                                    {currentPlayer.persona.name[0]}
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold dark:text-white">{currentPlayer.persona.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 max-w-xs mx-auto mt-2">{currentPlayer.persona.description}</p>
                                </div>
                                <div className="flex gap-2 w-full pt-4">
                                    <Button variant="secondary" onClick={() => handleSelectPersona(null as any)} className="flex-1">Change</Button>
                                    <Button onClick={toggleReady} className={`flex-1 ${currentPlayer.isReady ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
                                        {currentPlayer.isReady ? 'Not Ready' : 'I\'m Ready'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                {!isCreatingPersona ? (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Saved Heroes</span>
                                            <button onClick={handleImport} className="text-xs text-[var(--accent-color)] hover:underline">Import (.sspf)</button>
                                        </div>
                                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar flex-1">
                                            {savedPersonas.map(p => (
                                                <div key={p.id} onClick={() => handleSelectPersona(p)} className="cursor-pointer p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all flex justify-between group">
                                                    <div className="overflow-hidden">
                                                        <div className="font-bold text-sm dark:text-white truncate">{p.name}</div>
                                                        <div className="text-[10px] text-slate-500 truncate">{p.description}</div>
                                                    </div>
                                                    <button onClick={(e) => handleDeleteLocal(e, p.id!)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 rounded transition-all">&times;</button>
                                                </div>
                                            ))}
                                            {savedPersonas.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">No saved characters found.</p>}
                                        </div>
                                        <Button onClick={() => setIsCreatingPersona(true)} className="w-full mt-auto">+ Create New Character</Button>
                                    </>
                                ) : (
                                    <div className="space-y-3 animate-fade-in flex-1 flex flex-col">
                                        <Input label="Name" id="p-name" value={draftName} onChange={e => setDraftName(e.target.value)} required />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Age" id="p-age" value={draftAge} onChange={e => setDraftAge(e.target.value)} />
                                            <Select label="Gender" id="p-gender" value={draftGender} onChange={e => setDraftGender(e.target.value)}>
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </Select>
                                        </div>
                                        <Input label="Appearance" id="p-app" value={draftAppearance} onChange={e => setDraftAppearance(e.target.value)} />
                                        <Textarea label="Description / Skills" id="p-desc" value={draftDesc} onChange={e => setDraftDesc(e.target.value)} rows={3} className="flex-1" />
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="secondary" onClick={() => setIsCreatingPersona(false)} className="flex-1">Cancel</Button>
                                            <Button onClick={handleSaveAndSelect} className="flex-1">Create & Select</Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LobbyScreen;