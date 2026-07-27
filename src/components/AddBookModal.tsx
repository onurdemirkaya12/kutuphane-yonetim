import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, BookOpen, Search, Loader2, Camera, Zap, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Book } from '../types';
import { BarcodeScanner } from './BarcodeScanner';

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
  const [category, setCategory] = useState('');
  const [isSearchingIsbn, setIsSearchingIsbn] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [scannedBooks, setScannedBooks] = useState<Omit<Book, 'id'>[]>([]);

  const handleIsbnSearch = async (overrideIsbn?: string) => {
    const isbnToSearch = typeof overrideIsbn === 'string' ? overrideIsbn : isbn;
    if (!isbnToSearch.trim()) return;
    setIsSearchingIsbn(true);
    try {
      const cleanIsbn = isbnToSearch.replace(/[- ]/g, '');
      
      let foundBook: any = null;

      const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      if (gbResponse.ok) {
        const gbData = await gbResponse.json();
        if (gbData.items && gbData.items.length > 0) {
          const volumeInfo = gbData.items[0].volumeInfo;
          foundBook = {
            title: volumeInfo.title || '',
            author: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
            pageCount: volumeInfo.pageCount ? volumeInfo.pageCount.toString() : '',
            description: volumeInfo.description || '',
            category: (volumeInfo.categories && volumeInfo.categories.length > 0) ? volumeInfo.categories.join(', ') : '',
            coverImageUrl: volumeInfo.imageLinks?.thumbnail ? volumeInfo.imageLinks.thumbnail.replace('http:', 'https:') : '',
          };
        }
      }

      if (!foundBook) {
        const olResponse = await fetch(`https://openlibrary.org/search.json?isbn=${cleanIsbn}`);
        if (olResponse.ok) {
          const olData = await olResponse.json();
          if (olData.docs && olData.docs.length > 0) {
            const doc = olData.docs[0];
            foundBook = {
              title: doc.title || '',
              author: doc.author_name ? doc.author_name.join(', ') : '',
              pageCount: doc.number_of_pages_median ? doc.number_of_pages_median.toString() : '',
              description: doc.first_publish_year ? `İlk basım yılı: ${doc.first_publish_year}` : '',
              category: (doc.subject && doc.subject.length > 0) ? doc.subject[0] : '',
              coverImageUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : '',
            };
          }
        }
      }

      if (foundBook) {
        if (isBulkMode) {
          const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const bookPayload: Omit<Book, 'id'> = {
            title: foundBook.title || 'İsimsiz Kitap',
            author: foundBook.author || 'Bilinmeyen Yazar',
            status: 'want-to-read',
            isFavorite: false,
            coverColor: randomColor,
            readPages: 0,
            addedAt: Date.now(),
            ...(foundBook.pageCount && { pageCount: parseInt(foundBook.pageCount, 10) }),
            ...(foundBook.description && { description: foundBook.description }),
            ...(foundBook.category && { category: foundBook.category }),
            ...(foundBook.coverImageUrl && { coverImageUrl: foundBook.coverImageUrl }),
            isbn: cleanIsbn
          };
          addBook(bookPayload);
          setScannedBooks(prev => [bookPayload, ...prev]);
          setIsbn('');
        } else {
          setTitle(foundBook.title);
          setAuthor(foundBook.author);
          setPageCount(foundBook.pageCount);
          setDescription(foundBook.description);
          setCategory(foundBook.category);
          setCoverImageUrl(foundBook.coverImageUrl);
        }
      } else {
        alert('Bu ISBN numarasına ait kitap bulunamadı.');
      }
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
    if (category.trim()) bookPayload.category = category.trim();
    if (coverImageUrl) bookPayload.coverImageUrl = coverImageUrl;
    if (isbn.trim()) bookPayload.isbn = isbn.trim().replace(/[- ]/g, '');

    addBook(bookPayload);

    // Reset and close
    setIsbn('');
    setTitle('');
    setAuthor('');
    setPageCount('');
    setDescription('');
    setCategory('');
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
            className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-lg bg-white dark:bg-[#1A1E29] md:rounded-2xl shadow-2xl z-50 overflow-hidden border-0 md:border border-stone-200 dark:border-white/10 flex flex-col h-full md:max-h-[90vh]"
          >
            <div className="p-4 md:p-6 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-[#0B0C10]/50 shrink-0 mt-[env(safe-area-inset-top)]">
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
              <div className="flex bg-stone-100 dark:bg-[#151820] p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${!isBulkMode ? 'bg-white dark:bg-[#0B0C10] text-stone-900 dark:text-stone-100 shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                >
                  <Plus size={16} />
                  Detaylı Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors ${isBulkMode ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                >
                  <Zap size={16} />
                  Hızlı Çoklu Ekle
                </button>
              </div>

              <div className="mb-6 p-4 bg-stone-50 dark:bg-[#151820] rounded-xl border border-stone-200 dark:border-white/5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    {isBulkMode ? 'Kitapları Arka Arkaya Tarayın' : 'ISBN ile Otomatik Doldur'}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(!isScannerOpen)}
                      className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${isScannerOpen ? 'bg-amber-100 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-500' : 'bg-white dark:bg-[#0B0C10] border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5'}`}
                      title="Kamera ile Tara"
                    >
                      <Camera size={20} />
                    </button>
                    <input
                      type="text"
                      autoFocus
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleIsbnSearch();
                        }
                      }}
                      className="flex-1 min-w-0 px-4 py-2 bg-white dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200"
                      placeholder="Örn: 9780140449136"
                    />
                    <button
                      type="button"
                      onClick={() => handleIsbnSearch()}
                      disabled={isSearchingIsbn || !isbn.trim()}
                      className="flex items-center justify-center gap-2 bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200 px-3 sm:px-4 py-2 rounded-xl hover:bg-stone-300 dark:hover:bg-white/20 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isSearchingIsbn ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Search size={18} className="shrink-0" />}
                      <span>Bul</span>
                    </button>
                  </div>
                </div>

                {isScannerOpen && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <BarcodeScanner 
                      onResult={(result) => {
                        setIsbn(result);
                        if (!isBulkMode) {
                           setIsScannerOpen(false);
                        }
                        handleIsbnSearch(result);
                      }} 
                    />
                  </div>
                )}
              </div>

              {!isBulkMode ? (
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
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Kategori (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                      placeholder="Örn: Edebiyat, Psikoloji"
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

                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">ISBN (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                      className="w-full px-4 py-3 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
                      placeholder="Örn: 9780140449136"
                    />
                    <p className="text-xs text-stone-500 mt-1">Bu bilgiyi girmek, ileride Excel çıktısı alırken kitaplarınızı eşleştirmenizi kolaylaştırır.</p>
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
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 px-1">Bu Oturumda Eklenenler ({scannedBooks.length})</h3>
                  {scannedBooks.length === 0 ? (
                    <div className="py-8 text-center text-stone-400 dark:text-stone-500 border border-dashed border-stone-200 dark:border-white/10 rounded-xl">
                      Henüz kitap taranmadı. Taradığınız kitaplar doğrudan kütüphanenize eklenecektir.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scannedBooks.map((book, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-[#0B0C10] border border-stone-200 dark:border-white/5 rounded-xl animate-in slide-in-from-top-2">
                          <div className="w-10 h-14 rounded overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                            {book.coverImageUrl ? (
                              <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full ${book.coverColor}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-stone-900 dark:text-stone-100 truncate">{book.title}</h4>
                            <p className="text-sm text-stone-500 truncate">{book.author}</p>
                          </div>
                          <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}
