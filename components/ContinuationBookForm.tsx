import React, { useState } from 'react';
import { ContinuationBookRequest, BookLength, BookType, ChapterLength } from '../types';
import { FRANCHISES } from '../constants';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Input from './ui/Input';
import { useModal } from '../contexts/ModalContext';

interface ContinuationBookFormProps {
  onPrepareResearch: (request: ContinuationBookRequest) => void;
  onBack: () => void;
}

const TIMELINE_OPTIONS = [
    'Post-Canon Sequel (Continuing the story)',
    'Pre-Canon Prequel (Before the events)',
    'Mid-Canon Divergence (Alternate history)',
    'During Canon (Side story / Missing scene)',
    'Alternate Universe (Modern AU, Coffee Shop, etc.)',
    'Crossover (Merged Worlds)'
];

const MEDIA_TYPES = [
    'Novel / Book Series',
    'TV Show',
    'Movie / Film Franchise',
    'Video Game',
    'Anime / Manga',
    'Comic Book / Graphic Novel'
];

const ContinuationBookForm: React.FC<ContinuationBookFormProps> = ({ onPrepareResearch, onBack }) => {
  const [selectedSeries, setSelectedSeries] = useState(FRANCHISES[0]);
  const [otherSeries, setOtherSeries] = useState('');
  const [plot, setPlot] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [bookLength, setBookLength] = useState<BookLength>(BookLength.Medium);
  const [chapterLength, setChapterLength] = useState<ChapterLength>(ChapterLength.Medium);
  
  // New FanFic fields
  const [fanFicContext, setFanFicContext] = useState(TIMELINE_OPTIONS[0]);
  const [mediaType, setMediaType] = useState(MEDIA_TYPES[0]);

  const [crossovers, setCrossovers] = useState<string[]>([]);
  const [selectedCrossover, setSelectedCrossover] = useState(FRANCHISES[0]);
  const [otherCrossover, setOtherCrossover] = useState('');
  const [showCrossoverInput, setShowCrossoverInput] = useState(false);

  const { showModal } = useModal();

  const handleAddCrossover = () => {
      const val = selectedCrossover === 'Other' ? otherCrossover.trim() : selectedCrossover;
      if (!val) return;
      if (!crossovers.includes(val) && val !== (selectedSeries === 'Other' ? otherSeries : selectedSeries)) {
          setCrossovers([...crossovers, val]);
      }
      setShowCrossoverInput(false);
      setOtherCrossover('');
      setSelectedCrossover(FRANCHISES[0]);
  };

  const removeCrossover = (val: string) => {
      setCrossovers(crossovers.filter(c => c !== val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isOther = selectedSeries === 'Other';
    if (!plot.trim() || (isOther && !otherSeries.trim())) {
      showModal({ title: 'Missing Information', message: 'Please fill out all required fields.', confirmText: 'OK' });
      return;
    }
    const request: ContinuationBookRequest = {
      type: BookType.Continuation,
      series: isOther ? otherSeries : selectedSeries,
      plot,
      bookLength,
      chapterLength,
      crossovers,
      customAuthor: customAuthor.trim() || undefined,
      fanFicContext,
      mediaType
    };
    onPrepareResearch(request);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/40 dark:bg-slate-800/50 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in">
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Fan Fiction Creator</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Write authentic stories set in your favorite universes.</p>
        
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-md p-3 mb-6">
            <p><strong className="font-semibold">Disclaimer:</strong> Intended for personal, non-commercial fan fiction usage. All original copyrights belong to their respective owners.</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Source Material Section */}
        <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Select id="series" label="Fandom / Universe" value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)}>{FRANCHISES.map(series => <option key={series} value={series}>{series}</option>)}</Select>
                    {selectedSeries === 'Other' && (<div className="mt-2 pl-4 border-l-2 border-[var(--accent-color)]"><Input id="other-series" label="Specify Fandom" value={otherSeries} onChange={(e) => setOtherSeries(e.target.value)} placeholder="e.g. Mass Effect" required /></div>)}
                </div>
                <div>
                    <Select id="mediaType" label="Original Media Type" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
                        {MEDIA_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                    </Select>
                </div>
            </div>

            <Input 
                label="Original Creator / Author (Critical for Style)" 
                id="custom-author" 
                value={customAuthor} 
                onChange={e => setCustomAuthor(e.target.value)} 
                placeholder="e.g. J.R.R. Tolkien, BioWare, Quentin Tarantino..." 
                className="font-bold"
            />
            <p className="text-[10px] text-slate-500 -mt-3">The AI will use this to mimic the sentence structure, vocabulary, and dialogue rhythm of the original.</p>
        </section>

        <hr className="border-slate-200 dark:border-slate-700/50" />

        {/* Crossover Section */}
        <section>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Crossovers (Optional)</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {crossovers.map(c => (
                    <span key={c} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">{c}<button type="button" onClick={() => removeCrossover(c)} className="ml-2 hover:text-indigo-500">&times;</button></span>
                ))}
            </div>
            {!showCrossoverInput ? (<Button type="button" variant="ghost" onClick={() => setShowCrossoverInput(true)} className="text-xs !px-0">+ Add Crossover Fandom</Button>) : (
                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                     <Select label="Select Crossover" id="cross-sel" value={selectedCrossover} onChange={e => setSelectedCrossover(e.target.value)}>{FRANCHISES.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                     {selectedCrossover === 'Other' && (<div className="mt-2"><Input label="Specify" id="cross-other" value={otherCrossover} onChange={e => setOtherCrossover(e.target.value)} /></div>)}
                     <div className="flex justify-end gap-2 mt-3"><Button type="button" variant="ghost" onClick={() => setShowCrossoverInput(false)} className="text-xs">Cancel</Button><Button type="button" onClick={handleAddCrossover} className="text-xs">Add</Button></div>
                </div>
            )}
        </section>

        {/* Narrative Section */}
        <section className="space-y-4">
            <Select id="timeline" label="Timeline & Context" value={fanFicContext} onChange={(e) => setFanFicContext(e.target.value)}>
                {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>

            <Textarea 
                id="plot" 
                label="Plot Concept / Scenario" 
                value={plot} 
                onChange={(e) => setPlot(e.target.value)} 
                placeholder="Describe your story idea. Mention specific characters you want to focus on, the inciting incident, and any deviations from canon." 
                required 
                rows={5}
            />
        </section>

        {/* Length Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select id="bookLength" label="Story Scope" value={bookLength} onChange={(e) => setBookLength(e.target.value as BookLength)}><option value={BookLength.Small}>One-Shot (Short Story)</option><option value={BookLength.Medium}>Novella (10-30 Chapters)</option><option value={BookLength.Long}>Epic Novel (30-100 Chapters)</option><option value={BookLength.Infinite}>Ongoing Series</option></Select>
            <Select id="chapterLength" label="Prose Depth" value={chapterLength} onChange={(e) => setChapterLength(e.target.value as ChapterLength)}>
                <option value={ChapterLength.Short}>Fast Paced (Concise)</option>
                <option value={ChapterLength.Medium}>Standard Book Style</option>
                <option value={ChapterLength.Long}>Deeply Descriptive</option>
                <option value={ChapterLength.ExtraLong}>Immersive / Slow Burn</option>
            </Select>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/10">
            <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
            <div className="flex flex-col items-end">
                <Button type="submit" disabled={!plot.trim() || (selectedSeries === 'Other' && !otherSeries.trim())} className="shadow-lg shadow-[var(--accent-color)]/20">
                    Prepare Research Lab
                </Button>
                <span className="text-[10px] text-slate-400 mt-2">Next: AI will research canon to ensure accuracy.</span>
            </div>
        </div>
      </form>
    </div>
  );
};
export default ContinuationBookForm;