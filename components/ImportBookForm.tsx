
import React, { useState, useRef, useEffect } from 'react';
import { BookRequest, BookType, BookLength, OriginalBookRequest, Chapter, Book, ChapterLength } from '../types';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import Select from './ui/Select';
import { useModal } from '../contexts/ModalContext';
import Spinner from './ui/Spinner';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import mammoth from 'mammoth';

interface ImportBookFormProps {
  onSubmit: (request: BookRequest, initialChapters: Chapter[], promptHistory: string[]) => void;
  onBack: () => void;
  pendingImport?: any;
  onClearPendingImport?: () => void;
}

const ImportBookForm: React.FC<ImportBookFormProps> = ({ onSubmit, onBack, pendingImport, onClearPendingImport }) => {
  const importedTextState = useState('');
  const importedText = importedTextState[0];
  const setImportedText = importedTextState[1];

  const continuationPromptState = useState('');
  const continuationPrompt = continuationPromptState[0];
  const setContinuationPrompt = continuationPromptState[1];

  const bookLengthState = useState<BookLength>(BookLength.Medium);
  const bookLength = bookLengthState[0];
  const setBookLength = bookLengthState[1];

  // Added state for chapterLength in Import form
  const [chapterLength, setChapterLength] = useState<ChapterLength>(ChapterLength.Medium);

  const fileNameState = useState('');
  const fileName = fileNameState[0];
  const setFileName = fileNameState[1];

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const ssbfDataState = useState<Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'> | null>(null);
  const ssbfData = ssbfDataState[0];
  const setSsbfData = ssbfDataState[1];

  const isParsingState = useState(false);
  const isParsing = isParsingState[0];
  const setIsParsing = isParsingState[1];

  const { showModal } = useModal();

  useEffect(() => {
    // Initialize PDF.js worker
    // Handle both direct ESM export and default export scenarios
    if (typeof window !== 'undefined') {
        const lib = pdfjsLib as any;
        const workerOptions = lib.GlobalWorkerOptions || lib.default?.GlobalWorkerOptions;
        
        if (workerOptions && !workerOptions.workerSrc) {
            workerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
    }
  }, []);

  // Handle Electron native book import
  useEffect(() => {
    if (pendingImport) {
        const processImport = async () => {
            try {
                const { content, extension, fileName } = pendingImport;
                
                setFileName(fileName || 'Native Import');
                setIsParsing(true);
                setSsbfData(null); // Reset existing data

                if (extension === '.ssbf') {
                    const parsedData = JSON.parse(content);
                    if (parsedData.format === 'storyspark-book-file' && parsedData.request && parsedData.chapters) {
                        setSsbfData(parsedData);
                        const titleMatch = parsedData.chapters[0]?.content?.match(/^#\s(.*?)$/m);
                        const bookTitle = titleMatch ? `'${titleMatch[1]}'` : `'${fileName}'`;
                        setImportedText(`Successfully loaded ${bookTitle}. This file contains ${parsedData.chapters.length} chapter(s). Fine-tune settings below if needed, then click 'Import Book'.`);
                        setContinuationPrompt(parsedData.request.plot || '');
                        if (parsedData.request.bookLength) setBookLength(parsedData.request.bookLength);
                        if (parsedData.request.chapterLength) setChapterLength(parsedData.request.chapterLength);
                    }
                } else if (extension === '.pdf') {
                    const buffer = new Uint8Array(content.data || content).buffer;
                    const text = await readPdfFromBuffer(buffer);
                    setImportedText(text);
                } else if (extension === '.docx') {
                    const buffer = new Uint8Array(content.data || content).buffer;
                    const text = await readDocxFromBuffer(buffer);
                    setImportedText(text);
                } else {
                    setImportedText(content);
                }
            } catch (e) {
                console.error('Failed to parse pending book import:', e);
                showModal({ title: 'Import Error', message: 'Failed to process the native file import.', confirmText: 'OK' });
            } finally {
                setIsParsing(false);
                if (onClearPendingImport) onClearPendingImport();
            }
        };
        processImport();
    }
  }, [pendingImport, onClearPendingImport, showModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (ssbfData) {
        // If we have ssbf data, we import it directly
        onSubmit(ssbfData.request, ssbfData.chapters, ssbfData.promptHistory || []);
        return;
    }

    if (!importedText.trim() || !continuationPrompt.trim()) {
      showModal({
        title: 'Missing Information',
        message: 'Please provide your book content and a prompt for what should happen next.',
        confirmText: 'OK',
      });
      return;
    }

    // Fixed: Added missing required chapterLength property to OriginalBookRequest
    const request: OriginalBookRequest = {
      type: BookType.Original,
      plot: continuationPrompt,
      bookLength,
      chapterLength,
    };

    // Auto-detect and split chapters
    const chapterMarkerRegex = /(?=^#+\s*Chapter|^Chapter\s)/mi;
    let contentChunks = importedText
      .split(chapterMarkerRegex)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0);

    let initialChapters: Chapter[];

    if (contentChunks.length <= 1) {
      // No chapters detected, or only one block of text. Treat as a single piece.
      initialChapters = [
        { id: `imported-${Date.now()}`, content: `# Imported Content\n\n${importedText}` }
      ];
    } else {
      // If the first chunk is a title/intro (doesn't start with a chapter marker),
      // merge it with the first actual chapter.
      const firstChunkIsChapter = /^(#+\s*Chapter|Chapter\s)/mi.test(contentChunks[0]);
      if (!firstChunkIsChapter) {
        const titleAndFirstChapter = `${contentChunks[0]}\n\n${contentChunks[1]}`;
        const remainingChapters = contentChunks.slice(2);
        contentChunks = [titleAndFirstChapter, ...remainingChapters];
      }

      // Chapters detected. Map each chunk to a Chapter object.
      initialChapters = contentChunks.map((content, index) => ({
        id: `imported-chapter-${Date.now()}-${index}`,
        content: content,
      }));
    }


    onSubmit(request, initialChapters, []);
  };

  const readPdfFromBuffer = async (buffer: ArrayBuffer): Promise<string> => {
      const lib = pdfjsLib as any;
      const getDocument = lib.getDocument || lib.default?.getDocument;
      
      if (!getDocument) {
          throw new Error("PDF.js library not loaded correctly. Please try refreshing the page.");
      }

      const pdf = await getDocument({ data: buffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
      }
      return fullText;
  };

  const readDocxFromBuffer = async (buffer: ArrayBuffer): Promise<string> => {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
  };

  const readPdf = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      return readPdfFromBuffer(arrayBuffer);
  };

  const readDocx = async (file: File): Promise<string> => {
      const arrayBuffer = await file.arrayBuffer();
      return readDocxFromBuffer(arrayBuffer);
  };

  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSsbfData(null); // Reset on new file select
    setIsParsing(true);
    setImportedText('');

    try {
        if (file.name.toLowerCase().endsWith('.ssbf')) {
             const text = await file.text();
             try {
                const parsedData = JSON.parse(text);
                if (parsedData.format === 'storyspark-book-file' && parsedData.request && parsedData.chapters) {
                    setSsbfData(parsedData);
                    const titleMatch = parsedData.chapters[0]?.content?.match(/^#\s(.*?)$/m);
                    const bookTitle = titleMatch ? `'${titleMatch[1]}'` : `'${file.name}'`;
                    setImportedText(`Successfully loaded ${bookTitle}. This file contains ${parsedData.chapters.length} chapter(s). Click 'Import Book' to add it to your library.`);
                    setContinuationPrompt(parsedData.request.plot);
                } else {
                    throw new Error('Invalid .ssbf file format.');
                }
             } catch (e) {
                 throw new Error('Failed to parse SSBF file.');
             }
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
            const text = await readPdf(file);
            setImportedText(text);
        } else if (file.name.toLowerCase().endsWith('.docx')) {
            const text = await readDocx(file);
            setImportedText(text);
        } else if (file.name.toLowerCase().endsWith('.doc')) {
             throw new Error("Old Word formats (.doc) are not supported. Please convert to .docx");
        } else {
             // Default to text
             const text = await file.text();
             setImportedText(text);
        }
    } catch (error) {
        console.error("Import error:", error);
        showModal({
            title: 'Import Error',
            message: `Could not read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            confirmText: 'OK',
        });
        setFileName('');
        e.target.value = ''; // Reset input
    } finally {
        setIsParsing(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto bg-white/40 dark:bg-slate-800/50 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Import and Continue Your Book</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
             <Textarea
              id="imported-text"
              label="Paste your existing book content here"
              value={importedText}
              onChange={(e) => setImportedText(e.target.value)}
              placeholder="Paste the full text of your work in progress..."
              required
              rows={15}
              cornerHint={fileName && <span className="text-sm text-slate-500 dark:text-slate-400">Loaded: {fileName}</span>}
              disabled={!!ssbfData || isParsing}
            />
            {isParsing && (
                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/50 flex flex-col items-center justify-center backdrop-blur-sm rounded-md border border-slate-300 dark:border-slate-600">
                    <Spinner />
                    <p className="mt-4 text-amber-500 font-semibold">Reading file...</p>
                </div>
            )}
        </div>
        
        <p className="text-xs text-slate-500 -mt-4 pl-1">
          Pro-tip: The app will automatically split your text into chapters based on lines starting with "Chapter..." or "## Chapter...".
        </p>
        
        <div className="flex items-center gap-4 py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="text-slate-400 text-sm font-semibold">OR</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        <div>
            <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.ssbf,text/plain,text/markdown,application/json,.pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <Button type="button" variant="secondary" onClick={handleFileImportClick} className="w-full" disabled={isParsing}>
                {isParsing ? 'Processing...' : 'Import from .ssbf, .pdf, .docx, .txt'}
            </Button>
        </div>


        <Textarea
          id="continuation-prompt"
          label="What should happen next?"
          value={continuationPrompt}
          onChange={(e) => setContinuationPrompt(e.target.value)}
          placeholder="Based on the text above, guide the AI. e.g., 'Introduce a character who knows the secret of the ancient map. They should be reluctant to help at first...'"
          required
          rows={5}
          disabled={!!ssbfData || isParsing}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
                id="bookLength"
                label="Target Book Length"
                value={bookLength}
                onChange={(e) => setBookLength(e.target.value as BookLength)}
                disabled={!!ssbfData || isParsing}
            >
                <option value={BookLength.Small}>Small (5-10 Chapters)</option>
                <option value={BookLength.Medium}>Medium (10-30 Chapters)</option>
                <option value={BookLength.Long}>Long (30-100 Chapters)</option>
                <option value={BookLength.Infinite}>Infinite (Ongoing Series)</option>
            </Select>

            {/* Added prose length selection for Import mode */}
            <Select 
                id="chapterLength" 
                label="Prose Length" 
                value={chapterLength} 
                onChange={(e) => setChapterLength(e.target.value as ChapterLength)}
                disabled={!!ssbfData || isParsing}
            >
                <option value={ChapterLength.Short}>Short (Concise)</option>
                <option value={ChapterLength.Medium}>Medium (Standard)</option>
                <option value={ChapterLength.Long}>Long (Descriptive)</option>
                <option value={ChapterLength.ExtraLong}>Extra Long (Immersive)</option>
            </Select>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="secondary" onClick={onBack} disabled={isParsing}>Back</Button>
          <Button type="submit" disabled={isParsing || (ssbfData ? false : (!importedText.trim() || !continuationPrompt.trim()))}>
            {ssbfData ? 'Import Book' : 'Import and Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ImportBookForm;
