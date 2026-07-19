import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, BookOpen, Search, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddBookModal({ isOpen, onClose }: AddBookModalProps) {
  const { addBook } = useAppContext();
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);

  const handleIsbnSearch = async () => {
    if (!isbn.trim()) return;
    setIsSearchingIsbn(true);
    try {
      const cleanIsbn = isbn.replace(/[- ]/g, '');
      
      // 1. Önce Google Books API'den deneyelim (Açıklama ve Kapak için çok daha zengin)
      const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      if (gbResponse.ok) {
        const gbData = await gbResponse.json();
        if (gbData.items && gbData.items.length > 0) {
          const volumeInfo = gbData.items[0].volumeInfo;
          setTitle(volumeInfo.title || '');
          setAuthor(volumeInfo.authors ? volumeInfo.authors.join(', ') : '');
          if (volumeInfo.pageCount) setPageCount(volumeInfo.pageCount.toString());
          if (volumeInfo.description) setDescription(volumeInfo.description);
          if (volumeInfo.imageLinks?.thumbnail) {
            setCoverImageUrl(volumeInfo.imageLinks.thumbnail.replace('http:', 'https:'));
          }
          setIsSearchingIsbn(false);
          return; // Google'dan bulduysak burada bitir.
        }
      }

      // 2. Google'da bulamazsak Open Library API'ye soralım
      const olResponse = await fetch(`https://openlibrary.org/search.json?isbn=${cleanIsbn}`);
      if (olResponse.ok) {
        const olData = await olResponse.json();
        if (olData.docs && olData.docs.length > 0) {
          const doc = olData.docs[0];
          setTitle(doc.title || '');
          setAuthor(doc.author_name ? doc.author_name.join(', ') : '');
          if (doc.number_of_pages_median) setPageCount(doc.number_of_pages_median.toString());
          if (doc.first_publish_year && !description) setDescription(`İlk basım yılı: ${doc.first_publish_year}`);
          if (doc.cover_i) {
            setCoverImageUrl(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`);
          }
          setIsSearchingIsbn(false);
          return;
        }
      }
      
      alert('Bu ISBN numarasına ait kitap bulunamadı.');
    } catch (error) {
      console.error('ISBN araması başarısız:', error);
      alert('Arama sırasında bir hata oluştu.');
    } finally {
      setIsSearchingIsbn(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const bookPayload: Omit<Book, 'id'> = {
      title: title.trim(),
      author: author.trim(),
      status: 'want-to-read',
      isFavorite: false,
      coverColor: randomColor,
      readPages: 0,
      addedAt: Date.now()
    };

    if (pageCount) bookPayload.pageCount = parseInt(pageCount, 10);
    if (description.trim()) bookPayload.description = description.trim();
    if (coverImageUrl) bookPayload.coverImageUrl = coverImageUrl;

    addBook(bookPayload);

    // Reset and close
    setIsbn('');
    setTitle('');
    setAuthor('');
    setPageCount('');
    setDescription('');
    setCoverImageUrl('');
    onClose();
  };

  if (!document.body) return null;

  return createPortal(
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-[#1A1E29] rounded-2xl shadow-2xl z-50 overflow-hidden border border-stone-200 dark:border-white/10 flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-[#0B0C10]/50 shrink-0">
              <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <BookOpen size={20} className="text-amber-500" />
                Kitap Ekle
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-6 p-4 bg-stone-50 dark:bg-[#151820] rounded-xl border border-stone-200 dark:border-white/5">
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">ISBN ile Otomatik Doldur</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIsbnSearch()}
                    className="flex-1 px-4 py-2 bg-white dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200"
                    placeholder="Örn: 9780140449136"
                  />
                  <button
                    onClick={handleIsbnSearch}
                    disabled={isSearchingIsbn || !isbn.trim()}
                    className="flex items-center gap-2 bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200 px-4 py-2 rounded-xl hover:bg-stone-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    {isSearchingIsbn ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    Bul
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Kapak Görseli URL (İsteğe Bağlı)</label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                    placeholder="Örn: https://ornek.com/kapak.jpg"
                  />
                  <p className="text-xs text-stone-500 mt-1">İnternette bulduğunuz bir görselin bağlantısını kopyalayıp buraya yapıştırabilirsiniz.</p>
                </div>

                <div className="pt-4 pb-2">
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
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}
