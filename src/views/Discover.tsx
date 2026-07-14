import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function Discover() {
  const { discoverBooks, addBook } = useAppContext();

  const handleAdd = (book: any) => {
    addBook({
      title: book.title,
      author: book.author,
      status: 'want-to-read',
      isFavorite: false,
      coverColor: book.coverColor
    });
    alert(`"${book.title}" kütüphanenize eklendi!`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">Keşfet</h1>
        <p className="text-stone-500">Yeni dünyalara açılan kapılar, okumanız için öneriler.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        {discoverBooks.map(book => (
          <div key={book.id} className="group relative flex flex-col">
            <div className={cn(
              "aspect-[2/3] w-full rounded-lg shadow-md mb-4 transition-transform group-hover:-translate-y-1",
              book.coverColor
            )} />
            
            <div className="flex-1">
              <h3 className="font-serif font-medium text-stone-900 leading-tight">{book.title}</h3>
              <p className="text-xs text-stone-500 mt-1">{book.author}</p>
            </div>
            
            <button 
              onClick={() => handleAdd(book)}
              className="mt-4 w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
            >
              <Plus size={16} className="mr-1" />
              Listeme Ekle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
