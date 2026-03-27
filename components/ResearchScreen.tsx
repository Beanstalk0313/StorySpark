
import React, { useState, useEffect, useRef } from 'react';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { ResearchTopic, ResearchSection, ResearchItem } from '../types';
import { exportResearchTopic, importResearchTopic } from '../services/fileService';

interface ResearchScreenProps {
  isResearching: boolean;
  researchSummaryRaw: string;
  seriesList: string[];
  onRunAI: () => void;
  onSubmit: (finalSummary: string) => void;
  onBack: () => void;
}

const ResearchScreen: React.FC<ResearchScreenProps> = ({ isResearching, researchSummaryRaw, seriesList, onRunAI, onSubmit, onBack }) => {
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);
  const [isParsing, setIsParsing] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<number | null>(null);
  const [modalInputName, setModalInputName] = useState('');
  
  const hasInitialized = useRef(false);
  const lastProcessedSummary = useRef('');

  // 1. Initial population: Create empty buckets for each franchise in the list
  useEffect(() => {
    if (!hasInitialized.current && seriesList.length > 0) {
        const initialTopics: ResearchTopic[] = seriesList.map(s => ({
            id: `topic-${Math.random().toString(36).substr(2, 9)}`,
            title: s,
            sections: [{ id: `sec-def-${Date.now()}`, title: 'General Notes', items: [] }]
        }));
        setTopics(initialTopics);
        hasInitialized.current = true;
    }
  }, [seriesList]);

  // 2. Parse AI Results: Intelligent merge to avoid duplication
  useEffect(() => {
    if (!isResearching && researchSummaryRaw && researchSummaryRaw !== lastProcessedSummary.current) {
        setIsParsing(true);
        const parsedTopics = parseMarkdownToTopics(researchSummaryRaw);
        
        setTopics(prevTopics => {
            // Create a deep clone of the previous topics to avoid reference sharing
            const nextTopics = prevTopics.map(t => ({
                ...t,
                sections: t.sections.map(s => ({
                    ...s,
                    items: s.items.map(i => ({ ...i }))
                }))
            }));

            parsedTopics.forEach(incomingTopic => {
                // Find matching topic bucket (case-insensitive fuzzy match)
                const existingIdx = nextTopics.findIndex(t => 
                    t.title.toLowerCase().trim() === incomingTopic.title.toLowerCase().trim() ||
                    t.title.toLowerCase().includes(incomingTopic.title.toLowerCase()) ||
                    incomingTopic.title.toLowerCase().includes(t.title.toLowerCase())
                );

                if (existingIdx !== -1) {
                    const targetTopic = nextTopics[existingIdx];
                    incomingTopic.sections.forEach(incomingSec => {
                        const existingSecIdx = targetTopic.sections.findIndex(s => 
                            s.title.toLowerCase().trim() === incomingSec.title.toLowerCase().trim()
                        );

                        if (existingSecIdx !== -1) {
                            // Deduplicate items when merging sections
                            const existingItemContents = new Set(targetTopic.sections[existingSecIdx].items.map(i => i.content.trim().toLowerCase()));
                            const newItems = incomingSec.items.filter(i => !existingItemContents.has(i.content.trim().toLowerCase()));
                            targetTopic.sections[existingSecIdx].items.push(...newItems);
                        } else {
                            // Add new section if it doesn't exist
                            targetTopic.sections.push({
                                ...incomingSec,
                                id: `sec-${Math.random().toString(36).substr(2, 9)}`
                            });
                        }
                    });
                    
                    // Clean up default empty "General Notes" if we got better data
                    if (targetTopic.sections.length > 1) {
                         const defIdx = targetTopic.sections.findIndex(s => s.title === 'General Notes' && s.items.length === 0);
                         if (defIdx !== -1) targetTopic.sections.splice(defIdx, 1);
                    }
                } else {
                    // Entirely new topic found by AI not in our original seriesList
                    nextTopics.push(incomingTopic);
                }
            });
            return nextTopics;
        });

        lastProcessedSummary.current = researchSummaryRaw;
        setIsParsing(false);
    }
  }, [isResearching, researchSummaryRaw]);

  const parseMarkdownToTopics = (text: string): ResearchTopic[] => {
      const results: ResearchTopic[] = [];
      const topicChunks = text.split(/(?=^#\s)/gm).filter(c => c.trim().length > 0);
      
      topicChunks.forEach(chunk => {
          const lines = chunk.split('\n');
          const header = lines[0].replace(/^#\s/, '').trim() || 'Research Results';
          const contentBody = lines.slice(1).join('\n');
          const newTopic: ResearchTopic = { 
              id: `topic-${Math.random().toString(36).substr(2, 9)}`, 
              title: header, 
              sections: [] 
          };
          
          const sectionChunks = contentBody.split(/(?=^##\s)/gm).filter(c => c.trim().length > 0);
          if (sectionChunks.length === 0 && contentBody.trim()) {
              newTopic.sections.push({ 
                  id: `sec-${Math.random().toString(36).substr(2, 9)}`, 
                  title: 'General', 
                  items: parseItems(contentBody) 
              });
          } else {
              sectionChunks.forEach(secChunk => {
                  const secLines = secChunk.split('\n');
                  const secHeader = secLines[0].replace(/^##\s/, '').trim() || 'Notes';
                  const items = parseItems(secLines.slice(1).join('\n'));
                  if (items.length > 0) {
                      newTopic.sections.push({ 
                          id: `sec-${Math.random().toString(36).substr(2, 9)}`, 
                          title: secHeader, 
                          items 
                      });
                  }
              });
          }
          if (newTopic.sections.length > 0) results.push(newTopic);
      });
      return results;
  };

  const parseItems = (text: string): ResearchItem[] => {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2 && (line.startsWith('*') || line.startsWith('-') || line.match(/^\d+\./)))
        .map(line => ({ 
            id: `item-${Math.random().toString(36).substr(2, 9)}`, 
            content: line.replace(/^[*-\d.]+\s*/, '') 
        }));
  };

  const handleItemChange = (topicIdx: number, secIdx: number, itemIdx: number, newVal: string) => {
      setTopics(prev => {
          const next = [...prev];
          const targetTopic = { ...next[topicIdx] };
          const targetSections = [...targetTopic.sections];
          const targetSection = { ...targetSections[secIdx] };
          const targetItems = [...targetSection.items];
          
          targetItems[itemIdx] = { ...targetItems[itemIdx], content: newVal };
          targetSection.items = targetItems;
          targetSections[secIdx] = targetSection;
          targetTopic.sections = targetSections;
          next[topicIdx] = targetTopic;
          return next;
      });
  };

  const handleAddItem = (topicIdx: number, secIdx: number, afterIdx: number) => {
      setTopics(prev => {
          const next = [...prev];
          const targetTopic = { ...next[topicIdx] };
          const targetSections = [...targetTopic.sections];
          const targetSection = { ...targetSections[secIdx] };
          const targetItems = [...targetSection.items];
          
          targetItems.splice(afterIdx + 1, 0, { id: `item-${Math.random().toString(36).substr(2, 9)}`, content: '' });
          
          targetSection.items = targetItems;
          targetSections[secIdx] = targetSection;
          targetTopic.sections = targetSections;
          next[topicIdx] = targetTopic;
          return next;
      });
  };

  const handleDeleteItem = (topicIdx: number, secIdx: number, itemIdx: number) => {
      setTopics(prev => {
          const next = [...prev];
          const targetTopic = { ...next[topicIdx] };
          const targetSections = [...targetTopic.sections];
          const targetSection = { ...targetSections[secIdx] };
          const targetItems = [...targetSection.items];
          
          targetItems.splice(itemIdx, 1);
          
          targetSection.items = targetItems;
          targetSections[secIdx] = targetSection;
          targetTopic.sections = targetSections;
          next[topicIdx] = targetTopic;
          return next;
      });
  };

  const confirmAddSection = () => {
      if (!modalInputName.trim()) return;
      setTopics(prev => {
          const next = [...prev];
          const targetTopic = { ...next[activeTopicIndex] };
          targetTopic.sections = [...targetTopic.sections, { 
              id: `sec-${Date.now()}`, 
              title: modalInputName.trim(), 
              items: [{ id: `item-${Date.now()}`, content: '' }] 
          }];
          next[activeTopicIndex] = targetTopic;
          return next;
      });
      setShowAddSectionModal(false);
      setModalInputName('');
  };

  const handleDeleteSection = (topicIdx: number, secIdx: number) => {
       setTopics(prev => {
          const next = [...prev];
          const targetTopic = { ...next[topicIdx] };
          const targetSections = [...targetTopic.sections];
          targetSections.splice(secIdx, 1);
          targetTopic.sections = targetSections;
          next[topicIdx] = targetTopic;
          return next;
       });
  };

  const confirmAddTopic = () => {
      if (!modalInputName.trim()) return;
      const newTopic: ResearchTopic = { 
          id: `topic-${Date.now()}`, 
          title: modalInputName.trim(), 
          sections: [{ id: `sec-${Date.now()}`, title: 'General Notes', items: [{ id: `item-${Date.now()}`, content: '' }] }] 
      };
      setTopics(prev => [...prev, newTopic]);
      setActiveTopicIndex(topics.length);
      setShowAddTopicModal(false);
      setModalInputName('');
  };

  const confirmDeleteTopic = () => {
      if (topicToDelete === null) return;
      setTopics(prev => {
          const next = prev.filter((_, idx) => idx !== topicToDelete);
          if (topicToDelete === activeTopicIndex) {
              setActiveTopicIndex(Math.max(0, next.length - 1));
          } else if (topicToDelete < activeTopicIndex) {
              setActiveTopicIndex(activeTopicIndex - 1);
          }
          return next;
      });
      setTopicToDelete(null);
  };

  const handleReplaceTopic = (index: number) => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.ssrf';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            try {
                const importedTopic = await importResearchTopic(file);
                setTopics(prev => {
                    const next = [...prev];
                    next[index] = importedTopic;
                    return next;
                });
            } catch (err) { alert("Failed to import/replace file."); }
        };
        input.click();
  };

  const handleImportClick = () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.ssrf';
      input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          try {
              const importedTopic = await importResearchTopic(file);
              setTopics(prev => [...prev, importedTopic]); 
              setActiveTopicIndex(topics.length); 
          } catch (err) { alert("Failed to import file."); }
      };
      input.click();
  };

  const handleFinalize = () => {
      let finalString = "";
      topics.forEach(topic => {
          if (topic.sections.some(s => s.items.some(i => i.content.trim()))) {
              finalString += `# ${topic.title}\n\n`;
              topic.sections.forEach(sec => {
                  const validItems = sec.items.filter(i => i.content.trim());
                  if (validItems.length > 0) {
                      finalString += `## ${sec.title}\n`;
                      validItems.forEach(item => {
                          finalString += `* ${item.content}\n`;
                      });
                      finalString += '\n';
                  }
              });
              finalString += '\n';
          }
      });
      onSubmit(finalString);
  };

  if (isResearching || isParsing) {
    return (
        <div className="text-center py-20 flex flex-col items-center">
            <Spinner />
            <h2 className="text-2xl font-bold mt-6 text-slate-900 dark:text-white">Processing Lore Data...</h2>
            <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-lg">
                {seriesList.map(s => (<span key={s} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-xs">{s}</span>))}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-md italic">Building structured canon knowledge. Please wait...</p>
        </div>
    );
  }

  const activeTopic = topics[activeTopicIndex];

  return (
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col md:flex-row bg-white/40 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in relative">
        {showAddTopicModal && (<Modal isOpen={true} title="New Research Topic" onClose={() => setShowAddTopicModal(false)} confirmText="Create" onConfirm={confirmAddTopic} cancelText="Cancel" onCancel={() => setShowAddTopicModal(false)}><Input label="Topic Name" id="new-topic" value={modalInputName} onChange={e => setModalInputName(e.target.value)} placeholder="e.g. Star Wars" autoFocus /></Modal>)}
        {showAddSectionModal && (<Modal isOpen={true} title="Add New Section" onClose={() => setShowAddSectionModal(false)} confirmText="Add Section" onConfirm={confirmAddSection} cancelText="Cancel" onCancel={() => setShowAddSectionModal(false)}><Input label="Section Title" id="new-section" value={modalInputName} onChange={e => setModalInputName(e.target.value)} placeholder="e.g. Characters" autoFocus /></Modal>)}
        {topicToDelete !== null && (<Modal isOpen={true} title="Delete Topic?" onClose={() => setTopicToDelete(null)} confirmText="Delete" onConfirm={confirmDeleteTopic} cancelText="Cancel" onCancel={() => setTopicToDelete(null)}><p>Are you sure you want to delete <strong>{topics[topicToDelete].title}</strong>?</p></Modal>)}

        <div className="w-full md:w-72 bg-white/60 dark:bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Lore Explorer</h3>
                <button onClick={() => { setModalInputName(''); setShowAddTopicModal(true); }} className="bg-[var(--accent-color)] text-white p-1 rounded-md hover:opacity-90 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {topics.map((topic, idx) => (
                    <div key={topic.id} className="group relative">
                        <button 
                            onClick={() => setActiveTopicIndex(idx)} 
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-all flex justify-between items-center pr-14 ${activeTopicIndex === idx ? 'bg-[var(--accent-color)] text-white shadow-md font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                        >
                            <span className="truncate">{topic.title}</span>
                        </button>
                        <div className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${activeTopicIndex === idx ? 'text-white' : 'text-slate-400'}`}>
                            <button onClick={(e) => { e.stopPropagation(); handleReplaceTopic(idx); }} className="p-1 rounded hover:bg-black/10" title="Replace with file"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></button>
                            <button onClick={(e) => { e.stopPropagation(); setTopicToDelete(idx); }} className="p-1 rounded hover:bg-red-500/20 hover:text-red-500" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20"><Button onClick={handleImportClick} variant="secondary" className="w-full text-xs">Import Research (.ssrf)</Button></div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-white/30 dark:bg-slate-900/30">
            {activeTopic ? (
                <>
                    <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white/40 dark:bg-white/5 backdrop-blur-md">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate pr-4">{activeTopic.title}</h2>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button variant="ghost" onClick={onRunAI} className="text-xs text-amber-500 flex items-center gap-1 group">
                                <span className="group-hover:animate-pulse">✨</span> Generate Lore
                            </Button>
                            <Button variant="secondary" onClick={() => { setModalInputName(''); setShowAddSectionModal(true); }} className="text-xs">+ Section</Button>
                            <Button variant="ghost" onClick={() => exportResearchTopic(activeTopic)} className="text-xs">Export</Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                        {activeTopic.sections.map((section, secIdx) => (
                            <div key={section.id} className="animate-fade-in bg-white/20 dark:bg-black/10 rounded-xl p-4 md:p-6 border border-slate-200/50 dark:border-white/5">
                                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200 dark:border-white/5 group">
                                    <h3 className="text-lg font-bold text-[var(--accent-color)]">{section.title}</h3>
                                    <button onClick={() => handleDeleteSection(activeTopicIndex, secIdx)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                                <div className="space-y-2 pl-2">
                                    {section.items.map((item, itemIdx) => (
                                        <div key={item.id} className="group flex items-start gap-3">
                                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
                                            <div className="flex-1">
                                                <input 
                                                    className="w-full bg-transparent border-b border-transparent focus:border-[var(--accent-color)] hover:border-slate-200 dark:hover:white/10 py-1 text-sm text-slate-800 dark:text-slate-200 focus:outline-none transition-colors" 
                                                    value={item.content} 
                                                    onChange={(e) => handleItemChange(activeTopicIndex, secIdx, itemIdx, e.target.value)} 
                                                    placeholder="Describe lore fact..." 
                                                />
                                            </div>
                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <button onClick={() => handleAddItem(activeTopicIndex, secIdx, itemIdx)} className="p-1 text-slate-400 hover:text-[var(--accent-color)]" title="Insert below"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg></button>
                                                <button onClick={() => handleDeleteItem(activeTopicIndex, secIdx, itemIdx)} className="p-1 text-slate-400 hover:text-red-500" title="Remove"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => handleAddItem(activeTopicIndex, secIdx, section.items.length - 1)} className="text-xs text-slate-400 hover:text-[var(--accent-color)] mt-3 font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        Add Lore Point
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (<div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4"><svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><p>Select a franchise to prepare your canon library.</p></div>)}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md flex justify-between items-center">
                <Button variant="secondary" onClick={onBack}>Discard Changes</Button>
                <div className="flex gap-4 items-center">
                    <span className="text-xs text-slate-500 hidden md:inline">Lore is saved to this book project.</span>
                    <Button onClick={handleFinalize} className="px-8 shadow-lg shadow-[var(--accent-color)]/20">Confirm Lore & Start Writing</Button>
                </div>
            </div>
        </div>
    </div>
  );
};
export default ResearchScreen;
