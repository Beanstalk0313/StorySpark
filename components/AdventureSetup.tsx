import React, { useState, useEffect } from 'react';
import { BookRequest, BookType, BookLength, AdventureBookRequest, Persona, ChapterLength } from '../types';
import { GENRES, FRANCHISES } from '../constants';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Input from './ui/Input';
import { useModal } from '../contexts/ModalContext';
import { savePersona, getPersonas, deletePersona } from '../services/localStorageService';
import { exportPersona, importPersona } from '../services/fileService';

interface AdventureSetupProps {
  onSubmit: (request: BookRequest) => void;
  onPrepareResearch: (request: AdventureBookRequest) => void;
  onBack: () => void;
}

const AdventureSetup: React.FC<AdventureSetupProps> = ({ onSubmit, onPrepareResearch, onBack }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [savedPersonas, setSavedPersonas] = useState<Persona[]>([]);
  
  const [personaId, setPersonaId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [appearance, setAppearance] = useState('');
  const [description, setDescription] = useState('');

  const [storyType, setStoryType] = useState<'ORIGINAL' | 'CONTINUATION'>('ORIGINAL');
  const [plot, setPlot] = useState('');
  const [series, setSeries] = useState(FRANCHISES[0]);
  const [otherSeries, setOtherSeries] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [customAuthor, setCustomAuthor] = useState('');
  const [bookLength, setBookLength] = useState<BookLength>(BookLength.Medium);
  const [chapterLength, setChapterLength] = useState<ChapterLength>(ChapterLength.Medium);

  const [crossovers, setCrossovers] = useState<string[]>([]);
  const [selectedCrossover, setSelectedCrossover] = useState(FRANCHISES[0]);
  const [otherCrossover, setOtherCrossover] = useState('');
  const [showCrossoverInput, setShowCrossoverInput] = useState(false);

  const { showModal } = useModal();

  useEffect(() => { refreshPersonas(); }, []);

  const refreshPersonas = () => { setSavedPersonas(getPersonas()); };

  const loadPersona = (p: Persona) => {
      setPersonaId(p.id);
      setName(p.name);
      setAge(p.age);
      setGender(p.gender);
      setAppearance(p.appearance || '');
      setDescription(p.description || '');
  };

  const handleNewPersona = () => {
      setPersonaId(undefined);
      setName('');
      setAge('');
      setGender('');
      setAppearance('');
      setDescription('');
  };

  const handleSavePersona = () => {
      if (!name) return;
      savePersona({ id: personaId, name, age, gender, appearance, description });
      refreshPersonas();
      alert('Character Profile Saved!');
  };

  const handleDeletePersona = (id: string) => {
      if(confirm('Delete this character profile?')) {
          deletePersona(id);
          refreshPersonas();
          handleNewPersona();
      }
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
                  loadPersona({ ...p, id: undefined });
              } catch(err) {
                  alert('Invalid character file.');
              }
          }
      };
      input.click();
  };

  const handleExport = () => {
      if(!name) return;
      exportPersona({ name, age, gender, appearance, description });
  };

  const handleNextStep = () => {
      if (!name || !age || !gender) {
          showModal({ title: 'Missing Info', message: 'Name, Age, and Gender are required to start the RPG.', confirmText: 'OK' });
          return;
      }
      setStep(2);
  };

  const handleAddCrossover = () => {
      const val = selectedCrossover === 'Other' ? otherCrossover.trim() : selectedCrossover;
      if (!val) return;
      if (!crossovers.includes(val)) {
          setCrossovers([...crossovers, val]);
      }
      setShowCrossoverInput(false);
      setOtherCrossover('');
      setSelectedCrossover(FRANCHISES[0]);
  };

  const removeCrossover = (val: string) => {
      setCrossovers(crossovers.filter(c => c !== val));
  };

  const buildRequest = (): AdventureBookRequest => {
      const isOtherSeries = series === 'Other';
      const persona: Persona = { name, age, gender, appearance, description };
      return {
        type: BookType.Adventure,
        storyType,
        persona,
        plot,
        bookLength,
        chapterLength,
        genre: storyType === 'ORIGINAL' ? genre : undefined,
        series: storyType === 'CONTINUATION' ? (isOtherSeries ? otherSeries : series) : undefined,
        crossovers,
        customAuthor: customAuthor.trim() || undefined
      };
  };

  const handleStartLab = (e: React.FormEvent) => {
      e.preventDefault();
      const isOtherSeries = series === 'Other';
      if (!plot.trim() || (storyType === 'CONTINUATION' && isOtherSeries && !otherSeries.trim())) {
        showModal({ title: 'Missing Information', message: 'Please define your starting scenario.', confirmText: 'OK' });
        return;
      }
      onPrepareResearch(buildRequest());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isOtherSeries = series === 'Other';
    if (!plot.trim() || (storyType === 'CONTINUATION' && isOtherSeries && !otherSeries.trim())) {
      showModal({ title: 'Missing Information', message: 'Please define your starting scenario.', confirmText: 'OK' });
      return;
    }
    onSubmit(buildRequest());
  };

  return (
    <div className="max-w-4xl mx-auto bg-white/40 dark:bg-slate-800/50 p-6 md:p-10 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in">
      <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">AI RPG Setup</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Define your Hero and prepare for an reactive adventure.</p>
      
      {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 border-r border-slate-200 dark:border-slate-700 pr-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Saved Heroes</h3>
                      <button onClick={handleNewPersona} className="text-xs bg-[var(--accent-color)] text-white px-2 py-1 rounded hover:opacity-90">+ New</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto mb-4 custom-scrollbar pr-2">
                      {savedPersonas.map(p => (
                          <div key={p.id} className={`p-3 rounded-xl cursor-pointer flex justify-between group border transition-all ${personaId === p.id ? 'bg-[var(--accent-color)]/10 border-[var(--accent-color)]/30' : 'bg-white/40 dark:bg-white/5 border-transparent hover:border-slate-300 dark:hover:border-white/10'}`} onClick={() => loadPersona(p)}>
                              <span className={`font-bold text-sm ${personaId === p.id ? 'text-[var(--accent-color)]' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); handleDeletePersona(p.id!); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:scale-110 transition-transform">&times;</button>
                          </div>
                      ))}
                      {savedPersonas.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">No characters found.</p>}
                  </div>
                  <div className="flex gap-2"><Button variant="secondary" onClick={handleImport} className="w-full text-xs">Import (.sspf)</Button></div>
              </div>
              <div className="md:col-span-2 space-y-5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--accent-color)] uppercase tracking-widest text-xs">Character Stats</h3>
                    <div className="flex gap-2"><Button variant="ghost" onClick={handleExport} className="text-xs" disabled={!name}>Export</Button><Button variant="ghost" onClick={handleSavePersona} className="text-xs" disabled={!name}>Save Profile</Button></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4"><Input label="Name" id="p-name" value={name} onChange={e => setName(e.target.value)} placeholder="Protagonist name" required /><Input label="Age" id="p-age" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 24" required /></div>
                  <Select label="Gender" id="p-gender" value={gender} onChange={e => setGender(e.target.value)} required><option value="" disabled>Select Gender</option><option value="Male">Male</option><option value="Female">Female</option></Select>
                  <Input label="Visual Appearance" id="p-appearance" value={appearance} onChange={e => setAppearance(e.target.value)} placeholder="Hair, eyes, distinct clothing..." />
                  <Textarea label="Backstory & Skills" id="p-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Personality, combat skills, magic, fears..." rows={4} />
                  <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-white/10 mt-4"><Button variant="secondary" onClick={onBack}>Cancel</Button><Button onClick={handleNextStep}>Enter the World</Button></div>
              </div>
          </div>
      )}

      {step === 2 && (
          <form className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <h3 className="text-lg font-bold text-[var(--accent-color)] uppercase tracking-widest text-xs border-b border-slate-200 dark:border-slate-700 pb-2">Adventure Parameters</h3>
               <div className="flex gap-4 mb-4">
                  <button type="button" onClick={() => setStoryType('ORIGINAL')} className={`flex-1 p-5 rounded-2xl border text-center transition-all ${storyType === 'ORIGINAL' ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg' : 'bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-slate-700'}`}>
                    <div className="font-bold">Original Campaign</div>
                    <div className="text-xs opacity-70">A brand new world</div>
                  </button>
                  <button type="button" onClick={() => setStoryType('CONTINUATION')} className={`flex-1 p-5 rounded-2xl border text-center transition-all ${storyType === 'CONTINUATION' ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg' : 'bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-slate-700'}`}>
                    <div className="font-bold">Fan-Fic RPG</div>
                    <div className="text-xs opacity-70">Play in a known universe</div>
                  </button>
              </div>
              {storyType === 'ORIGINAL' ? (
                   <Select label="Setting Genre" id="adv-genre" value={genre} onChange={e => setGenre(e.target.value)}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</Select>
              ) : (
                  <><Select label="World Franchise" id="adv-series" value={series} onChange={e => setSeries(e.target.value)}>{FRANCHISES.map(s => <option key={s} value={s}>{s}</option>)}</Select>{series === 'Other' && <Input label="Specify World" id="adv-other" value={otherSeries} onChange={e => setOtherSeries(e.target.value)} required />}</>
              )}
              
              <Input label="Mimic Author Style (Optional)" id="adv-author" value={customAuthor} onChange={e => setCustomAuthor(e.target.value)} placeholder="e.g. Stephen King, Brandon Sanderson..." />

              <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider text-xs">Crossover/Inspiration</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                      {crossovers.map(c => (
                          <span key={c} className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 shadow-sm">{c}<button type="button" onClick={() => removeCrossover(c)} className="ml-2 hover:text-red-500 transition-colors">&times;</button></span>
                      ))}
                  </div>
                  {!showCrossoverInput ? (
                      <Button type="button" variant="ghost" onClick={() => setShowCrossoverInput(true)} className="text-xs !px-0">+ Add Crossover Source</Button>
                  ) : (
                      <div className="flex flex-col gap-3 p-4 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <Select label="Select Source" id="cross-sel" value={selectedCrossover} onChange={e => setSelectedCrossover(e.target.value)}>{FRANCHISES.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                          {selectedCrossover === 'Other' && <Input label="Specify" id="cross-other" value={otherCrossover} onChange={e => setOtherCrossover(e.target.value)} required />}
                          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setShowCrossoverInput(false)} className="text-xs">Cancel</Button><Button type="button" onClick={handleAddCrossover} className="text-xs">Add Inspiration</Button></div>
                      </div>
                  )}
              </div>
              <Textarea id="adv-plot" label="Scenario Start / Location" value={plot} onChange={e => setPlot(e.target.value)} placeholder="e.g. I wake up in the hold of a sinking ship..." required rows={4} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select id="bookLength" label="Campaign Scope" value={bookLength} onChange={(e) => setBookLength(e.target.value as BookLength)}><option value={BookLength.Small}>One-Shot (5-10 Turns)</option><option value={BookLength.Medium}>Adventure (10-30 Turns)</option><option value={BookLength.Long}>Epic Saga (30-100 Turns)</option><option value={BookLength.Infinite}>Open-World Sandbox</option></Select>
                <Select id="chapterLength" label="Prose Length" value={chapterLength} onChange={(e) => setChapterLength(e.target.value as ChapterLength)}>
                    <option value={ChapterLength.Short}>Short (Concise)</option>
                    <option value={ChapterLength.Medium}>Medium (Standard)</option>
                    <option value={ChapterLength.Long}>Long (Descriptive)</option>
                    <option value={ChapterLength.ExtraLong}>Extra Long (Immersive)</option>
                </Select>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-white/10">
                  <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleStartLab}>Lore Research Lab</Button>
                    <Button type="button" onClick={handleSubmit} className="px-8 shadow-xl shadow-[var(--accent-color)]/20">Begin AI RPG</Button>
                  </div>
              </div>
          </form>
      )}
    </div>
  );
};
export default AdventureSetup;