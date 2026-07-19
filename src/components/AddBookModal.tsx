import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, Plus, BookOpen } from 'lucide-react';
import { useGoogleBooks, BookSearchResult } from '../hooks/useGoogleBooks';
import { useAppContext } from '../context/AppContext';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const [query, setQuery] = useState('');
  const { results, loading, error } = useGoogleBooks(query);
  const { addBook } = useAppContext();

  const handleAddBook = (volume: BookSearchResult) => {
    const info = volume.volumeInfo;
    const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addBook({
      title: info.title,
      author: info.authors ? info.authors.join(', ') : 'Bilinmeyen Yazar',
      status: 'want-to-read',
      isFavorite: false,
      coverImageUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:'),
      coverColor: randomColor,
      pageCount: info.pageCount,
      description: info.description,
      readPages: 0,
      addedAt: Date.now()
    });
    onClose();
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-[#1A1E29] rounded-2xl shadow-2xl z-50 overflow-hidden border border-stone-200 dark:border-white/10 flex flex-col max-h-[85vh]"
          >
            <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="text"
                  placeholder="Kitap veya yazar ara (Google Books)..."
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" size={20} />
                )}
              </div>
              <button
                onClick={onClose}
                className="p-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50/50 dark:bg-[#0B0C10]/50">
              {error && (
                <div className="p-4 text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl mb-4">
                  Arama hatası: {error}
                </div>
              )}

              {query && results.length === 0 && !loading && !error && (
                <div className="py-12 text-center text-stone-500 dark:text-stone-400">
                  Sonuç bulunamadı.
                </div>
              )}
              
              {!query && (
                <div className="py-12 text-center flex flex-col items-center justify-center text-stone-400">
                  <BookOpen size={48} className="mb-4 opacity-50" />
                  <p>Milyonlarca kitap arasında arama yapın.</p>
                </div>
              )}

              {results.map((item) => {
                const info = item.volumeInfo;
                const coverUrl = info.imageLinks?.thumbnail?.replace('http:', 'https:');
                
                return (
                  <motion.div
                    layout
                    key={item.id}
                    className="flex items-start gap-4 p-4 bg-white dark:bg-[#151820] rounded-xl border border-stone-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-16 h-24 shrink-0 bg-stone-200 dark:bg-stone-800 rounded flex items-center justify-center overflow-hidden">
                      {coverUrl ? (
                        <img src={coverUrl} alt={info.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen size={24} className="text-stone-400" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 text-lg truncate">
                        {info.title}
                      </h3>
                      <p className="text-stone-500 dark:text-stone-400 text-sm mb-1 truncate">
                        {info.authors?.join(', ') || 'Bilinmeyen Yazar'}
                      </p>
                      <p className="text-stone-400 dark:text-stone-500 text-xs line-clamp-2">
                        {info.description || 'Açıklama bulunmuyor.'}
                      </p>
                      {info.pageCount && (
                        <span className="inline-block mt-2 px-2 py-1 bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 text-xs rounded">
                          {info.pageCount} sayfa
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleAddBook(item)}
                      className="p-3 text-stone-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      title="Kütüphaneye Ekle"
                    >
                      <Plus size={20} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
