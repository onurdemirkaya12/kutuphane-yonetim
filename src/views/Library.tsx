import React, { useState, useMemo, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, Clock, CheckCircle2, ChevronRight, MessageSquarePlus, X, Trash2, Edit3, Save, Search, Download, Wand2, Loader2, Heart, LayoutGrid, List, ArrowUpDown, BookmarkPlus, FolderPlus, Copy, Newspaper, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AddBookModal } from '../components/AddBookModal';
import { Book, Shelf } from '../types';

export function Library() {
  const { books, shelves, addShelf, deleteShelf, toggleBookInShelf, updateBookStatus, updateBook, deleteBook, addNote, toggleFavoriteBook, mergeDuplicates } = useAppContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'shelves'>('all');
  const [newShelfName, setNewShelfName] = useState('');
  const [isCreatingShelf, setIsCreatingShelf] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editIsbn, setEditIsbn] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editRating, setEditRating] = useState<number | ''>('');
  const [editEmotion, setEditEmotion] = useState('');
  const [editPageCount, setEditPageCount] = useState<number | ''>('');
  const [editReadPages, setEditReadPages] = useState<number | ''>('');
  const [editQuantity, setEditQuantity] = useState<number | ''>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Book['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'book' | 'magazine' | 'comic'>('all');
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'rating-desc'>('newest');
  
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const [autoFetchProgress, setAutoFetchProgress] = useState({ current: 0, total: 0 });

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(books.map(b => b.category).filter(Boolean))) as string[];
  }, [books]);

  const statusMap = {
    'want-to-read': { label: 'Okunacak', icon: Clock, color: 'text-amber-500' },
    'reading': { label: 'Okunuyor', icon: BookOpen, color: 'text-blue-500' },
    'completed': { label: 'Bitti', icon: CheckCircle2, color: 'text-emerald-500' }
  };

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) || 
                            book.author.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
      const matchesType = typeFilter === 'all' || (book.itemType || 'book') === typeFilter;
      return matchesSearch && matchesStatus && matchesCategory && matchesType;
    }).sort((a, b) => {
      if (sortBy === 'newest') return (b.addedAt || Date.now()) - (a.addedAt || Date.now());
      if (sortBy === 'oldest') return (a.addedAt || Date.now()) - (b.addedAt || Date.now());
      if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      return 0;
    });
  }, [books, deferredSearchQuery, statusFilter, categoryFilter, typeFilter, sortBy]);

  const exportToCSV = () => {
    // UTF-8 BOM ekliyoruz ki Excel Türkçe karakterleri (ş,ğ,ü vb.) sorunsuz okusun
    const bom = '\uFEFF';
    // Türkçe Windows ve Excel varsayılan olarak noktalı virgül (;) ayırıcısını kullanır
    const headers = ['Tür', 'ISBN/ISSN Numarası', 'Yayın Adı', 'Yazar'];
    
    const rows = books.flatMap(book => {
      const quantity = book.quantity || 1;
      const typeLabel = book.itemType === 'magazine' ? 'Dergi' : book.itemType === 'comic' ? 'Çizgi Roman' : 'Kitap';
      const row = [
        `"${typeLabel}"`,
        `"${book.isbn || ''}"`,
        `"${book.title.replace(/"/g, '""')}"`,
        `"${book.author.replace(/"/g, '""')}"`
      ];
      return Array(quantity).fill(row);
    });

    // Bütün alanları noktalı virgül ile birleştiriyoruz
    const csvContent = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kutuphanem_isbn_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const autoFetchMissingCategories = async () => {
    const booksWithoutCategory = books.filter(b => !b.category);
    if (booksWithoutCategory.length === 0) {
      alert("Tüm kitapların zaten bir kategorisi var.");
      return;
    }

    if (!window.confirm(`Kategorisi olmayan ${booksWithoutCategory.length} kitap bulundu. Bunlar için otomatik olarak Google Books ve Open Library üzerinden kategori aranacak. Devam etmek istiyor musunuz?`)) {
        return;
    }

    setIsAutoFetching(true);
    setAutoFetchProgress({ current: 0, total: booksWithoutCategory.length });

    let updatedCount = 0;

    const findCategory = async (query: string, isIsbn = false) => {
      try {
        // 1. Google Books API
        const gbQuery = isIsbn ? `isbn:${query}` : encodeURIComponent(query);
        const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${gbQuery}&maxResults=5`);
        if (gbResponse.ok) {
          const gbData = await gbResponse.json();
          if (gbData.items) {
            for (const item of gbData.items) {
              if (item.volumeInfo?.categories && item.volumeInfo.categories.length > 0) {
                return item.volumeInfo.categories.join(', ');
              }
            }
          }
        }

        // 2. Open Library API
        const olQuery = isIsbn ? `isbn=${query}` : `q=${encodeURIComponent(query)}&limit=5`;
        const olResponse = await fetch(`https://openlibrary.org/search.json?${olQuery}`);
        if (olResponse.ok) {
          const olData = await olResponse.json();
          if (olData.docs) {
            for (const doc of olData.docs) {
              if (doc.subject && doc.subject.length > 0) {
                // Return up to 2 subjects from Open Library as they can be very long
                return doc.subject.slice(0, 2).join(', ');
              }
            }
          }
        }
      } catch (e) {
        console.error("Error fetching for", query, e);
      }
      return null;
    };

    for (let i = 0; i < booksWithoutCategory.length; i++) {
      const book = booksWithoutCategory[i];
      try {
        let categoryToUpdate = null;
        
        // Try with ISBN if available
        if (book.isbn) {
            const cleanIsbn = book.isbn.replace(/[- ]/g, '');
            categoryToUpdate = await findCategory(cleanIsbn, true);
        } 
        
        // Try with Title + Author
        if (!categoryToUpdate) {
            categoryToUpdate = await findCategory(`${book.title} ${book.author}`);
        }

        // Try with just Title as a last resort
        if (!categoryToUpdate) {
            categoryToUpdate = await findCategory(book.title);
        }

        if (categoryToUpdate) {
          updateBook(book.id, { category: categoryToUpdate });
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${book.title}:`, error);
      }
      
      setAutoFetchProgress({ current: i + 1, total: booksWithoutCategory.length });
      // Add a larger delay (1000ms) to respect free API rate limits (Google Books & Open Library)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsAutoFetching(false);
    alert(`${booksWithoutCategory.length} kitaptan ${updatedCount} tanesinin kategorisi otomatik olarak bulundu ve güncellendi.`);
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
            onClick={autoFetchMissingCategories}
            disabled={isAutoFetching}
            className="anti-gravity flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-3 rounded-xl font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
            title="Eksik Kategorileri Otomatik Bul"
          >
            {isAutoFetching ? <Loader2 size={20} className="animate-spin" /> : <Wand2 size={20} />}
            <span className="hidden sm:inline">
              {isAutoFetching ? `${autoFetchProgress.current}/${autoFetchProgress.total} Bulunuyor...` : 'Otomatik Kategori Bul'}
            </span>
          </button>
          
          <button
            onClick={async () => {
              if (window.confirm('Bu işlem aynı isme sahip eski kayıtlı kitapları birleştirip adet (miktar) olarak sayacaktır. Devam etmek istiyor musunuz?')) {
                setIsMerging(true);
                try {
                  await mergeDuplicates();
                  alert('Eski kitaplarınız başarıyla birleştirildi!');
                } catch (e) {
                  alert('Hata oluştu.');
                  console.error(e);
                } finally {
                  setIsMerging(false);
                }
              }
            }}
            disabled={isMerging}
            className="anti-gravity flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
            title="Yinelenenleri Birleştir"
          >
            {isMerging ? <Loader2 size={20} className="animate-spin" /> : <Copy size={20} />}
            <span className="hidden sm:inline">Birleştir</span>
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

      <div className="flex border-b border-stone-200 dark:border-white/10 mb-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${activeTab === 'all' ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
        >
          Tüm Kitaplar
        </button>
        <button
          onClick={() => setActiveTab('shelves')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'shelves' ? 'border-amber-500 text-amber-600 dark:text-amber-500' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
        >
          <BookmarkPlus size={18} />
          Özel Raflarım
        </button>
      </div>

      {activeTab === 'all' && (
        <>
          <div className="flex flex-col lg:flex-row gap-4 mb-8">
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
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex-wrap sm:flex-nowrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="all">Tüm Türler</option>
            <option value="book">Kitaplar</option>
            <option value="magazine">Dergiler</option>
            <option value="comic">Çizgi Romanlar</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="all">Tüm Kategoriler</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="want-to-read">Okunacaklar</option>
            <option value="reading">Okunanlar</option>
            <option value="completed">Bitenler</option>
          </select>
          <div className="relative min-w-[140px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <ArrowUpDown size={16} />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-9 pr-4 py-3 bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-500 dark:text-stone-200 cursor-pointer appearance-none"
            >
              <option value="newest">En Yeniler</option>
              <option value="oldest">En Eskiler</option>
              <option value="title-asc">İsim (A-Z)</option>
              <option value="title-desc">İsim (Z-A)</option>
              <option value="rating-desc">En Yüksek Puan</option>
            </select>
          </div>
          
          <div className="flex bg-white dark:bg-[#1A1E29] border border-stone-200 dark:border-white/10 rounded-xl p-1 ml-auto shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              title="Izgara Görünümü"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-stone-100 dark:bg-white/10 text-stone-900 dark:text-white' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              title="Liste Görünümü"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <motion.div 
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        >
          <AnimatePresence>
            {filteredBooks.map((book) => {
              const StatusIcon = statusMap[book.status].icon;
              const progress = book.pageCount && book.readPages ? Math.round((book.readPages / book.pageCount) * 100) : 0;
              
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

                    {/* Item Type Badge */}
                    {book.itemType === 'magazine' && (
                      <div className="absolute bottom-2 left-2 bg-purple-500/90 text-white backdrop-blur p-1.5 rounded-lg shadow-sm z-10" title="Dergi">
                        <Newspaper size={14} />
                      </div>
                    )}
                    {book.itemType === 'comic' && (
                      <div className="absolute bottom-2 left-2 bg-pink-500/90 text-white backdrop-blur p-1.5 rounded-lg shadow-sm z-10" title="Çizgi Roman">
                        <ImageIcon size={14} />
                      </div>
                    )}

                    {/* Favorite Toggle Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteBook(book.id);
                      }}
                      className={`absolute top-2 left-2 p-1.5 rounded-lg shadow-sm backdrop-blur transition-all opacity-0 group-hover:opacity-100 ${book.isFavorite ? 'bg-red-500/90 text-white opacity-100' : 'bg-white/90 dark:bg-stone-900/90 text-stone-400 hover:text-red-500'}`}
                    >
                      <Heart size={14} className={book.isFavorite ? "fill-current" : ""} />
                    </button>
                    
                    {/* Progress Bar for Reading */}
                    {book.status === 'reading' && book.pageCount && (
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 truncate flex items-center gap-2">
                    <span className="truncate">{book.title}</span>
                    {book.quantity && book.quantity > 1 && (
                      <span className="shrink-0 text-xs font-sans font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 px-1.5 py-0.5 rounded-md">
                        x{book.quantity}
                      </span>
                    )}
                  </h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm truncate">{book.author}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence>
            {filteredBooks.map((book) => {
              const StatusIcon = statusMap[book.status].icon;
              const progress = book.pageCount && book.readPages ? Math.round((book.readPages / book.pageCount) * 100) : 0;
              
              return (
                <motion.div
                  layoutId={`book-${book.id}`}
                  key={book.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedBook(book)}
                  className="anti-gravity cursor-pointer group flex items-center gap-4 bg-white dark:bg-[#1A1E29] p-3 rounded-2xl border border-stone-200 dark:border-white/5 hover:border-stone-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="w-12 h-16 shrink-0 rounded-lg shadow-sm overflow-hidden bg-stone-200 dark:bg-stone-800 relative">
                    {book.coverImageUrl ? (
                      <img 
                        src={book.coverImageUrl} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full ${book.coverColor || 'bg-stone-800'}`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-stone-900 dark:text-stone-100 truncate flex items-center gap-2">
                      <span className="truncate">{book.title}</span>
                      {book.quantity && book.quantity > 1 && (
                        <span className="shrink-0 text-xs font-sans font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-500 px-1.5 py-0.5 rounded-md">
                          x{book.quantity}
                        </span>
                      )}
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400 text-sm truncate">{book.author}</p>
                  </div>
                  
                  <div className="hidden md:flex flex-col items-start w-32 shrink-0">
                    <div className="flex items-center gap-1 mb-1 text-xs text-stone-500 dark:text-stone-400">
                      {book.itemType === 'magazine' ? <><Newspaper size={12} /> Dergi</> : book.itemType === 'comic' ? <><ImageIcon size={12} /> Çizgi Roman</> : <><BookOpen size={12} /> Kitap</>}
                    </div>
                    {book.category && (
                      <span className="inline-block bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-md text-xs font-medium border border-stone-200 dark:border-white/10 truncate max-w-full">
                        {book.category}
                      </span>
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col items-end justify-center w-32 shrink-0 gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                      <StatusIcon size={14} className={statusMap[book.status].color} />
                      {statusMap[book.status].label}
                    </div>
                    {book.status === 'reading' && book.pageCount && (
                      <div className="w-full flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-500">{progress}%</span>
                      </div>
                    )}
                    {book.status === 'completed' && book.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                        ⭐ {book.rating}/10
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteBook(book.id);
                      }}
                      className={`p-2 rounded-full transition-colors ${book.isFavorite ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-white/5'}`}
                    >
                      <Heart size={18} className={book.isFavorite ? "fill-current" : ""} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {activeTab === 'all' && books.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center justify-center text-stone-400">
          <BookOpen size={64} className="mb-4 opacity-50" />
          <p className="text-lg">Kütüphaneniz şu an boş.</p>
          <p className="text-sm mt-2">Sağ üstteki butona tıklayarak kitap eklemeye başlayabilirsiniz.</p>
        </div>
      )}
      </>
      )}

      {activeTab === 'shelves' && (
        <div className="space-y-12">
          {isCreatingShelf ? (
            <div className="flex items-center gap-4 bg-white dark:bg-[#1A1E29] p-4 rounded-2xl border border-stone-200 dark:border-white/10 max-w-md">
              <input 
                type="text"
                autoFocus
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                placeholder="Raf Adı (Örn: Yazın Okunacaklar)"
                className="flex-1 bg-stone-100 dark:bg-black/20 border-none rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800 dark:text-stone-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newShelfName.trim()) {
                    addShelf(newShelfName.trim(), 'bg-stone-500');
                    setNewShelfName('');
                    setIsCreatingShelf(false);
                  }
                }}
              />
              <button 
                onClick={() => {
                  if (newShelfName.trim()) {
                    addShelf(newShelfName.trim(), 'bg-stone-500');
                  }
                  setNewShelfName('');
                  setIsCreatingShelf(false);
                }}
                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Oluştur
              </button>
              <button onClick={() => setIsCreatingShelf(false)} className="p-2 text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreatingShelf(true)}
              className="flex items-center gap-2 text-amber-600 dark:text-amber-500 font-medium hover:underline bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-500/20 transition-colors w-fit"
            >
              <FolderPlus size={18} /> Yeni Raf Oluştur
            </button>
          )}

          {shelves.length === 0 && !isCreatingShelf && (
            <div className="py-20 text-center flex flex-col items-center justify-center text-stone-400">
              <BookmarkPlus size={64} className="mb-4 opacity-50" />
              <p className="text-lg">Henüz hiç raf oluşturmadınız.</p>
              <p className="text-sm mt-2">Özel listeler yapmak için yeni raf oluşturun ve kitaplarınızı ekleyin.</p>
            </div>
          )}

          {shelves.map(shelf => {
            const shelfBooks = books.filter(b => shelf.bookIds.includes(b.id));
            
            return (
              <div key={shelf.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-3">
                    {shelf.name}
                    <span className="text-sm font-sans font-medium text-stone-400 bg-stone-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full">{shelfBooks.length} Kitap</span>
                  </h2>
                  <button onClick={() => {
                    if(window.confirm(`'${shelf.name}' rafını silmek istediğinize emin misiniz? (İçindeki kitaplar silinmez)`)) {
                      deleteShelf(shelf.id);
                    }
                  }} className="text-stone-400 hover:text-red-500 p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {shelfBooks.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-stone-200 dark:border-white/10 rounded-2xl text-center text-stone-400 text-sm">
                    Bu raf şu an boş. Kitap detayına girerek bu rafa kitap ekleyebilirsiniz.
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
                    {shelfBooks.map(book => (
                      <div 
                        key={book.id} 
                        onClick={() => setSelectedBook(book)}
                        className="w-32 sm:w-40 shrink-0 snap-start cursor-pointer group"
                      >
                        <div className="aspect-[2/3] rounded-xl shadow-md overflow-hidden mb-3 bg-stone-200 dark:bg-stone-800 relative">
                          {book.coverImageUrl ? (
                            <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className={`w-full h-full ${book.coverColor || 'bg-stone-800'}`} />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleBookInShelf(shelf.id, book.id); }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Raftan Çıkar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <h3 className="font-medium text-stone-900 dark:text-stone-100 text-sm truncate">{book.title}</h3>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddBookModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Book Detail Expanded Modal */}
      {document.body ? createPortal(
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
                          if (editCategory) updates.category = editCategory;
                          if (editPageCount !== '') updates.pageCount = Number(editPageCount);
                          if (editReadPages !== '') updates.readPages = Number(editReadPages);
                          if (editQuantity !== '') updates.quantity = Number(editQuantity);
                          
                          if (selectedBook.status === 'completed') {
                            if (editRating !== '') updates.rating = Number(editRating);
                            if (editEmotion) updates.emotion = editEmotion;
                          }
                          
                          updateBook(selectedBook.id, updates);
                          setSelectedBook({ ...selectedBook, ...updates });
                          setIsEditing(false);
                        } else {
                          setEditTitle(selectedBook.title);
                          setEditAuthor(selectedBook.author);
                          setEditDescription(selectedBook.description || '');
                          setEditCoverUrl(selectedBook.coverImageUrl || '');
                          setEditIsbn(selectedBook.isbn || '');
                          setEditCategory(selectedBook.category || '');
                          setEditPageCount(selectedBook.pageCount || '');
                          setEditReadPages(selectedBook.readPages || '');
                          setEditQuantity(selectedBook.quantity || 1);
                          setEditRating(selectedBook.rating || '');
                          setEditEmotion(selectedBook.emotion || '');
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
                        className="text-lg text-stone-500 dark:text-stone-400 mb-2 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500"
                        placeholder="Yazar"
                      />
                      <input 
                        type="text" 
                        value={editCategory} 
                        onChange={e => setEditCategory(e.target.value)} 
                        className="text-sm text-stone-600 dark:text-stone-400 mb-4 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500"
                        placeholder="Kategori (Örn: Roman, Psikoloji)"
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

                      <label className="block text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1 mt-4">Adet (Miktar)</label>
                      <input 
                        type="number"
                        min="1" 
                        value={editQuantity} 
                        onChange={e => setEditQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                        className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                        placeholder="Örn: 1"
                      />

                      <div className="flex gap-4 mt-4">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1">Toplam Sayfa</label>
                          <input 
                            type="number" 
                            value={editPageCount} 
                            onChange={e => setEditPageCount(e.target.value === '' ? '' : Number(e.target.value))} 
                            className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                            placeholder="Örn: 350"
                          />
                        </div>
                        {selectedBook.status === 'reading' && (
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-blue-600 dark:text-blue-500 uppercase tracking-wider mb-1">Okunan Sayfa</label>
                            <input 
                              type="number" 
                              value={editReadPages} 
                              onChange={e => setEditReadPages(e.target.value === '' ? '' : Number(e.target.value))} 
                              className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                              placeholder="Örn: 120"
                            />
                          </div>
                        )}
                      </div>

                      {selectedBook.status === 'completed' && (
                        <div className="flex gap-4 mt-4">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Puanınız (1-10)</label>
                            <input 
                              type="number" 
                              min="1" max="10"
                              value={editRating} 
                              onChange={e => setEditRating(e.target.value === '' ? '' : Number(e.target.value))} 
                              className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                              placeholder="Örn: 9"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-1">Duygu Etiketi</label>
                            <input 
                              type="text" 
                              value={editEmotion} 
                              onChange={e => setEditEmotion(e.target.value)} 
                              className="text-sm text-stone-600 dark:text-stone-300 w-full bg-transparent border-b border-stone-300 dark:border-stone-700 focus:outline-none focus:border-stone-500 pb-1"
                              placeholder="Örn: Sarsıcı, İlham Verici"
                              list="emotionOptions"
                            />
                            <datalist id="emotionOptions">
                              <option value="Sarsıcı" />
                              <option value="İlham Verici" />
                              <option value="Hüzünlü" />
                              <option value="Eğlenceli" />
                              <option value="Ufuk Açıcı" />
                              <option value="Sürükleyici" />
                              <option value="Düşündürücü" />
                            </datalist>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2 pr-24">{selectedBook.title}</h2>
                      <p className="text-lg text-stone-500 dark:text-stone-400 mb-2">{selectedBook.author}</p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {selectedBook.category && (
                          <span className="inline-block bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-300 px-3 py-1 rounded-full text-xs font-medium border border-stone-200 dark:border-white/10">
                            {selectedBook.category}
                          </span>
                        )}
                        {selectedBook.status === 'completed' && selectedBook.rating && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-900/50">
                            ⭐ {selectedBook.rating}/10
                          </span>
                        )}
                        {selectedBook.status === 'completed' && selectedBook.emotion && (
                          <span className="inline-block bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-900/50">
                            {selectedBook.emotion}
                          </span>
                        )}
                      </div>
                      {!selectedBook.category && !selectedBook.rating && !selectedBook.emotion && <div className="mb-6" />}
                      
                      {/* Raf Seçimi */}
                      {shelves.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Bulunduğu Raflar</p>
                          <div className="flex flex-wrap gap-2">
                            {shelves.map(shelf => {
                              const inShelf = shelf.bookIds.includes(selectedBook.id);
                              return (
                                <button
                                  key={shelf.id}
                                  onClick={() => toggleBookInShelf(shelf.id, selectedBook.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                                    inShelf 
                                      ? 'bg-amber-500 text-white border-amber-500' 
                                      : 'bg-stone-50 dark:bg-[#151820] text-stone-500 dark:text-stone-400 border-stone-200 dark:border-white/10 hover:border-amber-500 hover:text-amber-500'
                                  }`}
                                >
                                  {inShelf ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                                  {shelf.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                              if (!selectedBook.category && volumeInfo.categories && volumeInfo.categories.length > 0) {
                                updates.category = volumeInfo.categories.join(', ');
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
                                if (!selectedBook.category && !updates.category && doc.subject && doc.subject.length > 0) {
                                  updates.category = doc.subject[0];
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
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
}
