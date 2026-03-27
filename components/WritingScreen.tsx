import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Book, Chapter, AIProvider, BookLength, ChapterImportance, PuterImageModel, BookType, AdventureBookRequest, Persona, OriginalBookRequest, ContinuationBookRequest, GameState, ChapterLength, Milestone } from '../types';
import { writeChapterStream as aiWriteChapterStream, regenerateChapterStream as aiRegenerateChapterStream, analyzeBookChapters as aiAnalyzeBookChapters, analyzeChapter as aiAnalyzeChapter, generateIllustration as aiGenerateIllustration, generateBookTitle as aiGenerateBookTitle, refactorChapters as aiRefactorChapters } from '../services/aiService';
import { exportToTxt, exportToPdf, exportToDocx, exportToSsbf, exportToEpub } from '../services/exportService';
import { getPersonas, savePersona } from '../services/localStorageService';
import { STYLE_PRESETS } from '../constants';
import Spinner from './ui/Spinner';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Input from './ui/Input';
import Select from './ui/Select';
import Checkbox from './ui/Checkbox';
import { useModal } from '../contexts/ModalContext';
import Modal from './ui/Modal'; 

interface WritingScreenProps {
  book: Book;
  setBook: React.Dispatch<React.SetStateAction<Book | null>>;
  onRestart: () => void;
  isContentHidden: boolean;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  aiProvider: AIProvider;
  puterImageModel: PuterImageModel;
  onSaveChapter: (chapter: Chapter, isNew?: boolean) => Promise<void>;
  onSaveMetadata: (bookToSave?: Book) => Promise<void>;
  isGuestMode: boolean;
  onDeleteChapter: (chapterId: string) => Promise<void>;
  onBranchStory: (parentBook: Book, branchPointIndex: number) => Promise<void>;
  isReadOnly?: boolean;
}

const simpleMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    let html = markdown
      .replace(/^#\s(.*?)$/gm, '<h1>$1</h1>')
      .replace(/^##\s(.*?)$/gm, '<h2>$1</h2>')
      .replace(/^###\s(.*?)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
    const blocks = html.split(/\n\s*\n/).filter(block => block.trim() !== '');
    return blocks.map(block => {
      if (block.startsWith('<h1') || block.startsWith('<h2') || block.startsWith('<h3')) {
        return block;
      }
      return `<p>${block.replace(/\n/g, '<br />')}</p>`;
    }).join('');
};

const getChapterTitle = (content: string, index: number, isAdventure: boolean) => {
    const unitLabel = isAdventure ? 'Segment' : 'Chapter';
    const match = content.match(/^#\s(.*?)$/m) || content.match(/^##\s(.*?)$/m);
    if (match) {
        const title = match[1].trim();
        return title.length > 35 ? title.substring(0, 35) + '...' : title;
    }
    return `${unitLabel} ${index + 1}`;
};

const ANALYSIS_SEPARATOR = '___ANALYSIS_START___';

const WritingScreen: React.FC<WritingScreenProps> = ({ 
    book, setBook, onRestart, isContentHidden, isDirty, setIsDirty, 
    aiProvider, puterImageModel, onSaveChapter, onSaveMetadata, 
    isGuestMode, onDeleteChapter, onBranchStory, isReadOnly = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Ready to write.');
  const [nextChapterPrompt, setNextChapterPrompt] = useState('');
  
  // Local streaming text state to prevent global re-renders (flashing)
  const [localStreamingContent, setLocalStreamingContent] = useState<string | null>(null);

  // UI Tabs State
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chapters' | 'timeline' | 'persona' | 'controls'>('chapters');
  const [mobileTab, setMobileTab] = useState<'write' | 'chapters' | 'timeline' | 'persona' | 'settings'>('write');

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState('');

  // Refactor State
  const [showRefactorModal, setShowRefactorModal] = useState(false);
  const [refactorMode, setRefactorMode] = useState<'contradictions' | 'detail'>('contradictions');
  const [refactorInstruction, setRefactorInstruction] = useState('');
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [refactorStatus, setRefactorStatus] = useState('');
  const refactorAborted = useRef(false);

  // Milestone State
  const [editingMilestone, setEditingMilestone] = useState<{index: number, desc: string} | null>(null);

  // Persona State
  const [newTrait, setNewTrait] = useState('');
  const [newMemory, setNewMemory] = useState('');

  // General State
  const [showPremiseModal, setShowPremiseModal] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(book.title || '');
  const [possibleErrorContent, setPossibleErrorContent] = useState<string | null>(null);
  const [pendingChapterId, setPendingChapterId] = useState<string | null>(null);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(Math.max(0, book.chapters.length - 1));
  const [localUserNotes, setLocalUserNotes] = useState(book.userNotes || '');
  const [localLongTermGoals, setLocalLongTermGoals] = useState(book.longTermGoals || '');
  const [localCustomAuthor, setLocalCustomAuthor] = useState(book.request.customAuthor || '');
  const [showExport, setShowExport] = useState(false);

  const { showModal } = useModal();
  const isAdventure = book.request.type === BookType.Adventure;
  const unitLabel = isAdventure ? 'Segment' : 'Chapter';

  const currentChapter = book.chapters[currentChapterIndex];

  useEffect(() => { 
      setLocalUserNotes(book.userNotes || ''); 
      setLocalLongTermGoals(book.longTermGoals || '');
      setLocalCustomAuthor(book.request.customAuthor || '');
  }, [book.userNotes, book.longTermGoals, book.request.customAuthor]);
  
  useEffect(() => { 
      if (currentChapterIndex >= book.chapters.length) {
          setCurrentChapterIndex(Math.max(0, book.chapters.length - 1));
      }
      setLocalStreamingContent(null);
      setIsEditing(false);
  }, [book.chapters.length, book.id]);

  useEffect(() => { 
      setEditedTitle(book.title || '');
  }, [book.title]);

  const handleBranch = () => {
      if (isReadOnly) return;
      showModal({
          title: "Branch Timeline?",
          message: `This will create a new book project starting from ${unitLabel} ${currentChapterIndex + 1}. You can explore an alternate path from here.`,
          confirmText: "Branch Story",
          onConfirm: () => onBranchStory(book, currentChapterIndex)
      });
  };

  const handleStartEdit = () => {
      if (isReadOnly || !currentChapter) return;
      setEditContent(currentChapter.content);
      setIsEditing(true);
  };

  const handleSaveEdit = async () => {
      if (isReadOnly || !currentChapter) return;
      const updatedChapter = { ...currentChapter, content: editContent };
      const updatedChapters = [...book.chapters];
      updatedChapters[currentChapterIndex] = updatedChapter;
      setBook({ ...book, chapters: updatedChapters });
      await onSaveChapter(updatedChapter);
      setIsEditing(false);
      setStatusText('Changes saved.');
  };

  const handleDeleteChapterClick = (id: string, index: number) => {
      if (isReadOnly) return;
      showModal({
          title: `Delete ${unitLabel}?`,
          message: `Are you sure you want to permanently delete this segment? All narrative progress in this turn will be lost.`,
          confirmText: "Delete Forever",
          onConfirm: async () => {
              try {
                  // Immediate optimistic UI update
                  const updatedChapters = book.chapters.filter(ch => ch.id !== id);
                  const updatedBook = { 
                      ...book, 
                      chapters: updatedChapters,
                      chapterCount: updatedChapters.length 
                  };
                  
                  setBook(updatedBook);
                  
                  // Call service to persist deletion
                  await onDeleteChapter(id);
                  
                  if (currentChapterIndex >= updatedChapters.length) {
                      setCurrentChapterIndex(Math.max(0, updatedChapters.length - 1));
                  }
                  
                  setStatusText('Segment deleted.');
              } catch (e) {
                  showModal({ title: "Error", message: "Failed to delete segment. It may have already been removed.", confirmText: "OK" });
              }
          },
          cancelText: "Cancel"
      });
  };

  const cancelRefactor = () => {
      refactorAborted.current = true;
      setIsRefactoring(false);
      setShowRefactorModal(false);
      setRefactorStatus('');
  };

  const handleRefactor = async () => {
      if (isReadOnly || isRefactoring) return;
      setIsRefactoring(true);
      setRefactorStatus('Reading timelines...');
      refactorAborted.current = false;
      
      const instruction = refactorMode === 'contradictions' 
        ? "Review the past ten chapters and resolve any narrative contradictions, logic errors, or timeline inconsistencies. Do not change other details."
        : `Go through the past ten chapters and change the following detail everywhere it appears: "${refactorInstruction}". Do not fix unrelated contradictions.`;

      try {
          const updates = await aiRefactorChapters(book, instruction);
          
          if (refactorAborted.current) return;

          if (updates.length === 0) {
              showModal({ title: "Refactor Complete", message: "The AI reviewed the story and found no necessary changes.", confirmText: "OK" });
          } else {
              setRefactorStatus(`Updating ${updates.length} segments...`);
              const updatedChapters = [...book.chapters];
              
              for (const update of updates) {
                  if (update.index >= 0 && update.index < updatedChapters.length) {
                      updatedChapters[update.index] = { ...updatedChapters[update.index], content: update.content };
                  }
              }
              
              setBook({ ...book, chapters: updatedChapters });
              
              const savePromises = updates.map(update => {
                  if (update.index >= 0 && update.index < updatedChapters.length) {
                      return onSaveChapter(updatedChapters[update.index]);
                  }
                  return Promise.resolve();
              });
              
              await Promise.all(savePromises);
              if (refactorAborted.current) return;
              showModal({ title: "Continuity Restored", message: `The AI surgically updated ${updates.length} segments to maintain consistency.`, confirmText: "Excellent" });
          }
      } catch (e) {
          if (!refactorAborted.current) {
              showModal({ title: "Refactor Error", message: "The AI analysis timed out or failed. Try a smaller change.", confirmText: "OK" });
          }
      } finally {
          setIsRefactoring(false);
          setRefactorStatus('');
          setShowRefactorModal(false);
      }
  };

  const handleAddMilestone = (idx: number) => {
      if (isReadOnly) return;
      setEditingMilestone({ index: idx, desc: book.milestones?.find(m => m.chapterIndex === idx)?.description || '' });
  };

  const saveMilestone = () => {
      if (!editingMilestone) return;
      const filtered = (book.milestones || []).filter(m => m.chapterIndex !== editingMilestone.index);
      if (editingMilestone.desc.trim()) {
          filtered.push({ chapterIndex: editingMilestone.index, description: editingMilestone.desc.trim() });
      }
      const updatedBook = { ...book, milestones: filtered };
      setBook(updatedBook);
      onSaveMetadata(updatedBook);
      setEditingMilestone(null);
  };

  const addTrait = () => {
      if (!newTrait.trim() || !isAdventure || isReadOnly) return;
      const persona = (book.request as AdventureBookRequest).persona;
      const updatedPersona = { ...persona, activeTraits: [...(persona.activeTraits || []), newTrait.trim()] };
      const updatedBook = { ...book, request: { ...book.request, persona: updatedPersona } as AdventureBookRequest };
      setBook(updatedBook);
      onSaveMetadata(updatedBook);
      setNewTrait('');
  };

  const removeTrait = (idx: number) => {
      if (isReadOnly) return;
      const persona = (book.request as AdventureBookRequest).persona;
      const traits = [...(persona.activeTraits || [])];
      traits.splice(idx, 1);
      const updatedBook = { ...book, request: { ...book.request, persona: { ...persona, activeTraits: traits } } as AdventureBookRequest };
      setBook(updatedBook);
      onSaveMetadata(updatedBook);
  };

  const addMemory = () => {
      if (!newMemory.trim() || !isAdventure || isReadOnly) return;
      const persona = (book.request as AdventureBookRequest).persona;
      const updatedPersona = { ...persona, unlockedMemories: [...(persona.unlockedMemories || []), newMemory.trim()] };
      const updatedBook = { ...book, request: { ...book.request, persona: updatedPersona } as AdventureBookRequest };
      setBook(updatedBook);
      onSaveMetadata(updatedBook);
      setNewMemory('');
  };

  const removeMemory = (idx: number) => {
      if (isReadOnly) return;
      const persona = (book.request as AdventureBookRequest).persona;
      const memories = [...(persona.unlockedMemories || [])];
      memories.splice(idx, 1);
      const updatedBook = { ...book, request: { ...book.request, persona: { ...persona, unlockedMemories: memories } } as AdventureBookRequest };
      setBook(updatedBook);
      onSaveMetadata(updatedBook);
  };

  const handleUpdateStyle = (styleId: string) => {
      if (isReadOnly) return;
      const updatedBook = { ...book, request: { ...book.request, stylePreset: styleId } as any };
      setBook(updatedBook);
      onSaveMetadata(updatedBook);
  };

  const handleUpdateAuthorMimicry = async () => {
      if (isReadOnly) return;
      const updatedBook = { ...book, request: { ...book.request, customAuthor: localCustomAuthor.trim() } as any };
      setBook(updatedBook);
      setStatusText('Updating style...');
      await onSaveMetadata(updatedBook);
      setStatusText('Style updated.');
  };

  const handleUpdateNotes = async () => {
      if (isReadOnly) return;
      const updatedBook = { ...book, userNotes: localUserNotes };
      setBook(updatedBook);
      setStatusText('Saving notes...');
      await onSaveMetadata(updatedBook);
      setStatusText('Notes saved.');
  };

  const handleUpdateLongTermGoals = async () => {
      if (isReadOnly) return;
      const updatedBook = { ...book, longTermGoals: localLongTermGoals };
      setBook(updatedBook);
      setStatusText('Saving goals...');
      await onSaveMetadata(updatedBook);
      setStatusText('Goals saved.');
  };

  const handleRenameBook = async () => {
      if (isReadOnly || !editedTitle.trim()) { setIsEditingTitle(false); return; }
      const updatedBook = { ...book, title: editedTitle.trim() };
      setBook(updatedBook);
      setIsEditingTitle(false);
      await onSaveMetadata(updatedBook);
  };

  const handleTogglePublic = async () => {
      if (isReadOnly || isGuestMode) return;
      const nextPublic = !book.isPublic;
      const updatedBook = { ...book, isPublic: nextPublic };
      setBook(updatedBook);
      await onSaveMetadata(updatedBook);
  };

  const copyShareLink = () => {
      const url = `${window.location.origin}/create?share=${book.id}`;
      navigator.clipboard.writeText(url);
      alert("Public link copied to clipboard!");
  };

  const parseChunkedResponse = (fullText: string) => {
      let storyContent = fullText;
      let analysisData = null;
      if (fullText.includes(ANALYSIS_SEPARATOR)) {
          const parts = fullText.split(ANALYSIS_SEPARATOR);
          storyContent = parts[0]; 
          const analysisPart = parts[1];
          const match = analysisPart.match(/IMP:\s*(.*?)\s*\|\s*SUM:\s*(.*?)(?=\s*___|$)/i);
          if (match) {
               let impStr = match[1].trim().toUpperCase();
               let importance = ChapterImportance.Medium;
               if (impStr.includes('HIGH')) importance = ChapterImportance.High;
               else if (impStr.includes('LOW')) importance = ChapterImportance.Low;
               analysisData = { importance, summary: match[2].trim() };
          }
      }
      return { storyContent: storyContent.trim(), analysisData };
  };

  const handleGenerateNextChapter = useCallback(async (forcedPrompt?: string) => {
    if (isReadOnly || isLoading) return;
    setIsLoading(true);
    setStatusText(`The AI is writing...`);
    
    const newChapterId = `chapter-${Date.now()}`;
    const newPrompt = forcedPrompt !== undefined ? forcedPrompt : nextChapterPrompt.trim();
    const updatedHistory = newPrompt ? [...(book.promptHistory || []), newPrompt] : (book.promptHistory || []);
    
    setLocalStreamingContent(""); 
    
    let fullRawContent = '';
    
    try {
        const stream = aiWriteChapterStream(book, newPrompt);
        for await (const chunk of stream) {
          fullRawContent += chunk;
          const { storyContent } = parseChunkedResponse(fullRawContent);
          setLocalStreamingContent(storyContent);
        }
        
        const { storyContent, analysisData } = parseChunkedResponse(fullRawContent);
        
        if (storyContent.length < 150 && (storyContent.toLowerCase().includes("cannot generate") || storyContent.toLowerCase().includes("safety"))) {
            setPossibleErrorContent(storyContent); 
            setPendingChapterId(newChapterId);
            setIsLoading(false); 
            return;
        }

        const newChapter: Chapter = { 
            id: newChapterId, 
            content: storyContent, 
            summary: analysisData?.summary, 
            importance: analysisData?.importance,
            prompt: newPrompt, 
            index: book.chapters.length, 
            createdAt: new Date().toISOString() 
        };

        const updatedBook: Book = {
            ...book,
            chapters: [...book.chapters, newChapter],
            promptHistory: updatedHistory,
            chapterCount: book.chapters.length + 1
        };

        let finalTitle = updatedBook.title;
        if (updatedBook.chapters.length === 1) {
            try {
                const generatedTitle = await aiGenerateBookTitle(book.request.plot, storyContent);
                if (generatedTitle) finalTitle = generatedTitle;
            } catch (e) {}
        }
        
        updatedBook.title = finalTitle;

        setBook(updatedBook);
        await onSaveChapter(newChapter, true);
        await onSaveMetadata(updatedBook);
        
        setLocalStreamingContent(null);
        setNextChapterPrompt(''); 
        setIsLoading(false); 
        setIsDirty(false); 
        setStatusText('Saved.');
        setCurrentChapterIndex(updatedBook.chapters.length - 1);

    } catch (e) { 
        setIsLoading(false); 
        setStatusText('Error writing.'); 
        setLocalStreamingContent(null);
    }
  }, [book, nextChapterPrompt, setBook, aiProvider, onSaveChapter, onSaveMetadata, isReadOnly, isLoading]);

  const handleRegenerate = async () => {
    if (isReadOnly || isLoading || !currentChapter) return;
    setIsLoading(true);
    setStatusText(`The AI is rewriting...`);
    setShowRegenModal(false);
    
    setLocalStreamingContent(""); 
    
    let fullRawContent = '';
    
    try {
        const stream = aiRegenerateChapterStream(book, currentChapterIndex, regenInstructions);
        for await (const chunk of stream) {
          fullRawContent += chunk;
          const { storyContent } = parseChunkedResponse(fullRawContent);
          setLocalStreamingContent(storyContent);
        }
        
        const { storyContent, analysisData } = parseChunkedResponse(fullRawContent);
        
        const updatedChapter: Chapter = { 
            ...currentChapter,
            content: storyContent, 
            summary: analysisData?.summary || currentChapter.summary, 
            importance: analysisData?.importance || currentChapter.importance,
        };

        const updatedChapters = [...book.chapters];
        updatedChapters[currentChapterIndex] = updatedChapter;
        const updatedBook: Book = { ...book, chapters: updatedChapters };

        setBook(updatedBook);
        await onSaveChapter(updatedChapter);
        
        setLocalStreamingContent(null);
        setRegenInstructions(''); 
        setIsLoading(false); 
        setStatusText('Saved.');

    } catch (e) { 
        setIsLoading(false); 
        setStatusText('Error rewriting.'); 
        setLocalStreamingContent(null);
    }
  };

  const renderChaptersTab = () => (
    <div className="space-y-1">
        <div className="mb-4 pb-2 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">{unitLabel} List</h3>
                {!isReadOnly && <button onClick={handleBranch} className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded font-bold hover:bg-indigo-600">BRANCH</button>}
        </div>
        {book.chapters.map((ch, idx) => (
            <div key={ch.id} className="group relative">
            <button onClick={() => { setCurrentChapterIndex(idx); if(showMobileTools) setShowMobileTools(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3 pr-10 ${idx === currentChapterIndex ? 'bg-[var(--accent-color)] text-white shadow-md' : 'hover:bg-white/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${idx === currentChapterIndex ? 'bg-white' : (ch.importance === ChapterImportance.High ? 'bg-red-500' : 'bg-slate-300')}`} />
                <span className="truncate">{getChapterTitle(ch.content, idx, isAdventure)}</span>
            </button>
            {!isReadOnly && <button onClick={(e) => { e.stopPropagation(); handleDeleteChapterClick(ch.id, idx); }} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity">&times;</button>}
            </div>
        ))}
        {localStreamingContent !== null && (
             <div className="px-3 py-2.5 rounded-lg text-sm bg-amber-100/20 dark:bg-amber-900/20 border border-amber-200/50 flex items-center gap-3 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-bold italic">Writing...</span>
             </div>
        )}
    </div>
  );

  const renderTimelineTab = () => (
    <div className="space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-2">Story Beat Architect</h3>
        <div className="space-y-3">
            {Array.from({length: Math.max(book.chapters.length + 3, 10)}).map((_, i) => {
                const idx = i + 1;
                const milestone = book.milestones?.find(m => m.chapterIndex === idx);
                const isPast = idx <= book.chapters.length;
                return (
                    <div key={idx} onClick={() => handleAddMilestone(idx)} className={`p-3 rounded-xl border transition-all cursor-pointer group ${milestone ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200' : 'bg-white/40 dark:bg-white/5 border-transparent hover:border-slate-300'}`}>
                        <div className="flex justify-between items-center mb-1">
                            <span className={`text-[10px] font-bold ${isPast ? 'text-slate-400' : 'text-[var(--accent-color)]'}`}>CH {idx} {isPast ? '✓' : ''}</span>
                            {!isReadOnly && <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">EDIT</span>}
                        </div>
                        <p className={`text-xs leading-relaxed ${milestone ? 'text-slate-700 dark:text-slate-200 italic' : 'text-slate-400'}`}>
                            {milestone ? milestone.description : 'Set milestone...'}
                        </p>
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderPersonaTab = () => (
    <div className="space-y-6">
        <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Character Arc & Memory</h3>
        {isAdventure ? (
            <div className="space-y-6">
                <section>
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Active Traits</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(book.request as AdventureBookRequest).persona.activeTraits?.map((t, i) => (
                            <span key={i} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md flex items-center gap-1">{t}{!isReadOnly && <button onClick={() => removeTrait(i)} className="hover:text-red-500">&times;</button>}</span>
                        ))}
                    </div>
                    {!isReadOnly && <div className="flex gap-1"><input value={newTrait} onChange={e => setNewTrait(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTrait()} className="flex-1 bg-white/50 dark:bg-black/40 text-xs px-2 py-1.5 rounded border border-transparent focus:border-[var(--accent-color)] outline-none" placeholder="New trait (e.g. Distant)" /><button onClick={addTrait} className="bg-slate-700 text-white px-2 rounded text-sm">+</button></div>}
                </section>
                <section>
                    <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Unlocked Memories</h4>
                    <div className="space-y-2 mb-3">
                        {(book.request as AdventureBookRequest).persona.unlockedMemories?.map((m, i) => (
                            <div key={i} className="p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 rounded-lg text-[10px] leading-relaxed relative group">
                                {m}
                                {!isReadOnly && <button onClick={() => removeMemory(i)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500">&times;</button>}
                            </div>
                        ))}
                    </div>
                    {!isReadOnly && <><Textarea label="" value={newMemory} onChange={e => setNewMemory(e.target.value)} rows={2} className="!text-[10px] !p-2 !bg-white/50" placeholder="A specific detail learned..." />
                    <Button onClick={addMemory} className="w-full mt-2 !py-1 !text-xs">Unlock Memory</Button></>}
                </section>
            </div>
        ) : (<p className="text-xs text-slate-500 italic">Persona tracking is active in AI RPG mode.</p>)}
    </div>
  );

  const renderControlsTab = () => (
    <div className="space-y-6">
        <Button variant="secondary" onClick={() => setShowPremiseModal(true)} className="w-full text-xs flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            View Original Premise
        </Button>

        {!isReadOnly && (
            <Button variant="secondary" onClick={() => setShowRefactorModal(true)} className="w-full text-xs flex items-center gap-2 bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Story Consistency Check
            </Button>
        )}

        <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10">
            <Input label="Book Title" id="title-input" value={editedTitle} onChange={e => setEditedTitle(e.target.value)} onBlur={handleRenameBook} disabled={isReadOnly} />
        </div>

        {!isReadOnly && !isGuestMode && (
            <section className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">Sharing & Privacy</h4>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-slate-700 dark:text-slate-300">Public Access</span>
                    <button 
                        onClick={handleTogglePublic}
                        className={`w-10 h-5 rounded-full transition-colors relative ${book.isPublic ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${book.isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
                {book.isPublic && (
                    <Button onClick={copyShareLink} variant="secondary" className="w-full text-[10px] !py-1.5 uppercase tracking-widest bg-white dark:bg-indigo-900/30">Copy Share Link</Button>
                )}
            </section>
        )}

        <section>
            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Narrative Voice</h4>
            <div className="space-y-4">
                <div className="space-y-2">
                    {STYLE_PRESETS.map(s => (
                        <button key={s.id} onClick={() => handleUpdateStyle(s.id)} disabled={isReadOnly} className={`w-full text-left p-3 rounded-xl border transition-all ${book.request.stylePreset === s.id ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)] ring-1 ring-[var(--accent-color)]' : 'bg-white/40 dark:bg-white/5 border-transparent hover:border-slate-300'}`}>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{s.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{s.description}</div>
                        </button>
                    ))}
                </div>
                
                <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                    <label className="text-xs font-bold text-slate-400 mb-2 uppercase block">Author Mimicry</label>
                    <div className="relative group/author">
                        <Input 
                            label="" 
                            id="custom-author" 
                            placeholder="e.g. Stephen King, J.K. Rowling..." 
                            value={localCustomAuthor} 
                            onChange={e => setLocalCustomAuthor(e.target.value)} 
                            onBlur={handleUpdateAuthorMimicry}
                            disabled={isReadOnly}
                            className="!text-xs !py-2.5 !pr-8"
                        />
                        {localCustomAuthor && !isReadOnly && (
                            <button 
                                onClick={() => { setLocalCustomAuthor(''); handleUpdateAuthorMimicry(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 opacity-0 group-hover/author:opacity-100 transition-opacity"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">The AI will attempt to replicate the specific prose style of this author.</p>
                </div>
            </div>
        </section>

        <section>
            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Notes to AI</h4>
            <textarea disabled={isReadOnly} className="w-full h-20 bg-white/50 dark:bg-black/40 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[var(--accent-color)]" value={localUserNotes} onChange={e => setLocalUserNotes(e.target.value)} onBlur={handleUpdateNotes} placeholder="Global reminders (e.g. Always describe smells)..." />
        </section>
        <section>
            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Long Term Narrative Goals</h4>
            <p className="text-[10px] text-slate-500 mb-1">Things that should happen gradually over time.</p>
            <textarea disabled={isReadOnly} className="w-full h-32 bg-white/50 dark:bg-black/40 rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[var(--accent-color)]" value={localLongTermGoals} onChange={e => setLocalLongTermGoals(e.target.value)} onBlur={handleUpdateLongTermGoals} placeholder="e.g. The protagonist should slowly start disliking the sidekick..." />
        </section>
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setShowExport(true)}>Export</Button>
            {!isReadOnly && <Button variant="secondary" onClick={() => onSaveMetadata()}>Save</Button>}
        </div>
    </div>
  );

  const renderWriterInput = () => (
    <div className="bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl p-4 shadow-xl flex flex-col gap-4">
        <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Writer's Input</h3>
            <span className="text-[10px] font-mono text-slate-500">{unitLabel} {book.chapters.length + 1}</span>
        </div>
        <Textarea id="sidebar-prompt" label="" placeholder={isAdventure ? "What do you do?" : "What happens next?"} value={nextChapterPrompt} onChange={(e) => setNextChapterPrompt(e.target.value)} rows={6} className="!bg-white/50 dark:!bg-black/40 !text-sm" disabled={isLoading || isReadOnly} />
        {!isReadOnly ? (
            <Button onClick={() => handleGenerateNextChapter()} disabled={isLoading} className="w-full">
                {isLoading ? 'Writing...' : 'Generate Segment'}
            </Button>
        ) : (
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs text-center text-slate-500 italic">
                You are in Reader Mode. Logging in as the owner allows editing.
            </div>
        )}

        <Button variant="secondary" onClick={() => setShowPremiseModal(true)} className="w-full text-xs flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            View Original Premise
        </Button>

        {!isReadOnly && (
            <Button variant="secondary" onClick={() => setShowRefactorModal(true)} className="w-full text-xs flex items-center justify-center gap-2 bg-amber-100/30 dark:bg-amber-900/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Story Consistency Check
            </Button>
        )}

        <div className="mt-2 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setShowExport(true)} className="text-xs">Export</Button>
            <Button variant="secondary" onClick={onRestart} className="text-xs text-red-500">Exit</Button>
        </div>
    </div>
  );

  const displayContent = localStreamingContent !== null ? localStreamingContent : currentChapter?.content;

  return (
    <div className="w-full h-full relative pb-20">
        {editingMilestone && (
            <Modal isOpen={true} title={`Milestone: ${unitLabel} ${editingMilestone.index}`} onClose={() => setEditingMilestone(null)} confirmText="Save Goal" onConfirm={saveMilestone} cancelText="Clear" onCancel={() => { setEditingMilestone({...editingMilestone, desc: ''}); saveMilestone(); }}>
                <Textarea label="Narrative Objective" id="m-desc" value={editingMilestone.desc} onChange={e => setEditingMilestone({...editingMilestone, desc: e.target.value})} placeholder="e.g. Chell discovers the turret opera script..." rows={3} />
            </Modal>
        )}
        {showPremiseModal && (<Modal isOpen={showPremiseModal} title="Story Premise" onClose={() => setShowPremiseModal(false)} confirmText="Close" onConfirm={() => setShowPremiseModal(false)}><div className="bg-slate-100 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 overflow-y-auto max-h-[60vh] whitespace-pre-wrap text-slate-800 dark:text-slate-200">{book.request.plot}</div></Modal>)}
        
        {showRegenModal && (
             <Modal isOpen={true} title="AI Regeneration" onClose={() => setShowRegenModal(false)} confirmText="Regenerate" onConfirm={handleRegenerate} cancelText="Cancel" onCancel={() => setShowRegenModal(false)}>
                <Textarea label="Instructions (Optional)" id="regen-instr" value={regenInstructions} onChange={e => setRegenInstructions(e.target.value)} placeholder="e.g. Make it more intense, or fix logic regarding the map..." rows={4} />
             </Modal>
        )}

        {showRefactorModal && (
            <Modal 
                isOpen={true} 
                title="Story Consistency Check" 
                onClose={cancelRefactor} 
                confirmText={isRefactoring ? "Processing..." : "Begin Analysis"} 
                onConfirm={handleRefactor} 
                cancelText="Cancel" 
                onCancel={cancelRefactor}
            >
                <div className="space-y-4">
                    {!isRefactoring ? (
                        <>
                            <p className="text-sm text-slate-500">The AI will analyze the <strong>last 10 segments</strong> to ensure narrative consistency.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setRefactorMode('contradictions')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${refactorMode === 'contradictions' ? 'bg-[var(--accent-color)] text-white border-transparent shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent hover:bg-slate-200'}`}>Fix Contradictions</button>
                                <button onClick={() => setRefactorMode('detail')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${refactorMode === 'detail' ? 'bg-[var(--accent-color)] text-white border-transparent shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-transparent hover:bg-slate-200'}`}>Change a Detail</button>
                            </div>
                            {refactorMode === 'detail' && (
                                <Textarea label="What detail should change?" id="refactor-detail" value={refactorInstruction} onChange={e => setRefactorInstruction(e.target.value)} placeholder="e.g. Change the sidekick's name from Bob to Robert." rows={3} />
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center py-4 gap-3 animate-pulse">
                            <Spinner className="w-8 h-8 text-[var(--accent-color)]" />
                            <p className="text-xs font-bold text-[var(--accent-color)]">{refactorStatus}</p>
                            <p className="text-[10px] text-slate-400 mt-2">Checking timelines for paradoxes...</p>
                        </div>
                    )}
                </div>
            </Modal>
        )}

        {showMobileTools && (
            <Modal isOpen={showMobileTools} title="Story Tools" onClose={() => setShowMobileTools(false)} confirmText="Close" onConfirm={() => setShowMobileTools(false)}>
                <div className="flex flex-col h-[70vh]">
                    <div className="flex bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/10 mb-4 overflow-x-auto">
                        {[
                            {id: 'write', label: 'View', icon: '📖'},
                            {id: 'chapters', label: 'History', icon: '📚'},
                            {id: 'timeline', label: 'Plan', icon: '⏳'},
                            {id: 'persona', label: 'Bio', icon: '👤'},
                            {id: 'settings', label: 'Config', icon: '⚙️'}
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setMobileTab(tab.id as any)} className={`flex-1 min-w-[70px] py-3 text-xs font-bold transition-colors ${mobileTab === tab.id ? 'bg-white dark:bg-slate-900 text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'opacity-50 hover:opacity-100'}`}>
                                <span className="block text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1 pb-10">
                        {mobileTab === 'write' && renderWriterInput()}
                        {mobileTab === 'chapters' && renderChaptersTab()}
                        {mobileTab === 'timeline' && renderTimelineTab()}
                        {mobileTab === 'persona' && renderPersonaTab()}
                        {mobileTab === 'settings' && renderControlsTab()}
                    </div>
                </div>
            </Modal>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-24 h-[calc(100vh-8rem)]">
                <div className="flex flex-col h-full bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/10">
                        {isEditingTitle && !isReadOnly ? (
                            <input 
                                className="w-full bg-white dark:bg-black/20 border border-[var(--accent-color)] rounded px-2 py-1 text-sm font-bold text-slate-900 dark:text-white outline-none"
                                value={editedTitle}
                                onChange={e => setEditedTitle(e.target.value)}
                                onBlur={handleRenameBook}
                                onKeyDown={e => e.key === 'Enter' && handleRenameBook()}
                                autoFocus
                            />
                        ) : (
                            <div className="flex justify-between items-start group">
                                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2" title={book.title}>
                                    {book.title || 'Untitled Book'}
                                </h2>
                                {!isReadOnly && <button onClick={() => setIsEditingTitle(true)} className="text-slate-400 hover:text-[var(--accent-color)] opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>}
                            </div>
                        )}
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{isAdventure ? 'RPG Adventure' : 'Novel Project'}</p>
                    </div>

                    <div className="flex bg-slate-50 dark:bg-black/20 border-b border-slate-200 dark:border-white/10">
                        {[
                            {id: 'chapters', icon: '📖'},
                            {id: 'timeline', icon: '⏳'},
                            {id: 'persona', icon: '👤'},
                            {id: 'controls', icon: '⚙️'}
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveSidebarTab(tab.id as any)} className={`flex-1 py-3 text-lg transition-colors ${activeSidebarTab === tab.id ? 'bg-white dark:bg-slate-900 text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'opacity-50 hover:opacity-100'}`} title={tab.id}>
                                {tab.icon}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeSidebarTab === 'chapters' && renderChaptersTab()}
                        {activeSidebarTab === 'timeline' && renderTimelineTab()}
                        {activeSidebarTab === 'persona' && renderPersonaTab()}
                        {activeSidebarTab === 'controls' && renderControlsTab()}
                    </div>
                </div>
            </aside>

            <main className="col-span-1 lg:col-span-6 xl:col-span-6 flex flex-col gap-6">
                <div className="lg:hidden bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-xl p-3 flex justify-between items-center shadow-md">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{book.title || 'Untitled Book'}</h2>
                        <span className="text-[10px] text-slate-500 uppercase">{unitLabel} {localStreamingContent !== null ? book.chapters.length + 1 : currentChapterIndex + 1}</span>
                    </div>
                    <button onClick={() => setShowMobileTools(true)} className="p-2 bg-[var(--accent-color)] text-white rounded-lg flex items-center gap-2 px-4 shadow-lg">
                        <span className="text-xs font-bold">TOOLS</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.533 1.533 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    </button>
                </div>

                <div className="animate-fade-in bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border border-white/60 dark:border-white/5 rounded-2xl p-6 md:p-12 shadow-2xl min-h-[70vh] relative group/paper">
                    {/* Chapter Action Bar */}
                    {!isReadOnly && currentChapter && !localStreamingContent && (
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/paper:opacity-100 transition-opacity z-10">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => setIsEditing(false)} className="text-xs !py-1 !px-3">Cancel</Button>
                                    <Button onClick={handleSaveEdit} className="text-xs !py-1 !px-3">Save</Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={handleStartEdit} className="text-xs !py-1 !px-3 flex items-center gap-1">
                                        ✏️ Edit
                                    </Button>
                                    <Button variant="secondary" onClick={() => setShowRegenModal(true)} className="text-xs !py-1 !px-3 flex items-center gap-1">
                                        ✨ Rewrite
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                     {!isContentHidden && (displayContent || isEditing) ? (
                        <div className="prose prose-slate dark:prose-invert prose-base md:prose-lg max-w-none leading-loose">
                            {isEditing ? (
                                <textarea 
                                    className="w-full bg-white/40 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white font-serif min-h-[60vh] outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                />
                            ) : (
                                <>
                                    <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(displayContent) }} />
                                    {localStreamingContent !== null && <span className="inline-block w-2 h-5 bg-[var(--accent-color)] ml-1 animate-pulse" />}
                                </>
                            )}
                        </div>
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 italic">No content.</div>
                     )}
                </div>
            </main>

            <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-24 h-[calc(100vh-8rem)]">
                <div className="flex flex-col h-full gap-4">
                    {renderWriterInput()}
                </div>
            </aside>
        </div>
        {showExport && (<Modal isOpen={showExport} onClose={() => setShowExport(false)} title="Export Book" confirmText="Close" onConfirm={() => setShowExport(false)}><div className="grid grid-cols-2 gap-4"><Button variant="secondary" onClick={() => exportToTxt(book.chapters, book.title)}>Text (.txt)</Button><Button variant="secondary" onClick={() => exportToPdf(book.chapters, book.title)}>PDF (.pdf)</Button><Button variant="secondary" onClick={() => exportToDocx(book.chapters, book.title)}>Word (.docx)</Button><Button variant="secondary" onClick={() => exportToSsbf(book)}>Backup (.ssbf)</Button></div></Modal>)}
    </div>
  );
};
export default WritingScreen;