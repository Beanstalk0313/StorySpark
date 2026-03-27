
import React from 'react';
import { BookType, AIProvider, User, Book, OriginalBookRequest, AdventureBookRequest } from '../types';
import Button from './ui/Button';
import { isElectron } from '../services/electronService';

interface HomeScreenProps {
  user: User;
  books: Book[];
  onSelectType: (type: BookType) => void;
  onGoToImport: () => void;
  onSelectBook: (book: Book) => void;
  isContentHidden: boolean;
  onToggleHidden: (isHidden: boolean) => void;
  onDeleteBook: (bookId: string) => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  onGoToFileEditor: () => void;
  onGoToPerchance: () => void;
  onGoToChat: () => void;
}

interface ChoiceCardProps {
  title: string;
  description: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  delay?: string;
  accent?: boolean;
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ title, description, onClick, icon, disabled, delay = '0s', accent }) => {
  return (
    <div 
        onClick={!disabled ? onClick : undefined}
        style={{ animationDelay: delay }}
        className={`animate-fade-in relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/40 dark:border-white/10 transition-all duration-500 flex flex-col items-center text-center group ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-2'}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-color)] opacity-0 group-hover:opacity-5 transition-all duration-500"></div>
        
        <div className={`relative z-10 mb-6 text-slate-500 dark:text-slate-400 ${!disabled && 'group-hover:text-[var(--accent-color)]'} transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3`}>
            {icon}
        </div>
        <h3 className="relative z-10 text-xl md:text-2xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">{title}</h3>
        <p className="relative z-10 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">{description}</p>
    </div>
  );
};

interface BookListItemProps {
  book: Book;
  onSelect: () => void;
  onDelete: () => void;
  index: number;
}

const BookListItem: React.FC<BookListItemProps> = ({ book, onSelect, onDelete, index }) => {
    const getTitle = () => {
        if (book.title) return book.title;
        if (book.chapters && book.chapters.length > 0) {
            const match = book.chapters[0].content.match(/^#\s(.*?)$/m);
            if (match) return match[1];
        }
        return book.request.plot.substring(0, 50) + '...';
    };

    const chapterCount = book.chapterCount ?? (book.chapters ? book.chapters.length : 0);
    const type = book.request.type;
    
    let label = 'Original';
    if (type === BookType.Continuation) label = 'Fan-Fic';
    if (type === BookType.Adventure) {
        label = 'RPG';
    }

    const labelClass = type === BookType.Adventure 
        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 border-amber-200 dark:border-amber-700'
        : 'bg-slate-200/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/5';

    return (
        <div 
            style={{ animationDelay: `${index * 0.1}s` }}
            className="animate-fade-in bg-white/40 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/40 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:bg-white/60 dark:hover:bg-white/10 hover:border-white/60 dark:hover:border-white/20 hover:shadow-lg group"
        >
            <div className="flex-grow">
                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-[var(--accent-color)] transition-colors">
                    {getTitle()}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-xs border ${labelClass}`}>
                        {label}
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{chapterCount} {type === BookType.Adventure ? 'Turn' : 'Chapter'}{chapterCount !== 1 ? 's' : ''}</span>
                </p>
            </div>
            <div className="flex w-full sm:w-auto gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-white/5">
                <Button onClick={onSelect} className="flex-1 sm:flex-none text-sm px-6">Continue</Button>
                <Button onClick={onDelete} variant="ghost" className="!p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 rounded-full" aria-label="Delete book">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                </Button>
            </div>
        </div>
    );
};


const HomeScreen: React.FC<HomeScreenProps> = ({ user, books, onSelectType, onGoToImport, onSelectBook, isContentHidden, onToggleHidden, onDeleteBook, onGoToFileEditor, onGoToPerchance, onGoToChat }) => {

  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center text-center">

      <div className="mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white tracking-tight">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-color)] to-orange-600 dark:from-[var(--accent-color)] dark:to-orange-500">{user.displayName?.split(' ')[0] || 'Writer'}</span>
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Ready to continue your journey or start a new project?
          </p>
      </div>
      
      {books.length > 0 && (
          <div className="w-full mb-16">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-6 px-1 gap-4">
                  <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Your Adventures</h3>
                      <span className="text-sm text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/5">{books.length} Project{books.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white/40 dark:bg-white/5 px-3 py-1.5 rounded-full border border-white/40 dark:border-white/10 backdrop-blur-sm">
                      <label htmlFor="surprise-toggle" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">Surprise Mode (Hide Content)</label>
                      <button 
                        id="surprise-toggle"
                        onClick={() => onToggleHidden(!isContentHidden)}
                        className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${isContentHidden ? 'bg-[var(--accent-color)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                      >
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isContentHidden ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                  </div>
              </div>
              <div className="space-y-4">
                {books.map((book, idx) => (
                    <BookListItem key={book.id} book={book} onSelect={() => onSelectBook(book)} onDelete={() => onDeleteBook(book.id)} index={idx} />
                ))}
              </div>
          </div>
      )}

      <div className="w-full mb-12">
        <h3 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white">{books.length > 0 ? 'Explore Tools' : 'Start Your First Adventure'}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-10">
            {isElectron() && (
                <>
                <ChoiceCard 
                    title="Perchance AI Story"
                    description="Write with the specialized Perchance Story Generator. (Desktop Exclusive)"
                    onClick={onGoToPerchance}
                    delay="0s"
                    accent
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />
                <ChoiceCard 
                    title="AI Chat"
                    description="Chat with your characters or general AI. (Desktop Exclusive)"
                    onClick={onGoToChat}
                    delay="0.05s"
                    accent
                    icon={
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Experimental</span>
                        </div>
                    }
                />
                </>
            )}
            <ChoiceCard 
                title="AI RPG"
                description="Interactive adventure. You are the protagonist in a world that reacts to your every move."
                onClick={() => onSelectType(BookType.Adventure)}
                delay="0s"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                }
            />
            <ChoiceCard 
                title="Original Book"
                description="Craft a brand new world. You provide the sparks, AI builds the narrative."
                onClick={() => onSelectType(BookType.Original)}
                delay="0.1s"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                }
            />
            <ChoiceCard 
                title="Fan Fiction"
                description="Write sequels, prequels, or alternate universes for your favorite Books, TV, Movies, or Games."
                onClick={() => onSelectType(BookType.Continuation)}
                delay="0.2s"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                }
            />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 w-full">
            <ChoiceCard 
                title="File Laboratory"
                description="Manage personas, lore research, and book files. Run standalone Lore generation."
                onClick={onGoToFileEditor}
                delay="0.3s"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                }
            />
            <ChoiceCard 
                title="Import & Continue"
                description="Upload a .ssbf, Word doc, or PDF to pick up where you left off."
                onClick={onGoToImport}
                delay="0.4s"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }
            />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
