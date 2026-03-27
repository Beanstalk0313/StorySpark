import { ref, set, get, update, push, onValue, onDisconnect, remove, child, serverTimestamp } from "firebase/database";
import { rtdb } from "./firebase";
import { MultiplayerPlayer, RoomState, ChatMessage, Persona, ChapterLength } from "../types";

// --- ROOM MANAGEMENT ---

export const createRoom = async (host: { uid: string, displayName: string }, initialSettings: RoomState['settings']): Promise<string> => {
    const roomId = generateRoomCode();
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    
    // Check collision (unlikely but good practice)
    const snapshot = await get(roomRef);
    if (snapshot.exists()) return createRoom(host, initialSettings);

    const hostPlayer: MultiplayerPlayer = {
        uid: host.uid,
        displayName: host.displayName,
        isHost: true,
        isReady: false,
        joinedAt: Date.now()
    };

    const initialState: RoomState = {
        roomId,
        hostUid: host.uid,
        status: 'LOBBY',
        settings: initialSettings,
        narrativeHistory: [],
        turnIndex: 0,
        isGenerating: false
    };

    await set(roomRef, {
        state: initialState,
        players: {
            [host.uid]: hostPlayer
        },
        chat: {}
    });

    // Handle disconnect cleanup
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${host.uid}`);
    onDisconnect(playerRef).remove();

    return roomId;
};

export const joinRoom = async (roomId: string, user: { uid: string, displayName: string }): Promise<boolean> => {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) return false;

    const data = snapshot.val();
    const players = data.players || {};
    const playerArray = Object.values(players);
    
    // Auto-promote to host if room is empty (reclaiming abandoned room)
    const isFirstPlayer = playerArray.length === 0;
    
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${user.uid}`);
    
    const newPlayer: MultiplayerPlayer = {
        uid: user.uid,
        displayName: user.displayName,
        isHost: isFirstPlayer, // Promoted if empty
        isReady: false,
        joinedAt: Date.now()
    };

    await set(playerRef, newPlayer);
    
    // If promoted, ensure state reflects new host
    if (isFirstPlayer) {
        await update(ref(rtdb, `rooms/${roomId}/state`), { hostUid: user.uid });
    }

    onDisconnect(playerRef).remove();
    return true;
};

export const leaveRoom = async (roomId: string, uid: string) => {
    const playerRef = ref(rtdb, `rooms/${roomId}/players/${uid}`);
    await remove(playerRef);
};

export const deleteRoom = async (roomId: string) => {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    await remove(roomRef);
};

export const subscribeToRoom = (roomId: string, onUpdate: (data: any) => void) => {
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    return onValue(roomRef, (snapshot) => {
        const data = snapshot.val();
        if (data) onUpdate(data);
        else onUpdate(null); // Room deleted
    });
};

// --- GAMEPLAY ACTIONS ---

export const setPlayerPersona = async (roomId: string, uid: string, persona: Persona) => {
    const refPath = ref(rtdb, `rooms/${roomId}/players/${uid}/persona`);
    await set(refPath, persona);
};

export const setPlayerReady = async (roomId: string, uid: string, isReady: boolean) => {
    const refPath = ref(rtdb, `rooms/${roomId}/players/${uid}/isReady`);
    await set(refPath, isReady);
};

export const setPlayerAction = async (roomId: string, uid: string, action: string) => {
    const refPath = ref(rtdb, `rooms/${roomId}/players/${uid}/currentAction`);
    await set(refPath, action);
};

export const clearAllActions = async (roomId: string, uids: string[]) => {
    const updates: any = {};
    uids.forEach(uid => {
        updates[`rooms/${roomId}/players/${uid}/currentAction`] = null;
        updates[`rooms/${roomId}/players/${uid}/isReady`] = false; // Reset ready status for next turn
    });
    await update(ref(rtdb), updates);
};

export const startGame = async (roomId: string) => {
    const refPath = ref(rtdb, `rooms/${roomId}/state/status`);
    await set(refPath, 'PLAYING');
};

export const updateHost = async (roomId: string, newHostUid: string) => {
    // 1. Update Room State Host
    await update(ref(rtdb, `rooms/${roomId}/state`), { hostUid: newHostUid });
    
    // 2. Client-side logic in App/GameScreen handles the 'isHost' flag derivation
    // but we should also update the specific player record if we were strict, 
    // though the 'joinRoom' logic sets initial isHost.
    // Ideally, we iterate players and set isHost=true for one and false for others,
    // but the single source of truth is state.hostUid.
};

export const appendNarrative = async (roomId: string, content: string, turnIndex: number) => {
    const newSegment = {
        id: `turn-${Date.now()}`,
        content,
        turnNumber: turnIndex
    };
    
    const updates: any = {};
    updates[`rooms/${roomId}/state/isGenerating`] = false;
    updates[`rooms/${roomId}/state/currentTurnText`] = null; 
    updates[`rooms/${roomId}/state/turnIndex`] = turnIndex + 1;
    
    const historyRef = ref(rtdb, `rooms/${roomId}/state/narrativeHistory`);
    const newRef = push(historyRef);
    await set(newRef, newSegment);
    
    await update(ref(rtdb), updates);
};

export const updateNarrativeTurn = async (roomId: string, turnId: string, newContent: string) => {
    // We need to find the key for this turnId. 
    // Since we don't have the key directly, we query or assume the caller passed the key (if using push keys).
    // However, if turnId is the 'id' field, we need to search.
    // Optimization: The client usually has the snapshot key if we map it. 
    // For now, we'll fetch history, find index, and update.
    
    const historyRef = ref(rtdb, `rooms/${roomId}/state/narrativeHistory`);
    const snapshot = await get(historyRef);
    if (snapshot.exists()) {
        const data = snapshot.val();
        const key = Object.keys(data).find(k => data[k].id === turnId);
        if (key) {
            await update(child(historyRef, key), { content: newContent });
        }
    }
};

export const streamNarrative = async (roomId: string, textChunk: string) => {
     const refPath = ref(rtdb, `rooms/${roomId}/state/currentTurnText`);
     await set(refPath, textChunk);
};

export const setGeneratingStatus = async (roomId: string, isGenerating: boolean) => {
    const refPath = ref(rtdb, `rooms/${roomId}/state/isGenerating`);
    await set(refPath, isGenerating);
};

// --- CHAT ---

export const sendChatMessage = async (roomId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const chatRef = ref(rtdb, `rooms/${roomId}/chat`);
    const newMsgRef = push(chatRef);
    await set(newMsgRef, {
        ...message,
        timestamp: serverTimestamp()
    });
};

// --- UTILS ---

const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};