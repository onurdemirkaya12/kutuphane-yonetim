import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const { addBook } = useAppContext();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    addBook({
      title: title.trim(),
      author: author.trim(),
      status: 'want-to-read',
      isFavorite: false,
      coverColor: randomColor,
      pageCount: pageCount ? parseInt(pageCount, 10) : undefined,
      description: description.trim() || undefined,
      readPages: 0,
      addedAt: Date.now()
    });

    // Reset and close
    setTitle('');
    setAuthor('');
    setPageCount('');
    setDescription('');
    onClose();
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#1A1E29] rounded-2xl shadow-2xl z-50 overflow-hidden border border-stone-200 dark:border-white/10 flex flex-col"
          >
            <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-[#0B0C10]/50">
              <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen size={20} className="text-amber-500" />
                Manuel Kitap Ekle
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Kitap Adı *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                  placeholder="Örn: Suç ve Ceza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Yazar *</label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                  placeholder="Örn: Dostoyevski"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Sayfa Sayısı (İsteğe Bağlı)</label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                  placeholder="Örn: 687"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Açıklama / Konu (İsteğe Bağlı)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow resize-none"
                  placeholder="Kitap hakkında kısa bir bilgi..."
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!title.trim() || !author.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 py-3 px-4 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={20} />
                  Kütüphaneye Ekle
                </button>
              </div>
            </form>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
