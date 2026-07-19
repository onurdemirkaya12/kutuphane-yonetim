import React from 'react';
import { Compass, BookPlus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export function Discover() {
  const { discoverBooks, addBook } = useAppContext();

  const handleAddDiscoverBook = (book: any) => {
    // Omitting id so it gets generated fresh for the user's library
    const { id, ...bookData } = book;
    addBook({
      ...bookData,
      status: 'want-to-read',
      addedAt: Date.now()
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Compass size={32} className="text-amber-500" />
        </div>
        <h1 className="text-4xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-4 tracking-tight">Yeni Dünyalar Keşfet</h1>
        <p className="text-lg text-stone-500 dark:text-stone-400">
          Okuma zevkinize göre özenle seçilmiş, bir sonraki favoriniz olabilecek başyapıtlar.
        </p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8"
      >
        {discoverBooks.map((book) => (
          <motion.div
            key={book.id}
            variants={itemVariants}
            className="group relative"
          >
            {/* Background Glow Effect */}
            <div className={`absolute -inset-1 ${book.coverColor || 'bg-stone-500'} opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 blur-xl transition-all duration-700 rounded-3xl`} />
            
            <div className="glass-panel anti-gravity relative p-6 rounded-3xl flex flex-col items-center text-center h-full">
              <div className="w-32 aspect-[2/3] rounded-lg shadow-xl overflow-hidden mb-6 -mt-12 bg-stone-200 dark:bg-stone-800 ring-4 ring-white dark:ring-[#1A1E29] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                {book.coverImageUrl ? (
                  <img src={book.coverImageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full ${book.coverColor || 'bg-stone-800'}`} />
                )}
              </div>
              
              <h3 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-1">{book.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 mb-6">{book.author}</p>
              
              <div className="mt-auto pt-4 w-full">
                <button
                  onClick={() => handleAddDiscoverBook(book)}
                  className="w-full flex items-center justify-center gap-2 bg-stone-100 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 text-stone-900 dark:text-stone-100 py-3 px-4 rounded-xl font-medium transition-colors group/btn"
                >
                  <BookPlus size={18} className="text-stone-400 group-hover/btn:text-stone-900 dark:group-hover/btn:text-white transition-colors" />
                  Listeme Ekle
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
