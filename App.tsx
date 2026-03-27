import React, { useState, useCallback, useEffect } from 'react';
import { AppScreen, BookType, BookRequest, Book, Chapter, AIProvider, User, PuterImageModel, PuterModel, RoomState, MultiplayerPlayer, ChatMessage, ChapterLength, BookLength, GeminiModel } from './types';
import HomeScreen from './components/HomeScreen';
import AuthScreen from './components/AuthScreen';
import OriginalBookForm from './components/OriginalBookForm';
import ContinuationBookForm from './components/ContinuationBookForm';
import ImportBookForm from './components/ImportBookForm';
import AdventureSetup from './components/AdventureSetup';
import WritingScreen from './components/WritingScreen';
import ResearchScreen from './components/ResearchScreen';
import SettingsScreen from './components/SettingsScreen';
import FileEditor from './components/FileEditor';
import AccountScreen from './components/AccountScreen';
import ChangelogModal from './components/ChangelogModal';
import LandingPage from './components/LandingPage';
import AppFooter from './components/AppFooter';
import ExtensionGuide from './components/ExtensionGuide';
import DesktopTitleBar from './components/ui/DesktopTitleBar';
import GeminiGuide from './components/GeminiGuide';
import AIRPGHomeScreen from './components/airpg/AIRPGHomeScreen';
import HostSetupScreen from './components/airpg/HostSetupScreen'; 
import LobbyScreen from './components/airpg/LobbyScreen';
import MultiplayerGameScreen from './components/airpg/MultiplayerGameScreen';
import { PrivacyPolicy, Disclaimer } from './components/InfoPages';
import Spinner from './components/ui/Spinner';
import Button from './components/ui/Button';
import Modal from './components/ui/Modal';
import { isElectron, togglePerchanceView, onMenuImport, onTriggerImportMenu, onPerchanceSync, getStoreValue, setStoreValue, loadPerchanceData } from './services/electronService';
import { signOut, subscribeToAuth } from './services/authService';
import { getBooksForUser, createBook, deleteBook as deleteBookFromDb, updateBookMetadata, saveChapterToDb, addChapterToDb, getFullBook, deleteChapterFromDb, savePerchanceSyncData, getPerchanceSyncData } from './services/firestoreService';
import { getGuestBooks, createGuestBook, updateGuestBook, deleteGuestBook, clearGuestBooks, saveGuestChapter, deleteGuestChapter } from './services/localStorageService';
import { useModal } from './contexts/ModalContext';
import { useTheme } from './contexts/ThemeContext';
import { generateResearchSummaryStream as aiResearch } from './services/aiService';
import { createRoom, joinRoom, subscribeToRoom, updateHost, leaveRoom, deleteRoom } from './services/rtdbService';
import { APP_VERSION } from './constants';

const BackgroundEffects = () => {
    const { isLiteMode } = useTheme();
    if (isLiteMode) return null;
    return (
        <div className="ambient-light">
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
        </div>
    );
};

export const App: React.FC = () => {
  const { isLiteMode, setIsLiteMode } = useTheme();
  const [showPerfPrompt, setShowPerfPrompt] = useState(false);

  const [currentPath, setCurrentPath] = useState(() => {
      if (isElectron()) return '/create';
      const p = window.location.pathname;
      if (p === '/index.html' || p === '') return '/';
      if (p.startsWith('/airpg')) return '/airpg';
      if (p.endsWith('/') && p.length > 1) return p.slice(0, -1);
      return p;
  });

  const [appScreen, setAppScreen] = useState<AppScreen>(() => {
      if (isElectron()) return AppScreen.Home;
      const p = window.location.pathname;
      if (p === '/editor') return AppScreen.FileEditor;
      if (p.startsWith('/airpg')) return AppScreen.AIRPGHome;
      return AppScreen.Home;
  });

  const [showPerchanceWIP, setShowPerchanceWIP] = useState(false);
  const [perchanceSkipWIP, setPerchanceSkipWIP] = useState(false);
  const [perchanceMode, setPerchanceMode] = useState<'STORY' | 'CHAT_BASIC' | 'CHAT_ADVANCED' | 'RPG' | null>(null);
  const [showChatTypeDialog, setShowChatTypeDialog] = useState(false);
  const [pendingBookImport, setPendingBookImport] = useState<any>(null);

  const [bookType, setBookType] = useState<BookType | null>(null);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const [isGuestMode, setIsGuestMode] = useState(() => {
      return localStorage.getItem('storyspark-guest-mode') === 'true';
  });

  const [books, setBooks] = useState<Book[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isContentHidden, setIsContentHidden] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);

  // Multiplayer State
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<Record<string, MultiplayerPlayer>>({});
  const [roomChat, setRoomChat] = useState<Record<string, ChatMessage>>({});
  
  // Pending Host Settings (stored between Setup and Research screen)
  const [pendingHostSettings, setPendingHostSettings] = useState<RoomState['settings'] | null>(null);

  const { showModal } = useModal();

  const [developerMode, setDeveloperMode] = useState<boolean>(() => {
      return localStorage.getItem('storyspark-dev-mode') === 'true';
  });

  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
      const saved = localStorage.getItem('storyspark-ai-provider');
      return (saved as AIProvider) || AIProvider.Puter;
  });
  
  const [puterImageModel, setPuterImageModel] = useState<PuterImageModel>(() => {
      const saved = localStorage.getItem('storyspark-puter-image-model');
      return (saved as PuterImageModel) || PuterImageModel.GptImage;
  });

  const [puterModel, setPuterModel] = useState<PuterModel>(() => {
      const saved = localStorage.getItem('storyspark-puter-model');
      return (saved as PuterModel) || PuterModel.Gemini3Pro;
  });

  const [geminiModel, setGeminiModel] = useState<GeminiModel>(() => {
      const saved = localStorage.getItem('storyspark-gemini-model');
      return (saved as GeminiModel) || GeminiModel.Gemini3Flash;
  });

  const [openRouterModel, setOpenRouterModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-openrouter-model') || 'google/gemini-2.0-flash-001';
  });

  const [anthropicModel, setAnthropicModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-anthropic-model') || 'claude-3-5-sonnet-latest';
  });

  const [openaiModel, setOpenaiModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-openai-model') || 'gpt-4o';
  });

  const [deepseekModel, setDeepseekModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-deepseek-model') || 'deepseek-chat';
  });

  const [groqModel, setGroqModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-groq-model') || 'llama3-70b-8192';
  });

  const [cerebrasModel, setCerebrasModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-cerebras-model') || 'llama3.1-8b';
  });

  const [grokModel, setGrokModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-grok-model') || 'grok-beta';
  });

  const [mistralModel, setMistralModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-mistral-model') || 'mistral-large-latest';
  });

  const [customAiModel, setCustomAiModel] = useState<string>(() => {
      return localStorage.getItem('storyspark-custom-ai-model') || '';
  });

  const [customAiEndpoint, setCustomAiEndpoint] = useState<string>(() => {
      return localStorage.getItem('storyspark-custom-ai-endpoint') || '';
  });

  const [isResearching, setIsResearching] = useState(false);
  const [researchRequest, setResearchRequest] = useState<BookRequest | null>(null);
  const [researchSummary, setResearchSummary] = useState('');

  // Multiplayer Research Context
  const [isHostResearching, setIsHostResearching] = useState(false);

  // Check for performance preference on login/guest
  const checkPerformancePreference = () => {
      const hasSetPref = localStorage.getItem('storyspark-perf-choice');
      if (!hasSetPref) {
          setShowPerfPrompt(true);
      }
  };

  const handlePerfChoice = (enableRich: boolean) => {
      localStorage.setItem('storyspark-perf-choice', 'true');
      if (enableRich) {
          setIsLiteMode(false);
      } else {
          setIsLiteMode(true);
      }
      setShowPerfPrompt(false);
  };

  const fetchBooks = useCallback(async (uid?: string, guest?: boolean) => {
    const targetUid = uid || user?.uid;
    const targetGuest = guest !== undefined ? guest : isGuestMode;
    setFetchError(null);

    if (targetGuest) {
        setBooks(getGuestBooks());
    } else if (targetUid) {
        try {
            const userBooks = await getBooksForUser(targetUid);
            setBooks(userBooks);
        } catch (error: any) {
            console.error("Failed to fetch user books:", error);
            if (error.code === 'permission-denied') {
                setFetchError("Permission Denied: Could not load books. Check Account Settings.");
            } else {
                setFetchError("Failed to sync books from cloud.");
            }
        }
    } else {
        setBooks([]);
    }
  }, [user?.uid, isGuestMode]);

  const loadSharedBook = useCallback(async (shareId: string) => {
      setIsLoadingBook(true);
      try {
          const shared = await getFullBook(shareId);
          if (shared) {
              setCurrentBook(shared);
              setIsReadOnly(shared.userId !== user?.uid);
              setAppScreen(AppScreen.Writing);
          } else {
              showModal({ title: "Shared Story Not Found", message: "This link may be expired or the story is no longer public.", confirmText: "Go Home" });
              handleGoHome();
          }
      } catch (e) {
          showModal({ title: "Access Error", message: "Could not load shared story. Check your connection or the story's public status.", confirmText: "OK" });
          handleGoHome();
      } finally {
          setIsLoadingBook(false);
      }
  }, [user?.uid, showModal]);

  // Handle URL params (Share or RPG Code)
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      const rpgCode = params.get('code');
      
      if (shareId && appScreen === AppScreen.Home) {
          loadSharedBook(shareId);
      }
      
      // Auto-join RPG logic
      if (rpgCode && !activeRoomId) {
          if (user || isGuestMode) {
              // Ready to join
              handleJoinGame(rpgCode);
          } else {
              setAppScreen(AppScreen.AIRPGHome);
          }
      } else if (rpgCode && activeRoomId) {
          // Already joined
          setAppScreen(AppScreen.Lobby);
      }

  }, [appScreen, loadSharedBook, user, isGuestMode]);

  const navigate = useCallback((path: string, screen?: AppScreen) => {
      try { window.history.pushState({}, '', path); } catch (e) {}
      setCurrentPath(path);
      window.scrollTo(0, 0);
      
      if (screen) {
          setAppScreen(screen);
          if (path === '/create') fetchBooks();
          return;
      }

      if (path === '/create') {
          setAppScreen(AppScreen.Home);
          fetchBooks();
      }
      if (path === '/editor') setAppScreen(AppScreen.FileEditor);
      if (path === '/airpg') setAppScreen(AppScreen.AIRPGHome);
  }, [fetchBooks]);

  const handleGoHome = useCallback(async () => {
    const isPerchanceScreen = [AppScreen.PerchanceStory, AppScreen.PerchanceChat, AppScreen.PerchanceRPG].includes(appScreen);
    
    if (isPerchanceScreen && isElectron()) {
        setIsSavingSync(true);
        try {
            const data = await getFullPerchanceData();
            if (data && user) {
                await savePerchanceSyncData(user.uid, data);
            }
        } catch (e) {
            console.error("Manual sync on exit failed:", e);
        } finally {
            setIsSavingSync(false);
        }
    }

    setAppScreen(AppScreen.Home); 
    setCurrentBook(null); 
    setIsDirty(false); 
    setResearchRequest(null);
    setIsReadOnly(false);
    setActiveRoomId(null);
    fetchBooks();
    navigate('/create');
  }, [navigate, fetchBooks, appScreen, user]);

  const enterPerchanceMode = async (mode: 'STORY' | 'CHAT_BASIC' | 'CHAT_ADVANCED' | 'RPG') => {
      let url = 'https://perchance.org/storyspark-ai-story';
      let screen = AppScreen.PerchanceStory;

      if (mode === 'CHAT_BASIC') {
          url = 'https://perchance.org/storyspark-ai-chat';
          screen = AppScreen.PerchanceChat;
      } else if (mode === 'CHAT_ADVANCED') {
          url = 'https://perchance.org/storyspark-character-chat';
          screen = AppScreen.PerchanceChat;
      } else if (mode === 'RPG') {
          url = 'https://perchance.org/storyspark-ai-rpg';
          screen = AppScreen.PerchanceRPG;
      }

      setAppScreen(screen);
      togglePerchanceView(true, url);

      // RESTORE SYNC: Pull from Firestore and inject
      if (user) {
          try {
              const syncData = await getPerchanceSyncData(user.uid);
              if (syncData && Object.keys(syncData).length > 0) {
                  // Wait a brief moment for view to init
                  setTimeout(() => {
                      loadPerchanceData(syncData);
                  }, 2000);
              }
          } catch (e) {
              console.error("Failed to restore Perchance sync:", e);
          }
      }
  };

  const handleGoToPerchance = async () => {
      const skipWIP = isElectron() ? (await getStoreValue('skip-perchance-wip') === true) : (localStorage.getItem('storyspark-skip-perchance-wip') === 'true');
      setPerchanceMode('STORY');
      if (skipWIP) {
          enterPerchanceMode('STORY');
      } else {
          setShowPerchanceWIP(true);
      }
  };

  const handleGoToChat = async () => {
      setShowChatTypeDialog(true);
  };

  const handleSelectChatType = async (type: 'BASIC' | 'ADVANCED') => {
      setShowChatTypeDialog(false);
      const skipWIP = isElectron() ? (await getStoreValue('skip-perchance-wip') === true) : (localStorage.getItem('storyspark-skip-perchance-wip') === 'true');
      const mode = type === 'BASIC' ? 'CHAT_BASIC' : 'CHAT_ADVANCED';
      setPerchanceMode(mode);
      
      if (skipWIP) {
          enterPerchanceMode(mode);
      } else {
          setShowPerchanceWIP(true);
      }
  };

  const handleGoToPerchanceRPG = async () => {
      const skipWIP = isElectron() ? (await getStoreValue('skip-perchance-wip') === true) : (localStorage.getItem('storyspark-skip-perchance-wip') === 'true');
      setPerchanceMode('RPG');
      if (skipWIP) {
          enterPerchanceMode('RPG');
      } else {
          setShowPerchanceWIP(true);
      }
  };

  const handleConfirmPerchanceWIP = async () => {
      if (perchanceSkipWIP) {
          if (isElectron()) await setStoreValue('skip-perchance-wip', true);
          else localStorage.setItem('storyspark-skip-perchance-wip', 'true');
      }
      setShowPerchanceWIP(false);
      if (perchanceMode) {
          enterPerchanceMode(perchanceMode);
      }
  };

  // Electron Listeners
  useEffect(() => {
      if (!isElectron()) return;

      const unsubscribeMenu = onMenuImport((data) => {
          if (data.type === 'BOOK') {
              setPendingBookImport(data);
              navigate('/create', AppScreen.Import);
          } else {
              sessionStorage.setItem('storyspark-last-import', JSON.stringify(data));
              navigate('/editor', AppScreen.FileEditor);
          }
      });

      const unsubscribeTrigger = onTriggerImportMenu(() => {
          navigate('/create', AppScreen.Import);
      });

      return () => {
          unsubscribeMenu();
          unsubscribeTrigger();
      };
  }, [user, navigate]);

  const handleLogout = useCallback(async () => {
    if (isGuestMode) {
      setIsGuestMode(false);
      localStorage.removeItem('storyspark-guest-mode');
      setUser(null);
      setBooks([]);
      return;
    }
    try {
      await signOut();
      handleGoHome();
    } catch (e) {
      showModal({ title: 'Error', message: 'Failed to sign out.', confirmText: 'OK' });
    }
  }, [isGuestMode, handleGoHome, showModal]);

  useEffect(() => {
      const onPopState = () => {
          let p = window.location.pathname;
          if (p.startsWith('/airpg')) p = '/airpg';
          setCurrentPath(p);
          if (p === '/create') {
              setAppScreen(AppScreen.Home);
              fetchBooks();
          } else if (p === '/airpg') {
              setAppScreen(AppScreen.AIRPGHome);
          }
      };
      window.addEventListener('popstate', onPopState);
      return () => window.removeEventListener('popstate', onPopState);
  }, [fetchBooks]);

  // ... (Other handlers like handleBranchStory definition for completeness) ... 
  
  const handleBranchStory = async (parentBook: Book, branchPointIndex: number) => {
      setIsLoadingBook(true);
      const branchChapters = parentBook.chapters.slice(0, branchPointIndex + 1);
      const newBookData: Omit<Book, 'id'> = {
          ...parentBook,
          title: `${parentBook.title || 'Untitled'} (Branch)`,
          chapters: branchChapters,
          chapterCount: branchChapters.length,
          parentBookId: parentBook.id,
          branchPoint: branchPointIndex,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: false
      };
      try {
          let createdBook: Book;
          if (isGuestMode) createdBook = createGuestBook(newBookData);
          else {
              if (!user) throw new Error("Must be logged in to branch cloud stories.");
              const bookId = await createBook(user.uid, newBookData);
              createdBook = { ...newBookData, id: bookId, userId: user.uid };
          }
          setBooks(prev => [createdBook, ...prev]);
          setCurrentBook(createdBook);
          setIsReadOnly(false);
          setAppScreen(AppScreen.Writing);
          setResearchRequest(null);
          showModal({ title: "Branch Created", message: "You are now writing in an alternate timeline.", confirmText: "Excellent" });
      } catch (e) {
          showModal({ title: "Error", message: "Failed to branch story. You might need to log in.", confirmText: "OK" });
      } finally { setIsLoadingBook(false); }
  };

  useEffect(() => {
      localStorage.setItem('storyspark-dev-mode', String(developerMode));
      if (!developerMode && aiProvider === AIProvider.Gemini) { 
          setAiProvider(AIProvider.Puter); 
          localStorage.setItem('storyspark-ai-provider', AIProvider.Puter);
      }
  }, [developerMode]); 

  useEffect(() => { localStorage.setItem('storyspark-ai-provider', aiProvider); }, [aiProvider]);
  useEffect(() => { localStorage.setItem('storyspark-puter-image-model', puterImageModel); }, [puterImageModel]);
  useEffect(() => { localStorage.setItem('storyspark-puter-model', puterModel); }, [puterModel]);
  useEffect(() => { localStorage.setItem('storyspark-gemini-model', geminiModel); }, [geminiModel]);
  useEffect(() => { localStorage.setItem('storyspark-openrouter-model', openRouterModel); }, [openRouterModel]);
  useEffect(() => { localStorage.setItem('storyspark-anthropic-model', anthropicModel); }, [anthropicModel]);
  useEffect(() => { localStorage.setItem('storyspark-openai-model', openaiModel); }, [openaiModel]);
  useEffect(() => { localStorage.setItem('storyspark-deepseek-model', deepseekModel); }, [deepseekModel]);
  useEffect((): void => { localStorage.setItem('storyspark-groq-model', groqModel); }, [groqModel]);
  useEffect((): void => { localStorage.setItem('storyspark-cerebras-model', cerebrasModel); }, [cerebrasModel]);
  useEffect((): void => { localStorage.setItem('storyspark-grok-model', grokModel); }, [grokModel]);
  useEffect(() => { localStorage.setItem('storyspark-mistral-model', mistralModel); }, [mistralModel]);
  useEffect(() => { localStorage.setItem('storyspark-custom-ai-model', customAiModel); }, [customAiModel]);
  useEffect(() => { localStorage.setItem('storyspark-custom-ai-endpoint', customAiEndpoint); }, [customAiEndpoint]);

  useEffect(() => {
      const lastSeen = localStorage.getItem('storyspark-last-seen-version');
      if (lastSeen !== APP_VERSION) setShowChangelog(true);
  }, []);

  const handleGuestLogin = useCallback(() => { 
      setIsGuestMode(true); 
      localStorage.setItem('storyspark-guest-mode', 'true');
      setUser(null); 
      setBooks(getGuestBooks()); 
      setAppScreen(AppScreen.Home);
      checkPerformancePreference();
  }, []);

  useEffect(() => {
      const isPerchanceScreen = [
          AppScreen.PerchanceStory, 
          AppScreen.PerchanceChat, 
          AppScreen.PerchanceRPG
      ].includes(appScreen);

      if (!isPerchanceScreen) {
          togglePerchanceView(false);
      }
  }, [appScreen]);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (firebaseUser: any) => {
      try {
        setIsAuthLoading(true);
        if (firebaseUser) {
          const appUser: User = { uid: firebaseUser.uid, displayName: firebaseUser.displayName, email: firebaseUser.email, photoURL: firebaseUser.photoURL };
          setUser(appUser);
          setIsGuestMode(false);
          localStorage.removeItem('storyspark-guest-mode');
          checkPerformancePreference();
          
          if (currentBook && currentBook.userId !== appUser.uid) {
              setIsReadOnly(true);
          } else if (currentBook) {
              setIsReadOnly(false);
          }

          try {
              const userBooks = await getBooksForUser(appUser.uid);
              setBooks(userBooks);
          } catch (error: any) {
              if (error.code === 'permission-denied') setFetchError("Permission Denied");
              setBooks([]);
          }
        } else {
          setUser(null);
          if (isGuestMode) {
              setBooks(getGuestBooks());
              setIsReadOnly(false);
              checkPerformancePreference();
          } else {
              setBooks([]);
              if (appScreen !== AppScreen.Writing) setCurrentBook(null);
              if (currentBook && currentBook.isPublic) setIsReadOnly(true);
              else if (appScreen === AppScreen.Writing) setAppScreen(AppScreen.Home);
          }
        }
      } catch (err) {
        console.error("Auth process error:", err);
      } finally {
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [currentBook, appScreen]); 

  const handleSelectType = useCallback((type: BookType) => {
    setBookType(type);
    if (type === BookType.Adventure) {
        setAppScreen(AppScreen.AIRPGHome);
        navigate('/airpg');
    } else {
        setAppScreen(AppScreen.Form);
    }
  }, [navigate]);
  
  const handleCreateBook = useCallback(async (request: BookRequest, initialChapters: Chapter[] = [], promptHistory: string[] = [], researchSummary?: string) => {
    if (!user && !isGuestMode) return;
    let title = undefined;
    if (initialChapters.length > 0) {
        const match = initialChapters[0].content.match(/^#\s(.*?)$/m);
        if (match) title = match[1];
    }
    if (!title && request.plot) title = request.plot.substring(0, 50);

    const newBookData: Omit<Book, 'id'> = { 
        request, chapters: initialChapters, promptHistory, researchSummary, title, chapterCount: initialChapters.length, milestones: [], isPublic: false
    };
    try {
        let createdBook: Book;
        if (isGuestMode) createdBook = createGuestBook(newBookData);
        else {
            const bookId = await createBook(user!.uid, newBookData);
            createdBook = { ...newBookData, id: bookId, userId: user!.uid };
        }
        setBooks(prev => [createdBook, ...prev]);
        setCurrentBook(createdBook);
        setIsReadOnly(false);
        setAppScreen(AppScreen.Writing);
        setResearchRequest(null);
    } catch (error) {
        showModal({ title: 'Error', message: 'Failed to create book.', confirmText: 'OK' });
    }
  }, [user, isGuestMode, showModal]);

  const handleStartResearchAI = useCallback(async (request: BookRequest) => {
    setIsResearching(true);
    setResearchSummary('');
    
    let seriesName = 'Original Story Context';
    if (request.type === BookType.Continuation) {
        seriesName = request.series;
    } else if (request.type === BookType.Adventure && request.storyType === 'CONTINUATION') {
        seriesName = request.series!;
    } else if (request.type === BookType.Original && request.genre) {
        seriesName = request.genre;
    }

    const stream = aiResearch(seriesName, request.plot, request.crossovers || []);
    for await (const chunk of stream) { setResearchSummary(prev => prev + chunk); }
    setIsResearching(false);
  }, []);

  const handlePrepareResearch = useCallback((request: BookRequest) => {
    setResearchRequest(request); setResearchSummary(''); setAppScreen(AppScreen.Research);
  }, []);

  const handleFinalizeAndStartWriting = useCallback((finalSummary: string) => {
    if (researchRequest) handleCreateBook(researchRequest, [], [], finalSummary);
  }, [researchRequest, handleCreateBook]);

  // --- MULTIPLAYER RESEARCH HANDLERS ---
  const handleHostPrepareResearch = (series: string, plot: string, crossovers: string[]) => {
      setPendingHostSettings({
          genre: 'Mixed',
          plotPremise: plot,
          chapterLength: ChapterLength.Medium,
          storyType: 'ORIGINAL', // Placeholder, updated in HostSetupScreen state usually
          series: series,
          crossovers: crossovers
      });
      setIsHostResearching(true);
      setResearchSummary(''); // Start blank, user can import or run AI manually
      setAppScreen(AppScreen.Research);
  };

  const handleHostRunResearch = async () => {
      if (!pendingHostSettings) return;
      setIsResearching(true);
      setResearchSummary('');
      
      const series = pendingHostSettings.series || pendingHostSettings.genre || 'Original';
      const stream = aiResearch(series, pendingHostSettings.plotPremise, pendingHostSettings.crossovers || []);
      for await (const chunk of stream) { setResearchSummary(prev => prev + chunk); }
      setIsResearching(false);
  };

  const handleHostFinalizeResearch = async (finalSummary: string) => {
      if (isHostResearching && pendingHostSettings) {
          const finalSettings = { ...pendingHostSettings, researchSummary: finalSummary };
          await handleCreateRoomAndJoin(finalSettings);
          setIsHostResearching(false);
          setPendingHostSettings(null);
      }
  };

  const handleSelectBook = useCallback(async (book: Book) => {
    if (book.request.type === BookType.MultiplayerHost && book.roomId) {
        // Resume Hosting
        handleJoinGame(book.roomId);
        return;
    }

    if (isGuestMode) { setCurrentBook(book); setIsReadOnly(false); setAppScreen(AppScreen.Writing); }
    else {
        setIsLoadingBook(true);
        try {
            const fullBook = await getFullBook(book.id);
            if (fullBook) { 
                setCurrentBook(fullBook); 
                setIsReadOnly(fullBook.userId !== user?.uid);
                setAppScreen(AppScreen.Writing); 
            }
        } catch (e) { showModal({ title: "Error", message: "Failed to load book.", confirmText: "OK"}); }
        finally { setIsLoadingBook(false); }
    }
  }, [isGuestMode, user?.uid, showModal]);

  const handleSaveChapter = useCallback(async (chapter: Chapter, isNew: boolean = false) => {
      if (!currentBook || isReadOnly) return;
      try {
          if (isGuestMode) saveGuestChapter(currentBook.id, chapter);
          else if (user) isNew ? await addChapterToDb(user.uid, currentBook.id, chapter) : await saveChapterToDb(user.uid, currentBook.id, chapter);
          setIsDirty(false);
      } catch (e) {}
  }, [currentBook, isGuestMode, user, isReadOnly]);

  const handleSaveMetadata = useCallback(async (bookToSave?: Book) => {
      const targetBook = bookToSave || currentBook;
      if (!targetBook || isReadOnly) return;
      try {
          if (isGuestMode) updateGuestBook(targetBook);
          else await updateBookMetadata(targetBook.id, targetBook);
          setIsDirty(false);
          setBooks(prevBooks => prevBooks.map(b => b.id === targetBook.id ? targetBook : b));
      } catch (e) {}
  }, [currentBook, isGuestMode, isReadOnly]);

  const handleConfirmDeleteBook = (id: string) => {
      const bookToDelete = books.find(b => b.id === id);
      const isMultiplayer = bookToDelete?.request.type === BookType.MultiplayerHost;

      showModal({
          title: isMultiplayer ? "Delete Campaign?" : "Delete Project?",
          message: isMultiplayer 
            ? "This will delete the room record from your library AND shut down the multiplayer room, deleting all chat and history from the server. This cannot be undone."
            : "Are you sure you want to permanently delete this story? This action cannot be undone.",
          confirmText: "Delete Forever",
          onConfirm: async () => {
              try {
                  if (isGuestMode) deleteGuestBook(id);
                  else {
                      await deleteBookFromDb(id);
                      if (isMultiplayer && bookToDelete?.roomId) {
                          await deleteRoom(bookToDelete.roomId);
                      }
                  }
                  setBooks(prev => prev.filter(b => b.id !== id));
              } catch (e) {
                  showModal({ title: "Error", message: "Failed to delete item.", confirmText: "OK" });
              }
          }
      });
  };

  // --- MULTIPLAYER HANDLERS ---
  
  const handleHostGameClick = () => {
      if (!user && !isGuestMode) return showModal({ title: "Log In Required", message: "You must be logged in to host a multiplayer room.", confirmText: "OK" });
      setAppScreen(AppScreen.AIRPGSetup);
  };

  const handleCreateRoomAndJoin = async (settings: RoomState['settings']) => {
      const u = user || { uid: 'guest-host', displayName: 'Guest Host' };
      try {
          const roomId = await createRoom({ uid: u.uid, displayName: u.displayName || 'Host' }, settings);
          
          // Persistence: Save to Firestore as a "book" so Host can find it later
          if (user) {
              const bookData: Omit<Book, 'id'> = {
                  title: `RPG: ${settings.plotPremise.substring(0, 30)}...`,
                  request: {
                      type: BookType.MultiplayerHost,
                      plot: settings.plotPremise,
                      bookLength: BookLength.Infinite,
                      chapterLength: settings.chapterLength
                  } as any,
                  chapters: [], // Content lives in RTDB
                  roomId: roomId,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
              };
              await createBook(user.uid, bookData);
              // Refresh books list
              fetchBooks();
          }

          setActiveRoomId(roomId);
          setAppScreen(AppScreen.Lobby);
      } catch (e) {
          showModal({ title: "Error", message: "Failed to create room.", confirmText: "OK" });
      }
  };

  const handleJoinGame = async (code: string) => {
      const u = user || { uid: `guest-${Date.now()}`, displayName: 'Guest Player' };
      try {
          // Attempt to join. Logic in joinRoom handles auto-host promotion if empty.
          const success = await joinRoom(code, { uid: u.uid, displayName: u.displayName || 'Guest' });
          if (success) {
              setActiveRoomId(code);
              setAppScreen(AppScreen.Lobby);
          } else {
              showModal({ title: "Error", message: "Room not found.", confirmText: "OK" });
          }
      } catch (e) {
          showModal({ title: "Error", message: "Failed to join.", confirmText: "OK" });
      }
  };

  // Multiplayer Listener
  useEffect(() => {
      if (!activeRoomId) return;

      const unsubscribe = subscribeToRoom(activeRoomId, (data) => {
          if (!data) {
              // Room deleted
              setActiveRoomId(null);
              setAppScreen(AppScreen.AIRPGHome);
              showModal({ title: "Disconnected", message: "The room was closed or deleted by the host.", confirmText: "OK" });
              return;
          }

          setRoomState(data.state);
          setRoomPlayers(data.players || {});
          setRoomChat(data.chat || {});

          // Move to game screen if started
          if (data.state.status === 'PLAYING' && appScreen === AppScreen.Lobby) {
              setAppScreen(AppScreen.MultiplayerGame);
          }
      });

      return () => unsubscribe();
  }, [activeRoomId, appScreen, user]);


  const renderAppContent = () => {
    if (isAuthLoading || isLoadingBook) return <div className="mt-20 flex flex-col items-center gap-4"><Spinner /><p className="text-slate-500">Loading Journey...</p></div>;
    
    // Auth Check for main app flow
    const isViewingShared = appScreen === AppScreen.Writing && currentBook && isReadOnly;
    const isPublicRoute = [AppScreen.AIRPGHome, AppScreen.AIRPGSetup, AppScreen.Lobby, AppScreen.MultiplayerGame].includes(appScreen);
    
    if (!user && !isGuestMode && !isViewingShared && !isPublicRoute) return <AuthScreen onGuestLogin={handleGuestLogin} />;
    
    switch (appScreen) {
        case AppScreen.Settings:
             return <SettingsScreen 
                onBack={() => setAppScreen(AppScreen.Home)}
                onOpenGeminiGuide={() => setAppScreen(AppScreen.GeminiGuide)}
                aiProvider={aiProvider} setAiProvider={setAiProvider}
                puterImageModel={puterImageModel} setPuterImageModel={setPuterImageModel}
                puterModel={puterModel} setPuterModel={setPuterModel}
                geminiModel={geminiModel} setGeminiModel={setGeminiModel}
                openRouterModel={openRouterModel} setOpenRouterModel={setOpenRouterModel}
                anthropicModel={anthropicModel} setAnthropicModel={setAnthropicModel}
                openaiModel={openaiModel} setOpenaiModel={setOpenaiModel}
                deepseekModel={deepseekModel} setDeepseekModel={setDeepseekModel}
                groqModel={groqModel} setGroqModel={setGroqModel}
                cerebrasModel={cerebrasModel} setCerebrasModel={setCerebrasModel}
                grokModel={grokModel} setGrokModel={setGrokModel}
                mistralModel={mistralModel} setMistralModel={setMistralModel}
                customAiModel={customAiModel} setCustomAiModel={setCustomAiModel}
                customAiEndpoint={customAiEndpoint} setCustomAiEndpoint={setCustomAiEndpoint}
                onOpenChangelog={() => setShowChangelog(true)} developerMode={developerMode} setDeveloperMode={setDeveloperMode}
            />;
        case AppScreen.Account: return user ? <AccountScreen user={user} onBack={handleGoHome} onLogout={handleLogout} /> : null;
        case AppScreen.FileEditor: return <FileEditor onBack={handleGoHome} aiProvider={aiProvider} />;
        case AppScreen.Writing: return currentBook ? <WritingScreen book={currentBook} setBook={setCurrentBook} onRestart={handleGoHome} isContentHidden={isContentHidden} isDirty={isDirty} setIsDirty={setIsDirty} aiProvider={aiProvider} puterImageModel={puterImageModel} onSaveChapter={handleSaveChapter} onSaveMetadata={handleSaveMetadata} isGuestMode={isGuestMode} onDeleteChapter={(id) => isGuestMode ? Promise.resolve(deleteGuestChapter(currentBook.id, id)) : deleteChapterFromDb(currentBook.id, id)} onBranchStory={handleBranchStory} isReadOnly={isReadOnly} /> : null;
        case AppScreen.Research: 
            if (isHostResearching) {
                return <ResearchScreen isResearching={isResearching} researchSummaryRaw={researchSummary} seriesList={[ pendingHostSettings?.series || pendingHostSettings?.genre || 'Context', ...(pendingHostSettings?.crossovers || []) ]} onRunAI={handleHostRunResearch} onSubmit={handleHostFinalizeResearch} onBack={() => { setIsHostResearching(false); setAppScreen(AppScreen.AIRPGSetup); }} />;
            }
            if (!researchRequest) return null; 
            return <ResearchScreen isResearching={isResearching} researchSummaryRaw={researchSummary} seriesList={[ researchRequest.type === BookType.Continuation ? researchRequest.series : (researchRequest.type === BookType.Adventure && researchRequest.storyType === 'CONTINUATION' ? researchRequest.series! : (researchRequest.type === BookType.Original ? (researchRequest.genre || 'Context') : 'Context')), ...(researchRequest.crossovers || []) ]} onRunAI={() => handleStartResearchAI(researchRequest)} onSubmit={handleFinalizeAndStartWriting} onBack={handleGoHome} />;
        case AppScreen.Import: 
            return <ImportBookForm 
                onSubmit={handleCreateBook} 
                onBack={handleGoHome} 
                pendingImport={pendingBookImport}
                onClearPendingImport={() => setPendingBookImport(null)}
            />;
        case AppScreen.AdventureSetup: return <AdventureSetup onSubmit={handleCreateBook} onPrepareResearch={handlePrepareResearch} onBack={handleGoHome} />;
        case AppScreen.Form: return bookType === BookType.Original ? <OriginalBookForm onSubmit={handleCreateBook} onPrepareResearch={handlePrepareResearch} onBack={handleGoHome} /> : <ContinuationBookForm onPrepareResearch={handlePrepareResearch} onBack={handleGoHome} />;
        case AppScreen.Extension: return <ExtensionGuide onBack={() => setAppScreen(AppScreen.Home)} />;
        case AppScreen.GeminiGuide: return <GeminiGuide onBack={() => setAppScreen(AppScreen.Settings)} />;
        
        // NEW RPG SCREENS
        case AppScreen.AIRPGHome:
            return <AIRPGHomeScreen 
                user={user || (isGuestMode ? { uid: 'guest', displayName: 'Guest', email: null, photoURL: null } : null)}
                onStartSolo={() => { setBookType(BookType.Adventure); setAppScreen(AppScreen.AdventureSetup); }}
                onCreateLobby={handleHostGameClick}
                onJoinLobby={handleJoinGame}
                onBack={() => navigate('/create')}
                onStartPerchanceRPG={handleGoToPerchanceRPG}
            />;
        case AppScreen.PerchanceStory:
        case AppScreen.PerchanceChat:
        case AppScreen.PerchanceRPG:
            return (
                <div className="flex flex-col items-center justify-center mt-20 text-center animate-fade-in px-4">
                    <div className="p-8 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-white/10 max-w-lg">
                        <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] px-1 rounded-full font-bold uppercase">WIP</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">
                            {appScreen === AppScreen.PerchanceStory ? 'Perchance AI Story' : appScreen === AppScreen.PerchanceChat ? 'Perchance AI Chat' : 'Perchance AI RPG'}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            The specialized generator is running in the layer below this interface. 
                            Use the top bar to navigate back home at any time.
                        </p>
                        <Button onClick={handleGoHome} variant="secondary">Exit Mode</Button>
                    </div>
                </div>
            );
        case AppScreen.AIRPGSetup:
            return <HostSetupScreen 
                onBack={() => setAppScreen(AppScreen.AIRPGHome)}
                onCreate={handleCreateRoomAndJoin}
                onPrepareResearch={handleHostPrepareResearch}
            />;
        case AppScreen.Lobby:
            if (!activeRoomId || !roomState) return <div className="mt-20 text-center"><Spinner /> Connecting to lobby...</div>;
            return <LobbyScreen 
                roomId={activeRoomId} 
                currentUserUid={user?.uid || 'guest'}
                roomState={roomState}
                players={roomPlayers}
                onBack={() => { setActiveRoomId(null); setAppScreen(AppScreen.AIRPGHome); }}
            />;
        case AppScreen.MultiplayerGame:
             if (!activeRoomId || !roomState) return <div className="mt-20 text-center"><Spinner /> Syncing timeline...</div>;
             return <MultiplayerGameScreen
                roomId={activeRoomId}
                currentUserUid={user?.uid || 'guest'}
                roomState={roomState}
                players={roomPlayers}
                chat={roomChat}
                onLeave={() => { leaveRoom(activeRoomId, user?.uid || 'guest'); setActiveRoomId(null); setAppScreen(AppScreen.AIRPGHome); }}
                aiProvider={aiProvider}
             />;

        default:
            return (
                <div>
                    {fetchError && (
                        <div className="max-w-6xl mx-auto mb-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center justify-between text-sm text-red-800 dark:text-red-200 animate-fade-in">
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {fetchError}
                            </span>
                            <Button onClick={() => setAppScreen(AppScreen.Account)} variant="secondary" className="!py-1 !text-xs">Fix in Account</Button>
                        </div>
                    )}
                    <HomeScreen 
                        user={isGuestMode ? { uid: 'guest', displayName: 'Guest Traveler', email: null, photoURL: null } : user!}
                        books={books} onSelectType={handleSelectType} onSelectBook={handleSelectBook}
                        onGoToImport={() => setAppScreen(AppScreen.Import)} isContentHidden={isContentHidden} onToggleHidden={setIsContentHidden}
                        onDeleteBook={handleConfirmDeleteBook} aiProvider={aiProvider} setAiProvider={setAiProvider}
                        onGoToFileEditor={() => { setAppScreen(AppScreen.FileEditor); navigate('/editor'); }}
                        onGoToPerchance={handleGoToPerchance}
                        onGoToChat={handleGoToChat}
                    />
                </div>
            );
    }
  };

  if (currentPath === '/' && !isElectron()) return <div className="min-h-screen font-inter"><LandingPage onLaunch={() => navigate('/create')} onViewExtension={() => navigate('/extension')} /><AppFooter onNavigate={navigate} /></div>;
  if (currentPath === '/privacy') return <PrivacyPolicy onBack={() => navigate('/')} />;
  if (currentPath === '/disclaimer') return <Disclaimer onBack={() => navigate('/')} />;
  if (currentPath === '/extension') return <ExtensionGuide onBack={() => navigate('/')} />;

  // Render Logic Wrapper for Header/Footer visibility
  const hideChrome = [AppScreen.Lobby, AppScreen.MultiplayerGame, AppScreen.AIRPGSetup, AppScreen.GeminiGuide].includes(appScreen);

  return (
    <div className={`min-h-screen font-inter text-slate-900 dark:text-white transition-colors duration-500 flex flex-col`}>
      <DesktopTitleBar />
      <BackgroundEffects />
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      
      {showPerchanceWIP && (
          <Modal 
            isOpen={true} 
            title="Perchance Mode (Disclaimer)" 
            onClose={() => setShowPerchanceWIP(false)} 
            confirmText="Accept & Open" 
            onConfirm={handleConfirmPerchanceWIP}
            cancelText="Not Now"
            onCancel={() => setShowPerchanceWIP(false)}
          >
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm flex gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p>Perchance is a third-party service. StorySpark is not responsible for its availability or reliability.</p>
                  </div>
                  
                  <div className="text-sm space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                      <p>
                          We have forked and customized these Perchance generators to provide a safer and better-integrated experience within StorySpark. However, the AI itself is not controlled by StorySpark.
                      </p>
                      <p>
                          While we have implemented safety guidelines, AI models can sometimes ignore instructions or output unexpected content. StorySpark is not responsible for any unwanted output.
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                          Treat this like a search engine: if you intentionally search for inappropriate content, you will likely find it.
                      </p>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-[var(--accent-color)]/30">
                      <input 
                        type="checkbox" 
                        checked={perchanceSkipWIP} 
                        onChange={(e) => setPerchanceSkipWIP(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Don't show this disclaimer again</span>
                  </label>
              </div>
          </Modal>
      )}

      {showChatTypeDialog && (
          <Modal 
            isOpen={true} 
            title="Select AI Chat Interface" 
            onClose={() => setShowChatTypeDialog(false)} 
            hideFooter
          >
              <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => handleSelectChatType('BASIC')}
                    className="flex flex-col items-start p-5 bg-white/50 dark:bg-white/5 hover:bg-[var(--accent-color)] hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 transition-all group"
                  >
                      <span className="text-lg font-bold mb-1">Basic AI Chat</span>
                      <span className="text-xs opacity-70 group-hover:opacity-100 text-left">Simple, direct conversation with a powerful AI.</span>
                  </button>
                  <button 
                    onClick={() => handleSelectChatType('ADVANCED')}
                    className="flex flex-col items-start p-5 bg-white/50 dark:bg-white/5 hover:bg-[var(--accent-color)] hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 transition-all group"
                  >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold">Character Chat</span>
                        <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full uppercase">Advanced</span>
                      </div>
                      <span className="text-xs opacity-70 group-hover:opacity-100 text-left">Roleplay with persistent characters and custom backgrounds.</span>
                  </button>
                  <Button variant="ghost" onClick={() => setShowChatTypeDialog(false)} className="mt-2">Cancel</Button>
              </div>
          </Modal>
      )}

      {isSavingSync && (
          <Modal 
            isOpen={true} 
            title="Saving Your Journey" 
            onClose={() => {}} 
            hideFooter
          >
              <div className="flex flex-col items-center py-8 gap-6">
                  <div className="relative">
                      <Spinner />
                      <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--accent-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                      </div>
                  </div>
                  <div className="text-center space-y-2">
                      <p className="font-bold text-lg">Synchronizing Data...</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we secure your stories to the cloud.</p>
                  </div>
              </div>
          </Modal>
      )}

      {showPerfPrompt && (
          <Modal 
            isOpen={true} 
            title="Enable Rich Visuals?" 
            onClose={() => handlePerfChoice(false)} 
            confirmText="Enable Effects (High Quality)" 
            onConfirm={() => handlePerfChoice(true)}
            cancelText="Keep Lite Mode (Faster)"
            onCancel={() => handlePerfChoice(false)}
          >
              <div className="space-y-3">
                  <p>We've enabled <strong>Lite Mode</strong> by default to ensure the fastest performance.</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                      If you are on a powerful device, you can enable rich visuals (blur effects, animations, liquid backgrounds). 
                      Keep Lite Mode if you are on an older phone or tablet to prevent crashes.
                  </p>
              </div>
          </Modal>
      )}

      {hideChrome ? (
          renderAppContent()
      ) : (
          <>
            {appScreen === AppScreen.Settings ? (renderAppContent()) : (
                <div className="container mx-auto px-4 py-4 md:py-8 max-w-[1800px] w-full flex-grow flex flex-col">
                    <header className="mb-6 md:mb-8 pb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/50 transition-colors">
                    <div className="cursor-pointer flex items-center gap-3 md:gap-4 group" onClick={handleGoHome}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 md:h-10 md:w-10 group-hover:opacity-90" aria-hidden="true">
                        <g transform="translate(1.2, 3.3) scale(0.9)"><path fill="#38BDF8" d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path fill="#38BDF8" d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></g>
                        <g transform="translate(7.2, 4.2) scale(0.4)"><polygon fill="#FBBF24" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></g>
                        </svg>
                        <h1 className="text-2xl md:text-4xl font-bold">StorySpark</h1>
                    </div>
                    <div className="flex-shrink-0 ml-auto flex items-center gap-4">
                        {!isAuthLoading && (user || isGuestMode || isReadOnly) && (
                            <div className="flex items-center gap-3 md:gap-4">
                                {(!isReadOnly || user) && <button onClick={() => { setAppScreen(AppScreen.FileEditor); navigate('/editor'); }} className="p-2 rounded-full bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10" title="File Laboratory"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></button>}
                                {(!isReadOnly || user) && <button onClick={() => setAppScreen(AppScreen.Settings)} className="p-2 rounded-full bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10" title="Settings"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 00-1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 00 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>}
                                {(!isReadOnly || user) && !isGuestMode && user && (
                                    <button onClick={() => setAppScreen(AppScreen.Account)} className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-color)] to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner overflow-hidden">
                                            {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : user.displayName?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block max-w-[100px] truncate">{user.displayName?.split(' ')[0]}</span>
                                    </button>
                                )}
                                {(!user && !isGuestMode) && (
                                    <Button variant="secondary" onClick={() => navigate('/create')} className="px-3 py-1.5 text-xs">Login to Edit</Button>
                                )}
                                {isGuestMode && (
                                    <Button variant="secondary" onClick={handleLogout} className="px-3 py-1.5 text-xs">Sign In</Button>
                                )}
                            </div>
                        )}
                    </div>
                    </header>
                    <main className="animate-fade-in w-full flex-grow">{renderAppContent()}</main>
                </div>
            )}
            {appScreen !== AppScreen.PerchanceStory && <AppFooter onNavigate={navigate} />}
          </>
      )}
    </div>
  );
};