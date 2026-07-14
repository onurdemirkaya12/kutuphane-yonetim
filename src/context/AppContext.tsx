import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Book, Note, ReadingStat } from '../types';

interface AppContextType {
  books: Book[];
  notes: Note[];
  stats: ReadingStat[];
  discoverBooks: Book[];
  addBook: (book: Omit<Book, 'id'>) => void;
  addBooksBulk: (booksText: string) => void;
  addNote: (content: string) => void;
  toggleFavoriteBook: (id: string) => void;
  toggleFavoriteNote: (id: string) => void;
  updateBookStatus: (id: string, status: Book['status']) => void;
}

const defaultStats: ReadingStat[] = [
  { month: 'Oca', pagesRead: 450 },
  { month: 'Şub', pagesRead: 320 },
  { month: 'Mar', pagesRead: 600 },
  { month: 'Nis', pagesRead: 410 },
  { month: 'May', pagesRead: 750 },
  { month: 'Haz', pagesRead: 500 },
];

const mockDiscover: Book[] = [
  { id: 'd1', title: 'Suç ve Ceza', author: 'Fyodor Dostoyevski', status: 'want-to-read', isFavorite: false, coverColor: 'bg-stone-800' },
  { id: 'd2', title: '1984', author: 'George Orwell', status: 'want-to-read', isFavorite: false, coverColor: 'bg-zinc-700' },
  { id: 'd3', title: 'Simyacı', author: 'Paulo Coelho', status: 'want-to-read', isFavorite: false, coverColor: 'bg-amber-700' },
  { id: 'd4', title: 'Sefiller', author: 'Victor Hugo', status: 'want-to-read', isFavorite: false, coverColor: 'bg-red-900' },
];

const initialBooks: Book[] = [
  { id: '1', title: 'Körlük', author: 'José Saramago', status: 'completed', isFavorite: true, coverColor: 'bg-neutral-600' },
  { id: '2', title: 'Martin Eden', author: 'Jack London', status: 'reading', isFavorite: false, coverColor: 'bg-slate-700' },
  { id: '3', title: 'Dönüşüm', author: 'Franz Kafka', status: 'completed', isFavorite: true, coverColor: 'bg-stone-700' },
];

const initialNotes: Note[] = [
  { id: 'n1', content: 'Ne kadar az bilirsen, o kadar iyi uyursun.', isFavoriteQuote: true, createdAt: Date.now() - 100000 },
  { id: 'n2', content: 'Gözler kördür. İnsan ancak yüreğiyle baktığı zaman gerçeği görebilir.', isFavoriteQuote: true, createdAt: Date.now() - 50000 },
  { id: 'n3', content: 'Kafka\'nın dili sade ama bir o kadar da boğucu.', isFavoriteQuote: false, createdAt: Date.now() },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  const addBook = (bookData: Omit<Book, 'id'>) => {
    const newBook: Book = { ...bookData, id: Math.random().toString(36).substring(7) };
    setBooks(prev => [newBook, ...prev]);
  };

  const addBooksBulk = (booksText: string) => {
    const lines = booksText.split('\\n').filter(line => line.trim() !== '');
    const newBooks: Book[] = lines.map(line => {
      const parts = line.split('-').map(p => p.trim());
      const title = parts[0] || 'Bilinmeyen Kitap';
      const author = parts[1] || 'Bilinmeyen Yazar';
      const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      return {
        id: Math.random().toString(36).substring(7),
        title,
        author,
        status: 'want-to-read',
        isFavorite: false,
        coverColor: randomColor
      };
    });
    
    setBooks(prev => [...newBooks, ...prev]);
  };

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(7),
      content,
      isFavoriteQuote: false,
      createdAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const toggleFavoriteBook = (id: string) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, isFavorite: !book.isFavorite } : book
    ));
  };

  const toggleFavoriteNote = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, isFavoriteQuote: !note.isFavoriteQuote } : note
    ));
  };

  const updateBookStatus = (id: string, status: Book['status']) => {
    setBooks(prev => prev.map(book => 
      book.id === id ? { ...book, status } : book
    ));
  };

  return (
    <AppContext.Provider value={{
      books,
      notes,
      stats: defaultStats,
      discoverBooks: mockDiscover,
      addBook,
      addBooksBulk,
      addNote,
      toggleFavoriteBook,
      toggleFavoriteNote,
      updateBookStatus
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
