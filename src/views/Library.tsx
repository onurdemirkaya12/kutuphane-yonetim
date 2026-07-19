import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, Clock, CheckCircle2, ChevronRight, MessageSquarePlus, X, Trash2, Edit3, Save, Search, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AddBookModal } from '../components/AddBookModal';
import { Book } from '../types';

export function Library() {
  const { books, updateBookStatus, updateBook, deleteBook, addNote } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editIsbn, setEditIsbn] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Book['status']>('all');

  const statusMap = {
    'want-to-read': { label: 'Okunacak', icon: Clock, color: 'text-amber-500' },
    'reading': { label: 'Okunuyor', icon: BookOpen, color: 'text-blue-500' },
    'completed': { label: 'Bitti', icon: CheckCircle2, color: 'text-emerald-500' }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    // UTF-8 BOM ekliyoruz ki Excel Türkçe karakterleri (ş,ğ,ü vb.) sorunsuz okusun
    const bom = '\uFEFF';
    const headers = ['Kitap Adı', 'Yazar', 'Durum', 'Sayfa Sayısı', 'ISBN', 'Eklenme Tarihi'];
    
    const rows = books.map(book => [
      `"${book.title.replace(/"/g, '""')}"`,
      `"${book.author.replace(/"/g, '""')}"`,
      `"${statusMap[book.status].label}"`,
      book.pageCount || '',
      `"${book.isbn || ''}"`,
      `"${new Date(book.addedAt).toLocaleDateString('tr-TR')}"`
    ]);

    const csvContent = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kutuphanem_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedBook) return;
    addNote(noteContent, selectedBook.id);
    setNoteContent('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2">Kütüphane</h1>
          <p className="text-stone-500 dark:text-stone-400">Tüm kitaplarınız ve okuma durumlarınız.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="anti-gravity flex items-center gap-2 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-white/10 transition-colors"
            title="Excel (CSV) Olarak İndir"
          >
            <Download size={20} />
            <span className="hidden sm:inline">İndir</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="anti-gravity flex items-center gap-2 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 px-6 py-3 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-white transition-colors"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Yeni Kitap Ekle</span>
            <span className="sm:hidden">Ekle</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 transition-shadow"
            placeholder="Kitap veya yazar ara..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 cursor-pointer appearance-none min-w-[160px]"
        >
          <option value="all">Tüm Kitaplar</option>
          <option value="want-to-read">Okunacaklar</option>
          <option value="reading">Okunanlar</option>
          <option value="completed">Bitenler</option>
        </select>
      </div>

      <motion.div 
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
      >
        <AnimatePresence>
          {filteredBooks.map((book) => {
            const StatusIcon = statusMap[book.status].icon;
            
            return (
              <motion.div
                layoutId={`book-${book.id}`}
                key={book.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedBook(book)}
                className="anti-gravity cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-xl shadow-md overflow-hidden mb-4 bg-stone-200 dark:bg-stone-800">
                  {book.coverImageUrl ? (
                    <img 
                      src={book.coverImageUrl} 
                      alt={book.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full ${book.coverColor || 'bg-stone-800'} flex items-center justify-center p-4 text-center ${book.coverImageUrl ? 'hidden' : ''}`}>
                    <span className="font-serif font-medium text-white/50 text-sm">{book.title}</span>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-medium flex items-center gap-2">
                      Detaylar <ChevronRight size={16} />
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 bg-white/90 dark:bg-stone-900/90 backdrop-blur p-1.5 rounded-lg shadow-sm">
                    <StatusIcon size={14} className={statusMap[book.status].color} />
                  </div>
                </div>
                
                <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 truncate">{book.title}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm truncate">{book.author}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {books.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center text-stone-400">
          <BookOpen size={64} className="mb-4 opacity-50" />
          <p className="text-lg">Kütüphaneniz şu an boş.</p>
          <p className="text-sm mt-2">Sağ üstteki butona tıklayarak kitap eklemeye başlayabilirsiniz.</p>
        </div>
      )}

      <AddBookModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Book Detail Expanded Modal */}
      <AnimatePresence>
        {selectedBook && (
          <React.Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBook(null)}
              className="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-md z-40"
            />
            <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center p-4">
              <motion.div
                layoutId={`book-${selectedBook.id}`}
                className="pointer-events-auto w-full max-w-3xl bg-white dark:bg-[#1A1E29] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200 dark:border-white/10"
              >
                <div className="w-full md:w-1/3 bg-stone-100 dark:bg-[#0B0C10] p-8 flex flex-col items-center justify-center border-r border-stone-200 dark:border-white/5 relative">
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-4 left-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 md:hidden"
                  >
                    <X size={20} />
                  </button>
                  <div className="w-40 aspect-[2/3] rounded-lg shadow-xl overflow-hidden mb-6">
                    {selectedBook.coverImageUrl ? (
                    <img 
                      src={selectedBook.coverImageUrl} 
                      alt={selectedBook.title} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full ${selectedBook.coverColor || 'bg-stone-800'} ${selectedBook.coverImageUrl ? 'hidden' : ''}`} />
                  </div>
                  <div className="w-full space-y-2">
                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">Durum</p>
                    <select
                      value={selectedBook.status}
                      onChange={(e) => updateBookStatus(selectedBook.id, e.target.value as Book['status'])}
                      className="w-full bg-white dark:bg-[#151820] border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                    >
                      <option value="want-to-read">Okunacak</option>
                      <option value="reading">Şu An Okunuyor</option>
                      <option value="completed">Tamamlandı</option>
                    </select>
                  </div>
                </div>

                <div className="w-full md:w-2/3 p-8 flex flex-col relative">
                  <div className="absolute top-6 right-6 flex gap-2">
                    <button 
                      onClick={() => {
                        if (isEditing) {
                          const updates: Partial<Book> = {
                            title: editTitle,
                            author: editAuthor,
                            description: editDescription
                          };
                          if (editCoverUrl) updates.coverImageUrl = editCoverUrl;
                          if (editIsbn) updates.isbn = editIsbn;
                          
                          updateBook(selectedBook.id, updates);
                          setSelectedBook({ ...selectedBook, ...updates });
                          setIsEditing(false);
                        } else {
                          setEditTitle(selectedBook.title);
                          setEditAuthor(selectedBook.author);
                          setEditDescription(selectedBook.description || '');
                          setEditCoverUrl(selectedBook.coverImageUrl || '');
                          setEditIsbn(selectedBook.isbn || '');
                          setIsEditing(true);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hidden md:flex items-center gap-1 rounded-full hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                      title={isEditing ? "Kaydet" : "Düzenle"}
                    >
                      {isEditing ? <Save size={20} /> : <Edit3 size={20} />}
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm("Bu kitabı kütüphaneden silmek istediğinize emin misiniz?")) {
                          deleteBook(selectedBook.id);
                          setSelectedBook(null);
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hidden md:block rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => setSelectedBook(null)}
                      className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hidden md:block rounded-full hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="mb-6 pr-24">
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500"
                        placeholder="Kitap Adı"
                      />
                      <input 
                        type="text" 
                        value={editAuthor} 
                        onChange={e => setEditAuthor(e.target.value)} 
                        className="text-lg text-stone-500 dark:text-stone-400 mb-4 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500"
                        placeholder="Yazar"
                      />
                      <label className="block text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1 mt-4">Kapak Görseli URL</label>
                      <input 
                        type="url" 
                        value={editCoverUrl} 
                        onChange={e => setEditCoverUrl(e.target.value)} 
                        className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                        placeholder="https://... (Görsel bağlantısı)"
                      />
                      
                      <label className="block text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1 mt-4">ISBN Numarası</label>
                      <input 
                        type="text" 
                        value={editIsbn} 
                        onChange={e => setEditIsbn(e.target.value)} 
                        className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                        placeholder="Örn: 9780140449136"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2 pr-24">{selectedBook.title}</h2>
                      <p className="text-lg text-stone-500 dark:text-stone-400 mb-6">{selectedBook.author}</p>
                    </>
                  )}
                  
                  {/* Auto Fetch Info Button */}
                  {!isEditing && (!selectedBook.coverImageUrl || !selectedBook.description || !selectedBook.pageCount) && (
                    <button
                      onClick={async () => {
                        try {
                          const query = `${selectedBook.title} ${selectedBook.author}`;
                          let foundUpdates = false;
                          const updates: Partial<Book> = {};

                          // 1. Önce Google Books API
                          const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`);
                          if (gbResponse.ok) {
                            const gbData = await gbResponse.json();
                            if (gbData.items && gbData.items.length > 0) {
                              const volumeInfo = gbData.items[0].volumeInfo;
                              if (!selectedBook.coverImageUrl && volumeInfo.imageLinks?.thumbnail) {
                                updates.coverImageUrl = volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
                              }
                              if (!selectedBook.pageCount && volumeInfo.pageCount) {
                                updates.pageCount = volumeInfo.pageCount;
                              }
                              if (!selectedBook.description && volumeInfo.description) {
                                updates.description = volumeInfo.description;
                              }
                              foundUpdates = true;
                            }
                          }

                          // 2. Bulunamayan eksikler varsa Open Library API
                          if (!foundUpdates || !updates.coverImageUrl || !updates.pageCount || !updates.description) {
                            const olResponse = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`);
                            if (olResponse.ok) {
                              const olData = await olResponse.json();
                              if (olData.docs && olData.docs.length > 0) {
                                const doc = olData.docs[0];
                                if (!selectedBook.coverImageUrl && !updates.coverImageUrl && doc.cover_i) {
                                  updates.coverImageUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
                                }
                                if (!selectedBook.pageCount && !updates.pageCount && doc.number_of_pages_median) {
                                  updates.pageCount = doc.number_of_pages_median;
                                }
                                if (!selectedBook.description && !updates.description && doc.first_publish_year) {
                                  updates.description = `İlk basım yılı: ${doc.first_publish_year}`;
                                }
                              }
                            }
                          }
                          
                          if (Object.keys(updates).length > 0) {
                            updateBook(selectedBook.id, updates);
                            setSelectedBook({ ...selectedBook, ...updates });
                          } else {
                            alert("Ek bilgi bulunamadı.");
                          }
                        } catch (error) {
                          console.error("Bilgi getirilirken hata:", error);
                          alert("Bilgi getirilemedi, lütfen internet bağlantınızı kontrol edin.");
                        }
                      }}
                      className="mb-6 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline w-fit"
                    >
                      <BookOpen size={16} />
                      Kapak ve Bilgileri İnternetten Bul
                    </button>
                  )}

                  {isEditing ? (
                    <div className="mb-8">
                      <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Açıklama</p>
                      <textarea 
                        value={editDescription} 
                        onChange={e => setEditDescription(e.target.value)} 
                        rows={5}
                        className="w-full bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 resize-none"
                        placeholder="Kitap hakkında açıklama..."
                      />
                    </div>
                  ) : selectedBook.description && (
                    <div className="mb-8">
                      <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Açıklama</p>
                      <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-4 leading-relaxed">{selectedBook.description}</p>
                    </div>
                  )}

                  <div className="mt-auto">
                    <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">Hızlı Not Ekle</p>
                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input
                        type="text"
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Bu kitap hakkında ne düşünüyorsun?..."
                        className="flex-1 bg-stone-50 dark:bg-[#0B0C10] border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
                      />
                      <button 
                        type="submit"
                        disabled={!noteContent.trim()}
                        className="bg-stone-900 dark:bg-white text-stone-50 dark:text-stone-900 px-4 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <MessageSquarePlus size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            </div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
