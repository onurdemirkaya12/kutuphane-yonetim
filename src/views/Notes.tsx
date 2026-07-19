import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine, Star, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function Notes() {
  const { notes, books, toggleFavoriteNote } = useAppContext();

  const getBookTitle = (bookId?: string) => {
    if (!bookId) return null;
    const book = books.find(b => b.id === bookId);
    return book ? book.title : null;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-full">
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2">Notlarım</h1>
        <p className="text-stone-500 dark:text-stone-400">Kitaplardan aldığınız tüm notlar ve alıntılar.</p>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {notes.map((note) => {
            const bookTitle = getBookTitle(note.bookId);
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel anti-gravity p-6 rounded-2xl group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-stone-700 dark:text-stone-300 text-lg leading-relaxed mb-4">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      <span>{new Date(note.createdAt).toLocaleDateString('tr-TR')}</span>
                      {bookTitle && (
                        <span className="flex items-center gap-1 text-blue-500/80 dark:text-blue-400/80">
                          <BookOpen size={14} />
                          {bookTitle}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleFavoriteNote(note.id)}
                    className={`p-3 rounded-full transition-colors shrink-0 ${
                      note.isFavoriteQuote 
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                        : 'text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Star size={20} className={note.isFavoriteQuote ? 'fill-current' : ''} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {notes.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center text-stone-400">
            <PenLine size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Henüz hiç not eklemediniz.</p>
            <p className="text-sm mt-2">Kütüphanenizden bir kitaba tıklayıp hızlıca not alabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
