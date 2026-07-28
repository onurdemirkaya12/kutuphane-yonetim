import React, { useState, useMemo } from 'react';
import { BookOpen, Star, CheckCircle2, TrendingUp, Quote, Clock, Activity, Target, Flame, Award, ChevronRight, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

export function Overview() {
  const { books, notes, theme, updateBook, updateBookStatus } = useAppContext();

  // --- 1. Dinamik İstatistikler ve Trend ---
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const monthlyStats = useMemo(() => {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const stats = months.map(m => ({ month: m, pagesRead: 0, booksRead: 0 }));
    
    books.forEach(b => {
      if (b.status === 'completed' && b.endDate) {
        const date = new Date(b.endDate);
        if (date.getFullYear() === currentYear) {
          stats[date.getMonth()].pagesRead += (b.pageCount || 0);
          stats[date.getMonth()].booksRead += 1;
        }
      }
    });
    return stats;
  }, [books, currentYear]);

  const thisMonthPages = monthlyStats[currentMonth].pagesRead;
  const lastMonthPages = currentMonth > 0 ? monthlyStats[currentMonth - 1].pagesRead : 0;
  
  let trendText = "Harika bir başlangıç!";
  let trendIsPositive = true;
  if (lastMonthPages > 0) {
     const diff = thisMonthPages - lastMonthPages;
     const percentage = Math.round((Math.abs(diff) / lastMonthPages) * 100);
     if (diff >= 0) {
        trendText = `Geçen aya göre %${percentage} daha fazla sayfa! 🔥`;
     } else {
        trendText = `Geçen aya göre %${percentage} daha az sayfa.`;
        trendIsPositive = false;
     }
  }

  // --- 2. Yıllık Okuma Hedefi (Progress Ring) ---
  const [readingGoal, setReadingGoal] = useState(() => {
    const saved = localStorage.getItem('readingGoal');
    return saved ? parseInt(saved, 10) : 50;
  });

  const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) || 1;
    setReadingGoal(val);
    localStorage.setItem('readingGoal', val.toString());
  };

  const completedThisYear = books.filter(b => b.status === 'completed' && b.endDate && new Date(b.endDate).getFullYear() === currentYear).length;
  const goalProgress = Math.min((completedThisYear / readingGoal) * 100, 100);
  const goalStrokeDashoffset = 283 - (283 * goalProgress) / 100; // 283 is approx 2 * pi * r (r=45)

  // --- 3. Akıllı Canlı Durum Afişi ---
  const currentlyReading = books.filter(b => b.status === 'reading');
  const activeBook = currentlyReading[0];
  const [progressUpdate, setProgressUpdate] = useState('');
  const [showProgressInput, setShowProgressInput] = useState(false);

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
    .slice(0, 5);
  const PIE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

  const smartRecommendation = useMemo(() => {
    if (activeBook) return null;
    const topGenre = genreData[0]?.name;
    const wantToRead = books.filter(b => b.status === 'want-to-read');
    if (topGenre) {
      const match = wantToRead.find(b => b.category?.includes(topGenre));
      if (match) return match;
    }
    return wantToRead.length > 0 ? wantToRead[Math.floor(Math.random() * wantToRead.length)] : null;
  }, [activeBook, books, genreData]);

  const handleUpdateProgress = () => {
    if (activeBook && progressUpdate) {
      updateBook(activeBook.id, { readPages: parseInt(progressUpdate, 10) });
      setShowProgressInput(false);
      setProgressUpdate('');
    }
  };

  // --- 4. Başyapıtlar Vitrini ---
  const masterpieces = books.filter(b => b.isFavorite || b.rating === 5).slice(0, 10);

  // --- 5. Okuma Isı Haritası (Activity Heatmap) ---
  const heatmapData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      
      let count = 0;
      books.forEach(b => {
        if (b.addedAt && new Date(b.addedAt).toISOString().split('T')[0] === dayStr) count++;
        if (b.endDate && new Date(b.endDate).toISOString().split('T')[0] === dayStr) count += 2;
      });
      notes.forEach(n => {
        if (n.createdAt && new Date(n.createdAt).toISOString().split('T')[0] === dayStr) count++;
      });
      
      days.push({ date: d, count, dateStr: dayStr });
    }
    return days;
  }, [books, notes]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return theme === 'dark' ? 'bg-stone-800/50' : 'bg-stone-100';
    if (count === 1) return 'bg-emerald-300 dark:bg-emerald-900/60';
    if (count === 2) return 'bg-emerald-400 dark:bg-emerald-700/80';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  // Basic Stats
  const favoriteNotes = notes.filter(n => n.isFavoriteQuote);
  const gridBooks = [...books.filter(b => b.status === 'completed')].sort((a, b) => (b.endDate || 0) - (a.endDate || 0));

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Canlı Durum Afişi */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-stone-900 dark:bg-black text-stone-100 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-[100px]" />
        </div>

        <div className="relative z-10 w-full">
          {activeBook ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
              <div className="flex items-start gap-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden shadow-lg shrink-0">
                  {activeBook.coverImageUrl ? (
                    <img src={activeBook.coverImageUrl} alt={activeBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full ${activeBook.coverColor} flex items-center justify-center`}><BookOpen size={24} className="text-white/50"/></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs uppercase tracking-wider text-stone-400 font-semibold">Şu An Okuyorsunuz</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white mb-1">{activeBook.title}</h3>
                  <p className="text-stone-400 text-sm">{activeBook.author}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-400">
                    %{activeBook.pageCount ? Math.round(((activeBook.readPages || 0) / activeBook.pageCount) * 100) : 0}
                  </div>
                  <div className="text-xs text-stone-400">{activeBook.readPages || 0} / {activeBook.pageCount || '?'} Sayfa</div>
                </div>
                <div className="h-10 w-px bg-white/10 mx-2" />
                {!showProgressInput ? (
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setShowProgressInput(true)} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-sm font-medium rounded-lg transition-colors">İlerlemeyi Güncelle</button>
                    <button onClick={() => updateBookStatus(activeBook.id, 'completed')} className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium rounded-lg transition-colors">Kitabı Bitirdim</button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number" 
                      autoFocus
                      placeholder="Sayfa"
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateProgress()}
                      className="w-20 px-2 py-1.5 bg-black/50 border border-white/20 rounded-lg text-white text-sm focus:outline-none"
                    />
                    <button onClick={handleUpdateProgress} className="px-3 py-1.5 bg-amber-500 text-stone-900 text-sm font-bold rounded-lg hover:bg-amber-400">Kaydet</button>
                    <button onClick={() => setShowProgressInput(false)} className="px-2 py-1.5 text-stone-400 hover:text-white"><X size={18}/></button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
              <div>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">Okunacak Kitap Yok</h3>
                <p className="text-stone-400">Şu an okuduğunuz bir kitap bulunmuyor. Yeni bir maceraya atılmanın tam zamanı!</p>
              </div>
              {smartRecommendation && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors group" onClick={() => updateBookStatus(smartRecommendation.id, 'reading')}>
                  <div className="w-12 h-16 rounded overflow-hidden shrink-0">
                     {smartRecommendation.coverImageUrl ? (
                        <img src={smartRecommendation.coverImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${smartRecommendation.coverColor}`} />
                      )}
                  </div>
                  <div>
                    <span className="text-xs text-amber-400 font-medium tracking-wider uppercase mb-1 block">Yapay Zeka Önerisi</span>
                    <h4 className="font-medium text-white line-clamp-1">{smartRecommendation.title}</h4>
                    <p className="text-sm text-stone-400">Okumaya Başla <ChevronRight size={14} className="inline group-hover:translate-x-1 transition-transform"/></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Kolon */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* İstatistik Kartları */}
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><BookOpen size={20} /></div>
                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{books.reduce((sum, b) => sum + (b.quantity || 1), 0)}</span>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Toplam Kitap</p>
            </motion.div>
            <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle2 size={20} /></div>
                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{completedThisYear}</span>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Bu Yıl Biten</p>
            </motion.div>
            <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Activity size={20} /></div>
                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{currentlyReading.length}</span>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Şu An Okunan</p>
            </motion.div>
            <motion.div variants={itemVariants} className="glass-panel anti-gravity rounded-2xl p-5 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><Star size={20} /></div>
                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">{books.filter(b=>b.isFavorite).length}</span>
              </div>
              <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Favoriler</p>
            </motion.div>
          </motion.div>

          {/* Aylık Okuma Özeti */}
          <motion.div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-blue-500" />
                  Aylık Okuma Özeti
                </h2>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${trendIsPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                  {trendIsPositive ? <Flame size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                  {trendText}
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff10' : '#00000010'} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#A8A29E' : '#78716C', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#A8A29E' : '#78716C', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: theme === 'dark' ? '#ffffff05' : '#00000005' }} contentStyle={{ backgroundColor: theme === 'dark' ? '#1A1E29' : '#ffffff', borderColor: theme === 'dark' ? '#ffffff20' : '#e7e5e4', borderRadius: '12px' }} />
                  <Bar name="Sayfa Sayısı" dataKey="pagesRead" fill={theme === 'dark' ? '#3B82F6' : '#2563EB'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Aktivite Haritası */}
          <motion.div className="glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-emerald-500" />
              Okuma Serisi (Son 28 Gün)
            </h2>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-2">
                  {heatmapData.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, dayIdx) => (
                    <div 
                      key={dayIdx} 
                      title={`${day.dateStr}: ${day.count} Aktivite`}
                      className={`w-5 h-5 sm:w-8 sm:h-8 rounded-sm sm:rounded-md transition-colors ${getHeatmapColor(day.count)}`} 
                    />
                  ))}
                </div>
              ))}
              <div className="flex-1 flex items-end justify-end pb-1 gap-2 text-xs text-stone-500">
                Az <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(0)}`}/>
                <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(1)}`}/>
                <div className={`w-3 h-3 rounded-sm ${getHeatmapColor(3)}`}/> Çok
              </div>
            </div>
          </motion.div>

          {/* Başyapıtlar 3D Vitrin */}
          {masterpieces.length > 0 && (
            <motion.div className="glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden">
              <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
                <Award size={20} className="text-amber-500" />
                Başyapıtlar Vitrini
              </h2>
              <div className="flex gap-6 overflow-x-auto pb-4 snap-x hide-scrollbar">
                {masterpieces.map((book) => (
                  <motion.div 
                    key={book.id} 
                    whileHover={{ scale: 1.05, y: -10, rotateY: 5 }}
                    className="shrink-0 w-32 sm:w-40 snap-start perspective-1000"
                  >
                    <div className="w-full aspect-[2/3] rounded-lg shadow-xl overflow-hidden mb-3 bg-stone-200 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/50">
                      {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${book.coverColor}`} />
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-stone-900 dark:text-stone-100 truncate">{book.title}</h4>
                    <p className="text-xs text-stone-500 truncate">{book.author}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sağ Kolon */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Yıllık Hedef (Progress Ring) */}
          <motion.div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col items-center relative overflow-hidden">
             <div className="absolute top-4 right-4 group">
               <input 
                 type="number" 
                 value={readingGoal}
                 onChange={handleGoalChange}
                 className="w-16 bg-transparent border-b border-stone-300 dark:border-stone-700 text-center text-sm font-medium focus:outline-none focus:border-amber-500"
                 title="Hedefi Değiştir"
               />
             </div>
             
             <h2 className="text-lg font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 w-full flex items-center gap-2">
              <Target size={20} className="text-red-500" />
              {currentYear} Hedefi
            </h2>
            
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* SVG Progress Ring */}
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="45" className="stroke-stone-200 dark:stroke-stone-800" strokeWidth="8" fill="none" />
                <circle 
                  cx="96" 
                  cy="96" 
                  r="45" 
                  className="stroke-amber-500 drop-shadow-md transition-all duration-1000 ease-out" 
                  strokeWidth="8" 
                  fill="none" 
                  strokeDasharray="283"
                  strokeDashoffset={goalStrokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">{completedThisYear}</span>
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">/ {readingGoal} KİTAP</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-center text-stone-500 dark:text-stone-400">
              {completedThisYear >= readingGoal 
                ? "İnanılmaz! Hedefine ulaştın! 🏆" 
                : `Hedefine ulaşmak için ${readingGoal - completedThisYear} kitap kaldı.`}
            </p>
          </motion.div>

          {/* Okuma DNA'sı */}
          <motion.div className="glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Target size={20} className="text-purple-500" />
              Okuma DNA'sı
            </h2>
            <div className="h-64 flex items-center justify-center relative">
              {genreData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genreData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {genreData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1A1E29' : '#ffffff', borderColor: theme === 'dark' ? '#ffffff20' : '#e7e5e4', borderRadius: '12px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-stone-500 text-sm">Yeterli veri yok.</p>}
              {genreData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100">{genreData[0]?.value}</span>
                  <span className="text-xs text-stone-500 uppercase tracking-wider max-w-[80px] text-center truncate">{genreData[0]?.name}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Favori Alıntılar */}
          <motion.div className="glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-6 flex items-center gap-2">
              <Quote size={20} className="text-amber-500" />
              Favori Alıntılar
            </h2>
            <div className="space-y-6">
              {favoriteNotes.length > 0 ? (
                favoriteNotes.slice(0, 5).map((note, idx) => {
                  const book = books.find(b => b.id === note.bookId);
                  return (
                    <motion.div key={note.id} className="relative pl-6">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/20 rounded-full" />
                      <p className="text-stone-700 dark:text-stone-300 text-sm italic leading-relaxed">"{note.content}"</p>
                      {book && <p className="text-xs text-stone-500 mt-2 font-medium">— {book.title}</p>}
                    </motion.div>
                  )
                })
              ) : <div className="text-stone-500 text-sm py-4">Henüz favori alıntınız yok.</div>}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
