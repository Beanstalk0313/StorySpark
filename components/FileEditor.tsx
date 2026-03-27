
import React, { useState, useRef, useEffect } from 'react';
import { AIProvider, Persona, ResearchTopic, ResearchItem, Book, Chapter, BookType, BookLength, ChapterLength } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Spinner from './ui/Spinner';
import { exportPersona, exportResearchTopic } from '../services/fileService';
import { exportToSsbf } from '../services/exportService';
import { generateResearchSummaryStream as aiResearch } from '../services/aiService';
import { useModal } from '../contexts/ModalContext';

interface FileEditorProps {
  onBack: () => void;
  aiProvider: AIProvider;
}

type FileType = 'PERSONA' | 'RESEARCH' | 'BOOK';

const FileEditor: React.FC<FileEditorProps> = ({ onBack, aiProvider }) => {
  const [activeType, setActiveType] = useState<FileType>('PERSONA');
  const [isLoading, setIsLoading] = useState(false);
  const { showModal } = useModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for different file types
  const [persona, setPersona] = useState<Persona>({ name: '', age: '', gender: '', appearance: '', description: '' });
  const [research, setResearch] = useState<ResearchTopic>({ id: 'new', title: '', sections: [] });
  const [book, setBook] = useState<Partial<Book>>({ 
      title: '', 
      request: { 
          type: BookType.Original, 
          plot: '', 
          bookLength: BookLength.Medium,
          chapterLength: ChapterLength.Medium 
      }, 
      chapters: [] 
  });

  // Research Task State
  const [researchPrompt, setResearchPrompt] = useState('');
  const [isResearching, setIsResearching] = useState(false);

  // Handle Electron native imports via sessionStorage
  useEffect(() => {
    const lastImport = sessionStorage.getItem('storyspark-last-import');
    if (lastImport) {
        try {
            const { type, content } = JSON.parse(lastImport);
            const json = JSON.parse(content);
            
            if (type === 'PERSONA' && json.format === 'storyspark-persona-file') {
                setActiveType('PERSONA');
                setPersona(json.persona);
            } else if (type === 'RESEARCH' && json.format === 'storyspark-research-topic') {
                setActiveType('RESEARCH');
                setResearch(json.topic);
            }
        } catch (e) {
            console.error('Failed to handle native import:', e);
        }
        sessionStorage.removeItem('storyspark-last-import');
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (json.format === 'storyspark-persona-file') {
        setActiveType('PERSONA');
        setPersona(json.persona);
      } else if (json.format === 'storyspark-research-topic') {
        setActiveType('RESEARCH');
        setResearch(json.topic);
      } else if (json.format === 'storyspark-book-file') {
        setActiveType('BOOK');
        setBook(json);
      } else {
        showModal({ title: 'Invalid File', message: 'This is not a recognized StorySpark file.', confirmText: 'OK' });
      }
    } catch (err) {
      showModal({ title: 'Error', message: 'Failed to parse file.', confirmText: 'OK' });
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunResearch = async () => {
    if (!researchPrompt.trim()) return;
    setIsResearching(true);
    let fullText = '';
    
    try {
      // We reuse the existing service, passing the prompt as both series name and plot to get general info
      const stream = aiResearch(researchPrompt, "Standalone Research: Provide general overview, history, and key details.", []);
      
      for await (const chunk of stream) {
        fullText += chunk;
      }
      
      // Auto-parse into the current research object (simple split logic)
      const sections = fullText.split(/(?=^##\s)/gm).map(secChunk => {
        const lines = secChunk.split('\n');
        const header = lines[0].replace(/^##\s/, '').trim() || 'General';
        const items = lines.slice(1).join('\n').split('\n')
          .map(l => l.trim())
          .filter(l => l.startsWith('*') || l.startsWith('-'))
          .map(l => ({ id: Math.random().toString(), content: l.replace(/^[\*\-]\s*/, '') }));
        
        return { id: Math.random().toString(), title: header, items };
      }).filter(s => s.items.length > 0);

      setResearch({
        id: `res-${Date.now()}`,
        title: researchPrompt,
        sections: sections
      });
      
    } catch (err) {
      showModal({ title: 'Research Failed', message: 'Could not fetch research data.', confirmText: 'OK' });
    } finally {
      setIsResearching(false);
    }
  };

  const handleExport = () => {
    if (activeType === 'PERSONA') {
      if (!persona.name) return showModal({ title: 'Error', message: 'Persona name is required.', confirmText: 'OK' });
      exportPersona(persona);
    } else if (activeType === 'RESEARCH') {
      if (!research.title) return showModal({ title: 'Error', message: 'Research topic title is required.', confirmText: 'OK' });
      exportResearchTopic(research);
    } else if (activeType === 'BOOK') {
      if (!book.title && (!book.chapters || book.chapters.length === 0)) return showModal({ title: 'Error', message: 'Book must have a title or content.', confirmText: 'OK' });
      exportToSsbf(book as Book);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-[85vh] flex flex-col bg-white/40 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-wrap justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>&larr; Exit Editor</Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-color)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.533 1.533 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            File Laboratory
          </h2>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".sspf,.ssrf,.ssbf" />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-sm">Import StorySpark File</Button>
          <Button onClick={handleExport} className="text-sm shadow-lg shadow-[var(--accent-color)]/20">Save & Export</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <nav className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/20 p-4 space-y-2 flex-shrink-0">
          <button 
            onClick={() => setActiveType('PERSONA')} 
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeType === 'PERSONA' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            Persona (.sspf)
          </button>
          <button 
            onClick={() => setActiveType('RESEARCH')} 
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeType === 'RESEARCH' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 011.512-.306c.386.03.733.159 1.036.364.307.21.56.512.754.876.139.262.244.539.316.824.12.476.152.935.105 1.32-.069.575-.324 1.11-.69 1.542-.36.425-.83.738-1.344.912a4.416 4.416 0 01-1.312.22c-.417.01-.82-.045-1.18-.163-.36-.118-.67-.294-.92-.519a1 1 0 011.34-1.485c.064.058.15.116.273.156.123.04.264.06.417.056a2.414 2.414 0 00.72-.12c.21-.07.41-.198.574-.392.162-.192.274-.432.304-.684.02-.172.007-.373-.046-.583-.05-.195-.125-.388-.216-.56-.103-.194-.239-.35-.411-.468a1.64 1.64 0 00-.61-.219c-.198-.02-.4-.012-.61.025a1 1 0 01-1.162-.88 33.377 33.377 0 01.623-3.662c.23-.984.516-2.008.87-2.903.174-.442.384-.88.643-1.277.26-.4.593-.82 1.066-1.135a3 3 0 014.35 1.155 1 1 0 01-1.79.894 1 1 0 00-1.45-.385z" clipRule="evenodd" /></svg>
            Research (.ssrf)
          </button>
          <button 
            onClick={() => setActiveType('BOOK')} 
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${activeType === 'BOOK' ? 'bg-[var(--accent-color)] text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.903 7.903 0 0111 4c1.234 0 2.408.28 3.457.777V14a8.038 8.038 0 00-3.457-.777 7.89 7.89 0 00-2 1.081V4.804zM11 2.5a10 10 0 00-4.5 1.201 10 10 0 00-8.25 0 7 7 0 014.5-1.201 10 10 0 014.5 1.201 10 10 0 014.5-1.201 7 7 0 014.5 1.201 10 10 0 014.5-1.201 10 10 0 00-4.5 1.201z" /></svg>
            Book (.ssbf)
          </button>
        </nav>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white/20 dark:bg-slate-900/40 custom-scrollbar">
          {activeType === 'PERSONA' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
                <h3 className="text-2xl font-bold text-[var(--accent-color)]">Persona Editor</h3>
                <span className="text-xs font-mono text-slate-500">FORMAT: SSPF V1.0</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Character Name" id="p-name" value={persona.name} onChange={e => setPersona({...persona, name: e.target.value})} placeholder="e.g. Elara Vance" />
                <Input label="Age / Life Stage" id="p-age" value={persona.age} onChange={e => setPersona({...persona, age: e.target.value})} placeholder="e.g. 24 or Young Adult" />
              </div>
              <Select label="Gender Identity" id="p-gender" value={persona.gender} onChange={e => setPersona({...persona, gender: e.target.value})}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Select>
              <Textarea label="Physical Appearance" id="p-app" value={persona.appearance || ''} onChange={e => setPersona({...persona, appearance: e.target.value})} rows={3} placeholder="Describe their looks, clothing, and distinct features..." />
              <Textarea label="Backstory & Personality" id="p-desc" value={persona.description || ''} onChange={e => setPersona({...persona, description: e.target.value})} rows={5} placeholder="What drives them? What are their flaws and strengths?" />
            </div>
          )}

          {activeType === 'RESEARCH' && (
            <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
              <div className="bg-gradient-to-br from-[var(--accent-color)]/20 to-transparent p-8 rounded-3xl border border-[var(--accent-color)]/20 shadow-xl">
                <h3 className="text-2xl font-bold text-[var(--accent-color)] mb-3">Canon Research Engine</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">Gather encyclopedic canon knowledge for any franchise. This data will be saved as a structured <code>.ssrf</code> file.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input label="" id="r-prompt" value={researchPrompt} onChange={e => setResearchPrompt(e.target.value)} placeholder="Franchise Name (e.g. Middle Earth, Star Trek...)" className="flex-1" />
                  <Button onClick={handleRunResearch} disabled={isResearching || !researchPrompt.trim()} className="mt-1">
                    {isResearching ? (
                      <div className="flex items-center gap-2"><Spinner className="w-4 h-4" /> Investigating...</div>
                    ) : 'Run Global Research'}
                  </Button>
                </div>
              </div>

              {research.sections.length > 0 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{research.title}</h3>
                    <Button variant="ghost" onClick={() => setResearch({id: 'new', title: '', sections: []})} className="text-red-500 hover:bg-red-500/10">Clear Results</Button>
                  </div>
                  {research.sections.map((sec, sIdx) => (
                    <div key={sec.id} className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200 dark:border-white/10 group">
                      <div className="flex items-center justify-between mb-4">
                        <input 
                            className="bg-transparent text-xl font-bold text-[var(--accent-color)] outline-none border-b border-transparent focus:border-[var(--accent-color)] w-full max-w-md"
                            value={sec.title} 
                            onChange={e => {
                                const newSecs = [...research.sections];
                                newSecs[sIdx].title = e.target.value;
                                setResearch({...research, sections: newSecs});
                            }} 
                        />
                        <button 
                            onClick={() => {
                                const newSecs = [...research.sections];
                                newSecs.splice(sIdx, 1);
                                setResearch({...research, sections: newSecs});
                            }}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            Delete Section
                        </button>
                      </div>
                      <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
                        {sec.items.map((item, iIdx) => (
                          <div key={item.id} className="flex gap-3 group/item">
                            <span className="text-slate-400 mt-1">•</span>
                            <textarea 
                              className="flex-1 bg-transparent border-none text-sm text-slate-700 dark:text-slate-300 outline-none resize-none focus:text-slate-900 dark:focus:text-white"
                              value={item.content} 
                              rows={1}
                              onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = target.scrollHeight + 'px';
                              }}
                              onChange={e => {
                                const newSecs = [...research.sections];
                                newSecs[sIdx].items[iIdx].content = e.target.value;
                                setResearch({...research, sections: newSecs});
                              }} 
                            />
                            <button onClick={() => {
                              const newSecs = [...research.sections];
                              newSecs[sIdx].items.splice(iIdx, 1);
                              setResearch({...research, sections: newSecs});
                            }} className="text-slate-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100">&times;</button>
                          </div>
                        ))}
                        <button 
                            onClick={() => {
                                const newSecs = [...research.sections];
                                newSecs[sIdx].items.push({ id: Math.random().toString(), content: '' });
                                setResearch({...research, sections: newSecs});
                            }} 
                            className="text-xs text-[var(--accent-color)] font-bold hover:underline"
                        >
                            + Add Point
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button variant="secondary" onClick={() => setResearch({...research, sections: [...research.sections, { id: Math.random().toString(), title: 'New Topic Section', items: [] }]})} className="w-full py-4 border-dashed">+ Create Manual Section</Button>
                </div>
              )}
            </div>
          )}

          {activeType === 'BOOK' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
                <h3 className="text-2xl font-bold text-[var(--accent-color)]">Book Architect</h3>
                <span className="text-xs font-mono text-slate-500">FORMAT: SSBF V1.0</span>
              </div>
              <Input label="Full Book Title" id="b-title" value={book.title || ''} onChange={e => setBook({...book, title: e.target.value})} placeholder="The Chronicles of..." />
              <div className="space-y-6">
                <h4 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    Chapter List
                    <span className="text-xs bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-full">{book.chapters?.length || 0} Total</span>
                </h4>
                <div className="space-y-6">
                  {book.chapters?.map((ch, idx) => (
                    <div key={ch.id} className="bg-white/60 dark:bg-black/40 p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm group">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Section {idx + 1}</span>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    const newChs = book.chapters ? [...book.chapters] : [];
                                    if (idx > 0) {
                                        [newChs[idx], newChs[idx-1]] = [newChs[idx-1], newChs[idx]];
                                        setBook({...book, chapters: newChs});
                                    }
                                }}
                                className="text-slate-400 hover:text-[var(--accent-color)] opacity-0 group-hover:opacity-100"
                                disabled={idx === 0}
                            >
                                ↑
                            </button>
                            <button 
                                onClick={() => {
                                    const newChs = book.chapters ? [...book.chapters] : [];
                                    newChs.splice(idx, 1);
                                    setBook({...book, chapters: newChs});
                                }} 
                                className="text-red-500 hover:text-red-600 text-xs font-bold opacity-0 group-hover:opacity-100"
                            >
                                DELETE
                            </button>
                        </div>
                      </div>
                      <Textarea label="" id={`ch-${idx}`} value={ch.content} onChange={e => {
                        const newChs = book.chapters ? [...book.chapters] : [];
                        newChs[idx] = { ...newChs[idx], content: e.target.value };
                        setBook({...book, chapters: newChs});
                      }} rows={8} className="!bg-white/20" />
                    </div>
                  ))}
                </div>
                <Button variant="secondary" onClick={() => setBook({...book, chapters: [...(book.chapters || []), { id: `manual-${Date.now()}`, content: 'New Chapter Content' }]})} className="w-full py-4 border-dashed">+ Append New Segment</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isResearching && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center z-50">
          <div className="relative">
              <Spinner className="w-16 h-16 text-[var(--accent-color)]" />
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-[var(--accent-color)] rounded-full animate-ping"></div>
              </div>
          </div>
          <p className="mt-8 font-bold text-xl text-slate-900 dark:text-white">Analyzing Multiverse Databases...</p>
          <p className="mt-2 text-slate-500 animate-pulse">Consulting canon wikis and repositories.</p>
        </div>
      )}
    </div>
  );
};

export default FileEditor;
