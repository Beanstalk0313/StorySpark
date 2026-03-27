export enum AppScreen {
  Home = 'HOME',
  Form = 'FORM',
  Research = 'RESEARCH',
  Writing = 'WRITING',
  Import = 'IMPORT',
  AdventureSetup = 'ADVENTURE_SETUP',
  Settings = 'SETTINGS',
  FileEditor = 'FILE_EDITOR',
  Extension = 'EXTENSION',
  Account = 'ACCOUNT',
  GeminiGuide = 'GEMINI_GUIDE',
  // New RPG Screens
  AIRPGHome = 'AIRPG_HOME',
  AIRPGSetup = 'AIRPG_SETUP',
  Lobby = 'LOBBY',
  MultiplayerGame = 'MULTIPLAYER_GAME',
  PerchanceStory = 'PERCHANCE_STORY',
  PerchanceChat = 'PERCHANCE_CHAT',
  PerchanceRPG = 'PERCHANCE_RPG'
}

export enum BookType {
  Original = 'ORIGINAL',
  Continuation = 'CONTINUATION',
  Adventure = 'ADVENTURE',
  MultiplayerHost = 'MULTIPLAYER_HOST', // Reference to a hosted room
}

export enum BookLength {
  Small = 'SMALL',     // 5-10 chapters
  Medium = 'MEDIUM',   // 10-30 chapters
  Long = 'LONG',       // 30-100 chapters
  Infinite = 'INFINITE', // Unlimited
}

export enum ChapterLength {
    Short = 'SHORT',
    Medium = 'MEDIUM',
    Long = 'LONG',
    ExtraLong = 'EXTRA_LONG'
}

export enum AIProvider {
  Gemini = 'GEMINI',
  Puter = 'PUTER',
  OpenRouter = 'OPENROUTER',
  Anthropic = 'ANTHROPIC',
  OpenAI = 'OPENAI',
  DeepSeek = 'DEEPSEEK',
  Groq = 'GROQ',
  Cerebras = 'CEREBRAS',
  Grok = 'GROK',
  Mistral = 'MISTRAL',
  Custom = 'CUSTOM',
}

export enum CerebrasModel {
  ZaiGlm47 = 'zai-glm-4.7',
  GptOss120b = 'gpt-oss-120b',
  Llama31_8b = 'llama3.1-8b',
  Qwen3_235b = 'qwen-3-235b-a22b-instruct-2507',
}

export enum PuterImageModel {
  GeminiImage = 'gemini-2.5-flash-image-preview',
  GptImage = 'gpt-image-1',
}

export enum PuterModel {
  Gemini3Pro = 'google/gemini-3-pro-preview',
  Gpt4o = 'openai/gpt-4o',
  Gpt5 = 'openai/gpt-5',
  Gpt5Nano = 'openai/gpt-5-nano',
  Gemini3Flash = 'google/gemini-3-flash-preview',
  Gemini25Pro = 'google/gemini-2.5-pro',
  Gemini25Flash = 'google/gemini-2.5-flash',
  Gemini25FlashLite = 'google/gemini-2.5-flash-lite',
  Gemini20Flash = 'google/gemini-2.0-flash',
  Gemini20FlashLite = 'google/gemini-2.0-flash-lite',
}

export enum GeminiModel {
  Gemini31 = 'gemini-3.1',
  Gemini3Pro = 'gemini-3-pro-preview',
  Gemini25Pro = 'gemini-2.5-pro',
  Gemini3Flash = 'gemini-3-flash-preview',
  Gemini25Flash = 'gemini-2.5-flash',
  Gemini25FlashLite = 'gemini-flash-lite-latest',
  Gemini31FlashLite = 'gemini-3.1-flash-lite',
  Gemma3_1b = 'gemma-3-1b-it',
  Gemma3_4b = 'gemma-3-4b-it',
  Gemma3_12b = 'gemma-3-12b-it',
  Gemma3_27b = 'gemma-3-27b-it',
}

export enum ChapterImportance {
  High = 'HIGH',   // Critical plot points, character deaths, major revelations
  Medium = 'MEDIUM', // Character development, travel, setup
  Low = 'LOW',     // Filler, transition, minor dialogue
}

export interface Chapter {
  id: string;
  content: string;
  summary?: string; 
  importance?: ChapterImportance; 
  imageUrl?: string; 
  imagePrompt?: string; 
  prompt?: string;
  index?: number; 
  createdAt?: any; 
  userId?: string; 
}

export interface Persona {
    id?: string; 
    name: string;
    age: string;
    gender: string;
    appearance?: string;
    description?: string;
    activeTraits?: string[];
    unlockedMemories?: string[];
}

export interface Milestone {
    chapterIndex: number;
    description: string;
}

export interface GameState {
    hp: number;
    maxHp: number;
    location: string;
    inventory: string[];
    gold: number;
}

export interface ResearchTopic {
    id: string;
    title: string; 
    sections: ResearchSection[];
}

export interface ResearchSection {
    id: string;
    title: string;
    items: ResearchItem[];
}

export interface ResearchItem {
    id: string;
    content: string;
}

export interface OriginalBookRequest {
  type: BookType.Original;
  plot: string;
  bookLength: BookLength;
  chapterLength: ChapterLength;
  genre?: string;
  crossovers?: string[];
  stylePreset?: string;
  customAuthor?: string;
}

export interface ContinuationBookRequest {
  type: BookType.Continuation;
  series: string;
  plot: string;
  bookLength: BookLength;
  chapterLength: ChapterLength;
  crossovers?: string[];
  stylePreset?: string;
  customAuthor?: string; // Original creator/author name
  fanFicContext?: string; // e.g. "Prequel", "During Book 3", "Alternate Universe"
  mediaType?: string; // e.g. "Novel", "TV Show", "Video Game"
}

export interface AdventureBookRequest {
    type: BookType.Adventure;
    storyType: 'ORIGINAL' | 'CONTINUATION';
    series?: string; 
    genre?: string; 
    plot: string;
    persona: Persona;
    bookLength: BookLength;
    chapterLength: ChapterLength;
    crossovers?: string[];
    stylePreset?: string;
    customAuthor?: string;
}

export interface MultiplayerHostBookRequest {
    type: BookType.MultiplayerHost;
    plot: string;
    bookLength: BookLength;
    chapterLength: ChapterLength;
    crossovers?: string[];
    stylePreset?: string;
    customAuthor?: string;
}

export type BookRequest = OriginalBookRequest | ContinuationBookRequest | AdventureBookRequest | MultiplayerHostBookRequest;

export interface Book {
  id: string; 
  title?: string; 
  request: BookRequest;
  chapters: Chapter[];
  chapterCount?: number; 
  promptHistory?: string[]; 
  researchSummary?: string; 
  userNotes?: string;
  longTermGoals?: string;
  gameState?: GameState; 
  userId?: string; 
  createdAt?: any; 
  updatedAt?: any; 
  isFinished?: boolean; 
  milestones?: Milestone[];
  parentBookId?: string;
  branchPoint?: number;
  isPublic?: boolean; // New for sharing
  roomId?: string; // Link to multiplayer room
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// --- MULTIPLAYER TYPES ---

export interface MultiplayerPlayer {
  uid: string;
  displayName: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
  persona?: Persona;
  currentAction?: string; // The action they want to take this turn
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface RoomState {
  roomId: string;
  hostUid: string;
  status: 'LOBBY' | 'PLAYING' | 'PAUSED';
  settings: {
    genre?: string;
    plotPremise: string;
    chapterLength: ChapterLength;
    storyType: 'ORIGINAL' | 'CONTINUATION';
    series?: string;
    crossovers?: string[];
    researchSummary?: string;
    customAuthor?: string;
  };
  narrativeHistory: {
    id: string;
    content: string;
    turnNumber: number;
  }[];
  currentTurnText?: string; // For streaming
  turnIndex: number;
  isGenerating: boolean;
}