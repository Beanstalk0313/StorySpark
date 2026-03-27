import React, { useState } from 'react';
import { RoomState, ChapterLength } from '../../types';
import { GENRES, FRANCHISES } from '../../constants';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { useModal } from '../../contexts/ModalContext';

interface HostSetupScreenProps {
  onBack: () => void;
  onCreate: (settings: RoomState['settings']) => void;
  onPrepareResearch: (series: string, plot: string, crossovers: string[]) => void;
}

const HostSetupScreen: React.FC<HostSetupScreenProps> = ({ onBack, onCreate, onPrepareResearch }) => {
  const [storyType, setStoryType] = useState<'ORIGINAL' | 'CONTINUATION'>('ORIGINAL');
  const [plot, setPlot] = useState('');
  const [series, setSeries] = useState(FRANCHISES[0]);
  const [otherSeries, setOtherSeries] = useState('');
  const [genre, setGenre] = useState(GENRES[0]);
  const [customAuthor, setCustomAuthor] = useState('');
  const [chapterLength, setChapterLength] = useState<ChapterLength>(ChapterLength.Medium);

  const [crossovers, setCrossovers] = useState<string[]>([]);
  const [selectedCrossover, setSelectedCrossover] = useState(FRANCHISES[0]);
  const [otherCrossover, setOtherCrossover] = useState('');
  const [showCrossoverInput, setShowCrossoverInput] = useState(false);

  const { showModal } = useModal();

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

  const handleRunResearch = () => {
      const isOtherSeries = series === 'Other';
      if (!plot.trim() || (storyType === 'CONTINUATION' && isOtherSeries && !otherSeries.trim())) {
        showModal({ title: 'Missing Information', message: 'Please define your starting scenario and world first.', confirmText: 'OK' });
        return;
      }
      const primarySubject = storyType === 'CONTINUATION' ? (isOtherSeries ? otherSeries : series) : (genre || 'Original World');
      onPrepareResearch(primarySubject, plot, crossovers);
  };

  const handleSubmit = () => {
    const isOtherSeries = series === 'Other';
    if (!plot.trim() || (storyType === 'CONTINUATION' && isOtherSeries && !otherSeries.trim())) {
      showModal({ title: 'Missing Information', message: 'Please define your starting scenario.', confirmText: 'OK' });
      return;
    }

    const settings: RoomState['settings'] = {
        storyType,
        plotPremise: plot,
        chapterLength,
        genre: storyType === 'ORIGINAL' ? genre : undefined,
        series: storyType === 'CONTINUATION' ? (isOtherSeries ? otherSeries : series) : undefined,
        crossovers,
        customAuthor: customAuthor.trim() || undefined
    };
    onCreate(settings);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/40 dark:bg-slate-800/50 p-6 md:p-10 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in">
        <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">New Multiplayer Campaign</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8">Configure the world your party will explore.</p>

        <form className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-[var(--accent-color)] uppercase tracking-widest text-xs border-b border-slate-200 dark:border-slate-700 pb-2">World Parameters</h3>
            
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

            <Input label="Mimic Author Style (Optional)" id="custom-author" value={customAuthor} onChange={e => setCustomAuthor(e.target.value)} placeholder="e.g. Robert Jordan, Frank Herbert..." />

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

            <Textarea id="adv-plot" label="Scenario Start / Location" value={plot} onChange={e => setPlot(e.target.value)} placeholder="e.g. The party meets in a tavern that is actually a giant mimic..." required rows={4} />
            
            <Select id="chapterLength" label="Prose Length" value={chapterLength} onChange={(e) => setChapterLength(e.target.value as ChapterLength)}>
                <option value={ChapterLength.Short}>Short (Concise)</option>
                <option value={ChapterLength.Medium}>Medium (Standard)</option>
                <option value={ChapterLength.Long}>Long (Descriptive)</option>
                <option value={ChapterLength.ExtraLong}>Extra Long (Immersive)</option>
            </Select>

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-white/10">
                <Button variant="secondary" onClick={onBack}>Back</Button>
                <div className="flex gap-3">
                <Button variant="secondary" onClick={handleRunResearch}>Open Research Lab</Button>
                <Button type="button" onClick={handleSubmit} className="px-8 shadow-xl shadow-[var(--accent-color)]/20">Open Lobby</Button>
                </div>
            </div>
        </form>
    </div>
  );
};

export default HostSetupScreen;