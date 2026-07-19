import React from 'react';
import { BookOpen, Star, CheckCircle2, TrendingUp, Quote, Clock, Activity, Target } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Book } from '../types';

export function Overview() {
  const { books, notes, stats, theme } = useAppContext();

  const totalBooks = books.length;
  const completedBooksList = books.filter(b => b.status === 'completed');
  const favoriteBooks = books.filter(b => b.isFavorite).length;
  const currentlyReading = books.filter(b => b.status === 'reading');
  const favoriteNotes = notes.filter(n => n.isFavoriteQuote);

  const activeBook = currentlyReading[0];

  // Prepare Genre Donut Data
  const genreDataMap = new Map<string, number>();
  books.forEach(b => {
    if (b.category) {
      const genres = b.category.split(',').map(s => s.trim());
      genres.forEach(g => {
        if (g) genreDataMap.set(g, (genreDataMap.get(g) || 0) + 1);
      });
    }
  });
  const genreData = Array.from(genreDataMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // top 5
  const PIE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  // Completed Books for Data Grid
  const gridBooks = [...completedBooksList].sort((a, b) => (b.endDate || 0) - (a.endDate || 0));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Live Status Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-stone-900 dark:bg-black text-stone-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-sm sm:text-base uppercase tracking-wider text-stone-400">Canlı Durum:</span>
        </div>
        
        <div className="flex-1 flex justify-center sm:justify-start items-center relative z-10">
          {activeBook ? (
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold text-white">
                Şu an okunuyor: {activeBook.title}
              </span>
              <span className="text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded text-sm">
                %{Math.round(((activeBook.readPages || 0) / (activeBook.pageCount || 1)) * 100)}
              </span>
            </div>
          ) : (
            <span className="font-serif text-lg text-stone-300 italic">
              Yeni kitap arayışında...
            </span>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Toplam Kitap</p>
            <h3 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{totalBooks}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><BookOpen size={24} /></div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Tamamlanan</p>
            <h3 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{completedBooksList.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Okunuyor</p>
            <h3 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{currentlyReading.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center"><Activity size={24} /></div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">Favori Kitap</p>
            <h3 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{favoriteBooks}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center"><Star size={24} /></div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Zaman Çizelgesi (Timeline) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-3xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-500" />
              Aylık Okuma Özeti
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff10' : '#00000010'} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme === 'dark' ? '#A8A29E' : '#78716C', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: theme === 'dark' ? '#A8A29E' : '#78716C', fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: theme === 'dark' ? '#ffffff05' : '#00000005' }}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1A1E29' : '#ffffff',
                      borderColor: theme === 'dark' ? '#ffffff20' : '#e7e5e4',
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#ffffff' : '#000000'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: theme === 'dark' ? '#A8A29E' : '#78716C' }} />
                  <Bar name="Sayfa Sayısı" dataKey="pagesRead" fill={theme === 'dark' ? '#3B82F6' : '#2563EB'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Data Grid: Okuma Geçmişi */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden"
          >
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-emerald-500" />
              Okuma Geçmişi
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    <th className="py-4 px-2 font-medium">Kitap Adı</th>
                    <th className="py-4 px-2 font-medium">Tür</th>
                    <th className="py-4 px-2 font-medium">Sayfa</th>
                    <th className="py-4 px-2 font-medium">Puan</th>
                    <th className="py-4 px-2 font-medium">Duygu</th>
                    <th className="py-4 px-2 font-medium text-right">Tarih</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-stone-100 dark:divide-stone-800/50">
                  {gridBooks.length > 0 ? gridBooks.slice(0, 5).map(book => (
                    <tr key={book.id} className="hover:bg-stone-50 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-2 font-medium text-stone-900 dark:text-stone-100">{book.title}</td>
                      <td className="py-3 px-2 text-stone-600 dark:text-stone-400">{book.category?.split(',')[0] || '-'}</td>
                      <td className="py-3 px-2 text-stone-600 dark:text-stone-400">{book.pageCount || '-'}</td>
                      <td className="py-3 px-2">
                        {book.rating ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Star size={12} className="fill-current" /> {book.rating}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-2">
                        {book.emotion ? (
                          <span className="inline-block px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs">
                            {book.emotion}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-stone-500 dark:text-stone-500">
                        {book.endDate ? new Date(book.endDate).toLocaleDateString('tr-TR') : '-'}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-500">Henüz bitirdiğiniz bir kitap bulunmuyor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-1 space-y-8">
          {/* Okuma DNA'sı (Donut) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-3xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Target size={20} className="text-purple-500" />
              Okuma DNA'sı
            </h2>
            <div className="h-64 flex items-center justify-center relative">
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1A1E29' : '#ffffff',
                        borderColor: theme === 'dark' ? '#ffffff20' : '#e7e5e4',
                        borderRadius: '12px',
                        color: theme === 'dark' ? '#ffffff' : '#000000',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: theme === 'dark' ? '#ffffff' : '#000000' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-stone-500 text-sm">Yeterli kategori verisi yok.</p>
              )}
              {/* Center Text */}
              {genreData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{genreData[0]?.value}</span>
                  <span className="text-xs text-stone-500 uppercase tracking-wider">{genreData[0]?.name}</span>
                </div>
              )}
            </div>
            {/* Custom Legend */}
            {genreData.length > 0 && (
              <div className="mt-4 space-y-2">
                {genreData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-stone-600 dark:text-stone-400">{entry.name}</span>
                    </div>
                    <span className="font-medium text-stone-900 dark:text-stone-200">{entry.value}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Favori Alıntılar */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-3xl p-6 sm:p-8"
          >
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Quote size={20} className="text-amber-500" />
              Favori Alıntılar
            </h2>
            
            <div className="space-y-6">
              {favoriteNotes.length > 0 ? (
                favoriteNotes.slice(0, 5).map((note, idx) => {
                  const book = books.find(b => b.id === note.bookId);
                  return (
                    <motion.div 
                      key={note.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + (idx * 0.1) }}
                      className="relative pl-6"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/20 rounded-full" />
                      <p className="text-stone-700 dark:text-stone-300 text-sm italic leading-relaxed">
                        "{note.content}"
                      </p>
                      {book && (
                        <p className="text-xs text-stone-500 mt-2 font-medium">— {book.title}</p>
                      )}
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-stone-500 dark:text-stone-400 text-sm text-center py-8">
                  Henüz favori bir alıntınız yok.
                </div>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
