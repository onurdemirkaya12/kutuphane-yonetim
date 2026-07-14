import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus, X, Star } from 'lucide-react';
import { cn } from '../lib/utils';

export function Library() {
  const { books, addBook, addBooksBulk, toggleFavoriteBook, updateBookStatus } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif font-bold text-stone-800">Kütüphanem</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-stone-800 hover:bg-stone-900 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" />
          Hızlı Yeni Kitap Ekle
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {books.map(book => (
          <div key={book.id} className="group relative">
            <div className={cn(
              "aspect-[2/3] w-full rounded-lg shadow-md mb-3 transition-transform group-hover:-translate-y-1",
              book.coverColor
            )} />
            
            <button 
              onClick={() => toggleFavoriteBook(book.id)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-colors"
            >
              <Star size={16} className={cn(book.isFavorite ? "fill-amber-400 text-amber-400" : "text-white/80")} />
            </button>
            
            <h3 className="font-serif font-medium text-stone-900 leading-tight">{book.title}</h3>
            <p className="text-xs text-stone-500 mt-1">{book.author}</p>
            
            <div className="mt-2">
              <select 
                value={book.status}
                onChange={(e) => updateBookStatus(book.id, e.target.value as any)}
                className="text-xs bg-stone-100 border-none rounded-md px-2 py-1 text-stone-600 focus:ring-0 cursor-pointer"
              >
                <option value="want-to-read">Okunacak</option>
                <option value="reading">Okunuyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AddBookModal onClose={() => setIsModalOpen(false)} onAddSingle={addBook} onAddBulk={addBooksBulk} />
      )}
    </div>
  );
}

function AddBookModal({ 
  onClose, 
  onAddSingle, 
  onAddBulk 
}: { 
  onClose: () => void, 
  onAddSingle: (book: any) => void,
  onAddBulk: (text: string) => void 
}) {
  const [tab, setTab] = useState<'single'|'bulk'>('single');
  
  // Single State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  
  // Bulk State
  const [bulkText, setBulkText] = useState('');

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const colors = ['bg-red-800', 'bg-blue-800', 'bg-emerald-800', 'bg-amber-800', 'bg-purple-800', 'bg-stone-800'];
    onAddSingle({
      title,
      author: author || 'Bilinmeyen Yazar',
      status: 'want-to-read',
      isFavorite: false,
      coverColor: colors[Math.floor(Math.random() * colors.length)]
    });
    onClose();
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    onAddBulk(bulkText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-xl font-serif font-semibold text-stone-800">Hızlı Kitap Ekle</h2>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50">
            <X size={20} />
          </button>
        </div>
        
        <div className="px-6 pt-4">
          <div className="flex space-x-1 bg-stone-100 p-1 rounded-lg">
            <button 
              onClick={() => setTab('single')}
              className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-colors", tab === 'single' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700")}
            >
              Tekli Ekle
            </button>
            <button 
              onClick={() => setTab('bulk')}
              className={cn("flex-1 py-1.5 text-sm font-medium rounded-md transition-colors", tab === 'bulk' ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700")}
            >
              Çoklu Ekle
            </button>
          </div>
        </div>

        <div className="p-6">
          {tab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Kitap Adı</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800/20 focus:border-stone-500"
                  placeholder="Örn: Yabancı"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Yazar (Opsiyonel)</label>
                <input 
                  type="text" 
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800/20 focus:border-stone-500"
                  placeholder="Örn: Albert Camus"
                />
              </div>
              <button type="submit" className="w-full bg-stone-800 hover:bg-stone-900 text-white py-2.5 rounded-xl font-medium mt-6 transition-colors">
                Kitabı Ekle
              </button>
            </form>
          ) : (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Kitap Listesi</label>
                <p className="text-xs text-stone-500 mb-2">Her satıra bir kitap gelecek şekilde yazın (Kitap Adı - Yazar)</p>
                <textarea 
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-800/20 focus:border-stone-500 resize-none"
                  placeholder="Yabancı - Albert Camus&#10;Dava - Franz Kafka"
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full bg-stone-800 hover:bg-stone-900 text-white py-2.5 rounded-xl font-medium mt-6 transition-colors">
                Toplu Ekle
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
