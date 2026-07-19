import React from 'react';
import { BookOpen, Star, CheckCircle2, TrendingUp, Quote } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Overview() {
  const { books, notes, stats, theme } = useAppContext();

  const totalBooks = books.length;
  const completedBooks = books.filter(b => b.status === 'completed').length;
  const favoriteBooks = books.filter(b => b.isFavorite).length;
  const currentlyReading = books.filter(b => b.status === 'reading')[0];
  const favoriteNotes = notes.filter(n => n.isFavoriteQuote);

  const statCards = [
    { label: 'Toplam Kitap', value: totalBooks, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Tamamlanan', value: completedBooks, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Favoriler', value: favoriteBooks, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

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
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-2">Genel Bakış</h1>
        <p className="text-stone-500 dark:text-stone-400">Kütüphanenizin güncel durumu ve okuma istatistikleriniz.</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="glass-panel anti-gravity rounded-2xl p-6 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Şu An Okuduğum */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-3xl p-8 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
            
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2 relative z-10">
              <BookOpen size={20} className="text-blue-500" />
              Şu An Okuduğum
            </h2>

            {currentlyReading ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                <div className="w-24 h-36 bg-stone-200 dark:bg-stone-800 rounded-lg shadow-lg overflow-hidden shrink-0">
                  {currentlyReading.coverImageUrl ? (
                    <img src={currentlyReading.coverImageUrl} alt={currentlyReading.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${currentlyReading.coverColor || 'bg-stone-800'}`} />
                  )}
                </div>
                <div className="flex-1 w-full">
                  <h3 className="text-2xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-1">{currentlyReading.title}</h3>
                  <p className="text-stone-500 dark:text-stone-400 mb-6">{currentlyReading.author}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-600 dark:text-stone-400 font-medium">İlerleme</span>
                      <span className="text-stone-900 dark:text-stone-200 font-semibold">
                        {currentlyReading.readPages || 0} / {currentlyReading.pageCount || '?'} sayfa
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((currentlyReading.readPages || 0) / (currentlyReading.pageCount || 1)) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-stone-800 dark:bg-stone-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-stone-500 dark:text-stone-400 relative z-10">
                Şu an okuduğunuz bir kitap bulunmuyor.
              </div>
            )}
          </motion.div>

          {/* Okuma İstatistikleri Grafik */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-3xl p-8"
          >
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" />
              Okuma İstatistikleri
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats}>
                  <defs>
                    <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme === 'dark' ? '#E7E5E4' : '#292524'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme === 'dark' ? '#E7E5E4' : '#292524'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1A1E29' : '#ffffff',
                      borderColor: theme === 'dark' ? '#ffffff20' : '#e7e5e4',
                      borderRadius: '12px',
                      color: theme === 'dark' ? '#ffffff' : '#000000'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pagesRead" 
                    stroke={theme === 'dark' ? '#E7E5E4' : '#292524'} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPages)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Favori Alıntılar */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-3xl p-8 h-full"
          >
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Quote size={20} className="text-amber-500" />
              Favori Alıntılar
            </h2>
            
            <div className="space-y-6">
              {favoriteNotes.length > 0 ? (
                favoriteNotes.slice(0, 5).map((note, idx) => (
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
                  </motion.div>
                ))
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
