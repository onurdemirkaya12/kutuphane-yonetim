import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenLine, Star, BookOpen, Send, Bookmark, Edit2, Trash2, X, Save, Search, Download, Quote } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Note } from '../types';

export function Notes() {
  const { notes, books, toggleFavoriteNote, addNote, updateNote, deleteNote } = useAppContext();
  
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [pageNumber, setPageNumber] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBookId, setFilterBookId] = useState<string>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  
  const [randomQuote, setRandomQuote] = useState<Note | null>(null);

  // Default to currently reading book
  useEffect(() => {
    const readingBook = books.find(b => b.status === 'reading');
    if (readingBook && !selectedBookId) {
      setSelectedBookId(readingBook.id);
    }
  }, [books, selectedBookId]);

  useEffect(() => {
    const favoriteNotes = notes.filter(n => n.isFavoriteQuote);
    if (favoriteNotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * favoriteNotes.length);
      setRandomQuote(favoriteNotes[randomIndex]);
    } else {
      setRandomQuote(null);
    }
  }, [notes]);

  const getBook = (bookId?: string) => {
    if (!bookId) return null;
    return books.find(b => b.id === bookId) || null;
  };

  const filteredNotes = notes.filter(note => {
    const book = getBook(note.bookId);
    const bookTitle = book?.title?.toLowerCase() || '';
    const content = (note.content || '').toLowerCase();
    const query = (searchQuery || '').toLowerCase();
    
    const matchesSearch = content.includes(query) || bookTitle.includes(query);
    const matchesBook = filterBookId === 'all' || note.bookId === filterBookId;
    const matchesFavorite = !filterFavorites || note.isFavoriteQuote;
    
    return matchesSearch && matchesBook && matchesFavorite;
  });

  const exportNotes = () => {
    const bom = '\uFEFF';
    const textContent = filteredNotes.map(note => {
      const book = getBook(note.bookId);
      const bookInfo = book ? `Kitap: ${book.title} ${book.author ? `(${book.author})` : ''}` : 'Kitap Bağımsız';
      const pageInfo = note.pageNumber ? ` - Sayfa: ${note.pageNumber}` : '';
      const dateInfo = `Tarih: ${note.createdAt && !isNaN(new Date(note.createdAt).getTime()) ? new Date(note.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}`;
      return `----------------------------------------\n${bookInfo}${pageInfo}\n${dateInfo}\n\n${note.content}\n`;
    }).join('\n');
    
    const blob = new Blob([bom + textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kutuphanem_notlar_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    const page = pageNumber ? parseInt(pageNumber, 10) : undefined;
    addNote(noteContent, selectedBookId || undefined, page);
    
    setNoteContent('');
    setPageNumber('');
  };

  const handleSaveEdit = (noteId: string) => {
    if (!editContent.trim()) return;
    updateNote(noteId, editContent);
    setEditingNoteId(null);
    setEditContent('');
  };


  const selectedBook = getBook(selectedBookId);

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-full space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2">Notlarım</h1>
        <p className="text-stone-500 dark:text-stone-400">Kitaplardan aldığınız tüm notlar ve alıntılar.</p>
      </div>

      {randomQuote && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20"
        >
          <Quote className="absolute top-4 right-6 text-amber-500/10 w-32 h-32 rotate-12" />
          <div className="relative z-10 flex flex-col gap-3">
            <h2 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest flex items-center gap-2">
              <Star size={14} className="fill-current" /> Günün Alıntısı
            </h2>
            <p className="text-2xl font-serif text-stone-800 dark:text-stone-200 italic leading-relaxed">
              "{randomQuote.content}"
            </p>
            {randomQuote.bookId && (
              <p className="text-sm text-stone-600 dark:text-stone-400 font-medium mt-2">
                — {getBook(randomQuote.bookId)?.title} {randomQuote.pageNumber ? `(Sayfa ${randomQuote.pageNumber})` : ''}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick Note Widget */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel anti-gravity p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-orange-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
        
        <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2 relative z-10">
          <PenLine size={18} className="text-amber-500" />
          Hızlı Not Ekle
        </h2>

        <form onSubmit={handleAddNote} className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start">
            
            {/* Book Selector / Display */}
            <div className="w-full md:w-1/3">
              <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">İlgili Kitap</label>
              <select 
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-800 border-none rounded-xl px-4 py-3 text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all appearance-none"
              >
                <option value="">Kitap Seçin (Opsiyonel)</option>
                <optgroup label="Şu An Okunanlar">
                  {books.filter(b => b.status === 'reading').map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </optgroup>
                <optgroup label="Tüm Kitaplar">
                  {books.filter(b => b.status !== 'reading').map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </optgroup>
              </select>

              {selectedBook && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 flex items-center gap-3 bg-stone-50 dark:bg-stone-800/50 p-3 rounded-xl border border-stone-200 dark:border-stone-700/50"
                >
                  <div className="w-10 h-14 bg-stone-200 dark:bg-stone-700 rounded overflow-hidden shrink-0">
                    {selectedBook.coverImageUrl ? (
                      <img src={selectedBook.coverImageUrl} alt={selectedBook.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full ${selectedBook.coverColor || 'bg-stone-800'}`} />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{selectedBook.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{selectedBook.author}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Note Input Area */}
            <div className="w-full md:w-2/3 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Sayfa (Opsiyonel)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Örn: 45"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  className="w-full md:w-32 bg-stone-100 dark:bg-stone-800 border-none rounded-xl px-4 py-3 text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 uppercase tracking-wider">Notunuz</label>
                <textarea
                  placeholder="Bugün deniz çok güzeldi, fakat sen o kadar güzel değildin..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full h-24 bg-stone-100 dark:bg-stone-800 border-none rounded-xl px-4 py-3 text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteContent.trim()}
                  className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  Kaydet
                </button>
              </div>
            </div>

          </div>
        </form>
      </motion.div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-stone-200 transition-shadow"
            placeholder="Notlarda veya kitaplarda ara..."
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex-wrap sm:flex-nowrap">
          <select
            value={filterBookId}
            onChange={(e) => setFilterBookId(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-stone-200 cursor-pointer appearance-none min-w-[160px]"
          >
            <option value="all">Tüm Kitaplar</option>
            {books.filter(b => notes.some(n => n.bookId === b.id)).map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
          
          <button
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap border ${filterFavorites ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-500/30' : 'bg-white dark:bg-[#1A1E29] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20'}`}
          >
            <Star size={16} className={filterFavorites ? "fill-current" : ""} />
            Favoriler
          </button>
          
          <button
            onClick={exportNotes}
            className="flex items-center gap-2 bg-stone-100 dark:bg-white/5 text-stone-700 dark:text-stone-300 px-4 py-3 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-white/10 transition-colors shrink-0"
            title="Notları İndir (TXT)"
          >
            <Download size={18} />
            <span className="hidden sm:inline">İndir</span>
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="columns-1 md:columns-2 gap-6 pb-20">
        <AnimatePresence>
          {filteredNotes.map((note) => {
            const book = getBook(note.bookId);
            const isEditing = editingNoteId === note.id;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-panel anti-gravity p-6 rounded-2xl group break-inside-avoid mb-6 relative overflow-hidden"
              >
                {/* Book Color Accent Line */}
                {book && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${book.coverColor || 'bg-stone-300 dark:bg-stone-600'}`} />
                )}
                <div className={`flex flex-col justify-between items-start gap-4 ${book ? 'pl-2' : ''}`}>
                  <div className="flex-1 w-full">
                    {isEditing ? (
                      <div className="mb-4">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-24 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-stone-700 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveEdit(note.id)}
                            disabled={!editContent.trim()}
                            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <Save size={14} />
                            Kaydet
                          </button>
                          <button
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditContent('');
                            }}
                            className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <X size={14} />
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-700 dark:text-stone-300 text-lg leading-relaxed mb-4 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      <span>{note.createdAt && !isNaN(new Date(note.createdAt).getTime()) ? new Date(note.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                      
                      {note.pageNumber && (
                        <span className="flex items-center gap-1 text-amber-600/80 dark:text-amber-400/80">
                          <Bookmark size={14} />
                          Sayfa {note.pageNumber}
                        </span>
                      )}

                      {book && (
                        <span className="flex items-center gap-1 text-blue-500/80 dark:text-blue-400/80">
                          <BookOpen size={14} />
                          {book.title}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditContent(note.content);
                          }}
                          className="p-2 text-stone-400 hover:text-blue-500 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Bu notu silmek istediğinize emin misiniz?')) {
                              deleteNote(note.id);
                            }
                          }}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleFavoriteNote(note.id)}
                      className={`p-2 rounded-full transition-colors ${
                        note.isFavoriteQuote 
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                          : 'text-stone-400 hover:text-amber-500 hover:bg-stone-100 dark:hover:bg-white/5'
                      }`}
                      title="Favorilere Ekle"
                    >
                      <Star size={18} className={note.isFavoriteQuote ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredNotes.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center text-stone-400 break-inside-avoid">
            <PenLine size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Henüz hiç not eklemediniz.</p>
            <p className="text-sm mt-2">Yukarıdaki alanı kullanarak ilk notunuzu alabilirsiniz.</p>
          </div>
        )}
      </div>
    </div>
  );
}
