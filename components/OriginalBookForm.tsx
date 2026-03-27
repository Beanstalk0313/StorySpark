import React, { useState } from 'react';
import { BookRequest, BookType, BookLength, OriginalBookRequest, ChapterLength } from '../types';
import { GENRES, FRANCHISES } from '../constants';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import Input from './ui/Input';
import { useModal } from '../contexts/ModalContext';

interface OriginalBookFormProps {
  onSubmit: (request: BookRequest) => void;
  onPrepareResearch: (request: OriginalBookRequest) => void;
  onBack: () => void;
}

const OriginalBookForm: React.FC<OriginalBookFormProps> = ({ onSubmit, onPrepareResearch, onBack }) => {
  const [plot, setPlot] = useState('');
  const [bookLength, setBookLength] = useState<BookLength>(BookLength.Medium);
  const [chapterLength, setChapterLength] = useState<ChapterLength>(ChapterLength.Medium);
  const [genre, setGenre] = useState(GENRES[0]);
  const [customAuthor, setCustomAuthor] = useState('');
  
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

  const buildRequest = (): OriginalBookRequest => ({
      type: BookType.Original, 
      plot, 
      bookLength, 
      chapterLength, 
      genre, 
      crossovers,
      customAuthor: customAuthor.trim() || undefined
  });

  const handlePrepareLab = (e: React.FormEvent) => {
      e.preventDefault();
      if (!plot.trim()) {
        showModal({ title: 'Missing Information', message: 'Please describe your ideas for the book.', confirmText: 'OK' });
        return;
      }
      onPrepareResearch(buildRequest());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plot.trim()) {
      showModal({ title: 'Missing Information', message: 'Please describe your ideas for the book.', confirmText: 'OK' });
      return;
    }
    onSubmit(buildRequest());
  };

  return (
    <div className="max-w-2xl mx-auto bg-white/40 dark:bg-slate-800/50 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Create an Original Book</h2>
      <form className="space-y-6">
        <Textarea id="plot" label="What's the initial idea for your book?" value={plot} onChange={(e) => setPlot(e.target.value)} placeholder="Describe the main concept... Tip: You can include chapter-specific instructions here (e.g. 'Chapter 1: Arrival')." required />
        
        <Input label="Mimic Author Style (Optional)" id="custom-author" value={customAuthor} onChange={e => setCustomAuthor(e.target.value)} placeholder="e.g. George Orwell, HP Lovecraft..." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select id="genre" label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)}>{GENRES.map(g => <option key={g} value={g}>{g}</option>)}</Select>
            <Select id="chapterLength" label="Prose Length" value={chapterLength} onChange={(e) => setChapterLength(e.target.value as ChapterLength)}>
                <option value={ChapterLength.Short}>Short (Concise)</option>
                <option value={ChapterLength.Medium}>Medium (Standard)</option>
                <option value={ChapterLength.Long}>Long (Descriptive)</option>
                <option value={ChapterLength.ExtraLong}>Extra Long (Immersive)</option>
            </Select>
        </div>
        <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">Inspirations / Crossovers (Optional)</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {crossovers.map(c => (
                    <span key={c} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">{c}<button type="button" onClick={() => removeCrossover(c)} className="ml-2 hover:text-purple-500">&times;</button></span>
                ))}
            </div>
            {!showCrossoverInput ? (<Button type="button" variant="ghost" onClick={() => setShowCrossoverInput(true)} className="text-xs !px-0">+ Add Inspiration</Button>) : (
                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                     <Select label="Select Franchise" id="cross-sel" value={selectedCrossover} onChange={e => setSelectedCrossover(e.target.value)}>{FRANCHISES.map(s => <option key={s} value={s}>{s}</option>)}</Select>
                     {selectedCrossover === 'Other' && (<div className="mt-2"><Input label="Specify" id="cross-other" value={otherCrossover} onChange={e => setOtherCrossover(e.target.value)} /></div>)}
                     <div className="flex justify-end gap-2 mt-3"><Button type="button" variant="ghost" onClick={() => setShowCrossoverInput(false)} className="text-xs">Cancel</Button><Button type="button" onClick={handleAddCrossover} className="text-xs">Add</Button></div>
                </div>
            )}
        </div>
        <Select id="bookLength" label="Target Book Length" value={bookLength} onChange={(e) => setBookLength(e.target.value as BookLength)}><option value={BookLength.Small}>Small (5-10 Chapters)</option><option value={BookLength.Medium}>Medium (10-30 Chapters)</option><option value={BookLength.Long}>Long (30-100 Chapters)</option><option value={BookLength.Infinite}>Infinite (Ongoing Series)</option></Select>
        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
          <div className="flex gap-3">
              <Button variant="secondary" onClick={handlePrepareLab}>Prepare Research Lab</Button>
              <Button type="button" onClick={handleSubmit} disabled={!plot.trim()}>Start Writing</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default OriginalBookForm;