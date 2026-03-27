
import { Book, Chapter, Persona } from "../types";

const BOOKS_KEY = 'storyspark-guest-books';
const PERSONAS_KEY = 'storyspark-personas';

export const getGuestBooks = (): Book[] => {
  const data = localStorage.getItem(BOOKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const createGuestBook = (bookData: Omit<Book, 'id'>): Book => {
  const books = getGuestBooks();
  const newBook: Book = { ...bookData, id: `guest-${Date.now()}` };
  books.push(newBook);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  return newBook;
};

export const updateGuestBook = (updatedBook: Book) => {
  const books = getGuestBooks();
  const index = books.findIndex(b => b.id === updatedBook.id);
  if (index !== -1) {
    books[index] = updatedBook;
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  }
};

export const deleteGuestBook = (id: string) => {
  const books = getGuestBooks().filter(b => b.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

export const clearGuestBooks = () => {
  localStorage.removeItem(BOOKS_KEY);
};

export const saveGuestChapter = (bookId: string, chapter: Chapter) => {
    const books = getGuestBooks();
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex !== -1) {
        const chapterIndex = books[bookIndex].chapters.findIndex(c => c.id === chapter.id);
        if (chapterIndex !== -1) {
            books[bookIndex].chapters[chapterIndex] = chapter;
        } else {
            books[bookIndex].chapters.push(chapter);
        }
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
};

export const deleteGuestChapter = (bookId: string, chapterId: string) => {
    const books = getGuestBooks();
    const bookIndex = books.findIndex(b => b.id === bookId);
    if (bookIndex !== -1) {
        books[bookIndex].chapters = books[bookIndex].chapters.filter(c => c.id !== chapterId);
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }
};

// Persona Management
export const getPersonas = (): Persona[] => {
    const data = localStorage.getItem(PERSONAS_KEY);
    return data ? JSON.parse(data) : [];
};

export const savePersona = (persona: Persona) => {
    const personas = getPersonas();
    if (persona.id) {
        const index = personas.findIndex(p => p.id === persona.id);
        if (index !== -1) personas[index] = persona;
    } else {
        persona.id = `persona-${Date.now()}`;
        personas.push(persona);
    }
    localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
};

export const deletePersona = (id: string) => {
    const personas = getPersonas().filter(p => p.id !== id);
    localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
};
