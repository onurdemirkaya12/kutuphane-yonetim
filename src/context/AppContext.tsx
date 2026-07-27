import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Book, Note, ReadingStat, UserProfile } from '../types';

export type Theme = 'light' | 'dark';

interface AppContextType {
  books: Book[];
  notes: Note[];
  stats: ReadingStat[];
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  theme: Theme;
  toggleTheme: () => void;
  addBook: (book: Omit<Book, 'id'>) => void;
  addBooksBulk: (booksText: string) => void;
  addNote: (content: string, bookId?: string, pageNumber?: number) => void;
  toggleFavoriteBook: (id: string) => void;
  toggleFavoriteNote: (id: string) => void;
  updateBookStatus: (id: string, status: Book['status']) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  updateNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
}

const defaultStats: ReadingStat[] = [
  { month: 'Oca', pagesRead: 450 },
  { month: 'Şub', pagesRead: 320 },
  { month: 'Mar', pagesRead: 600 },
  { month: 'Nis', pagesRead: 410 },
  { month: 'May', pagesRead: 750 },
  { month: 'Haz', pagesRead: 500 },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : {
      name: 'Kitap Kurdu',
      yearlyGoal: 50,
      joinDate: Date.now()
    };
  });

  // Theme logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  // Firebase Realtime Listeners
  useEffect(() => {
    // Kitapları dinle
    const unsubscribeBooks = onSnapshot(collection(db, 'books'), (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      setBooks(booksData);
    });

    // Notları dinle
    const unsubscribeNotes = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      
      // En son eklenen not en üstte olsun
      notesData.sort((a, b) => b.createdAt - a.createdAt);
      setNotes(notesData);
    });

    // Component unmount olduğunda dinlemeyi bırak
    return () => {
      unsubscribeBooks();
      unsubscribeNotes();
    };
  }, []);

  const addBook = async (bookData: Omit<Book, 'id'>) => {
    try {
      await addDoc(collection(db, 'books'), bookData);
    } catch (error) {
      console.error("Kitap eklenirken hata oluştu: ", error);
    }
  };

  const addBooksBulk = async (booksText: string) => {
    const lines = booksText.split('\n').filter(line => line.trim() !== '');
    const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
    
    for (const line of lines) {
      const parts = line.split('-').map(p => p.trim());
      const title = parts[0] || 'Bilinmeyen Kitap';
      const author = parts[1] || 'Bilinmeyen Yazar';
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const bookData = {
        title,
        author,
        status: 'want-to-read',
        isFavorite: false,
        coverColor: randomColor
      };
      
      try {
        await addDoc(collection(db, 'books'), bookData);
      } catch (error) {
        console.error("Toplu kitap eklenirken hata oluştu: ", error);
      }
    }
  };

  const addNote = async (content: string, bookId?: string, pageNumber?: number) => {
    try {
      const noteData: any = {
        content,
        isFavoriteQuote: false,
        createdAt: Date.now(),
      };
      if (bookId) noteData.bookId = bookId;
      if (pageNumber !== undefined) noteData.pageNumber = pageNumber;

      await addDoc(collection(db, 'notes'), noteData);
    } catch (error) {
      console.error("Not eklenirken hata oluştu: ", error);
    }
  };

  const toggleFavoriteBook = async (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      const bookRef = doc(db, 'books', id);
      try {
        await updateDoc(bookRef, {
          isFavorite: !book.isFavorite
        });
      } catch (error) {
        console.error("Favori durumu güncellenirken hata oluştu: ", error);
      }
    }
  };

  const toggleFavoriteNote = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      const noteRef = doc(db, 'notes', id);
      try {
        await updateDoc(noteRef, {
          isFavoriteQuote: !note.isFavoriteQuote
        });
      } catch (error) {
        console.error("Not favori durumu güncellenirken hata oluştu: ", error);
      }
    }
  };

  const updateBookStatus = async (id: string, status: Book['status']) => {
    const bookRef = doc(db, 'books', id);
    try {
      const updates: Partial<Book> = { status };
      
      if (status === 'reading') {
        updates.startDate = Date.now();
      } else if (status === 'completed') {
        updates.endDate = Date.now();
      }

      await updateDoc(bookRef, updates);
    } catch (error) {
      console.error("Kitap durumu güncellenirken hata oluştu: ", error);
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    const bookRef = doc(db, 'books', id);
    try {
      await updateDoc(bookRef, updates);
    } catch (error) {
      console.error("Kitap bilgileri güncellenirken hata oluştu: ", error);
    }
  };

  const deleteBook = async (id: string) => {
    const { deleteDoc } = await import('firebase/firestore');
    const bookRef = doc(db, 'books', id);
    try {
      await deleteDoc(bookRef);
    } catch (error) {
      console.error("Kitap silinirken hata oluştu: ", error);
    }
  };

  const updateNote = async (id: string, content: string) => {
    const noteRef = doc(db, 'notes', id);
    try {
      await updateDoc(noteRef, { content });
    } catch (error) {
      console.error("Not güncellenirken hata oluştu: ", error);
    }
  };

  const deleteNote = async (id: string) => {
    const { deleteDoc } = await import('firebase/firestore');
    const noteRef = doc(db, 'notes', id);
    try {
      await deleteDoc(noteRef);
    } catch (error) {
      console.error("Not silinirken hata oluştu: ", error);
    }
  };

  const updateUserProfile = (profileUpdates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const newProfile = { ...prev, ...profileUpdates };
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  return (
    <AppContext.Provider value={{
      books,
      notes,
      stats: defaultStats,
      userProfile,
      updateUserProfile,
      theme,
      toggleTheme,
      addBook,
      addBooksBulk,
      addNote,
      toggleFavoriteBook,
      toggleFavoriteNote,
      updateBookStatus,
      updateBook,
      deleteBook,
      updateNote,
      deleteNote
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
