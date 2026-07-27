import React, { useState } from 'react';
import { User, Award, BookOpen, Target, Settings, CheckCircle2, ChevronRight, Bookmark, Pencil, Camera, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export function Profile() {
  const { userProfile, updateUserProfile, books, activityLogs } = useAppContext();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(userProfile.yearlyGoal.toString());

  // İstatistikleri Hesapla
  const completedBooks = books.filter(b => b.status === 'completed');
  const totalCompletedCount = completedBooks.length;
  
  // Toplam okunan sayfa (okunan sayfalar + bitirilen kitapların toplam sayfası)
  const totalPagesRead = books.reduce((acc, book) => {
    if (book.status === 'completed') return acc + (book.pageCount || 0);
    if (book.status === 'reading') return acc + (book.readPages || 0);
    return acc;
  }, 0);

  // Yıllık hedef yüzdesi
  const goalProgressPercentage = Math.min(100, Math.round((totalCompletedCount / userProfile.yearlyGoal) * 100));
  const dashOffset = 283 - (283 * goalProgressPercentage) / 100; // 283 is approx circumference of r=45

  // Favori Kategori Bulma
  const categoryCount = completedBooks.reduce((acc, book) => {
    if (book.category) {
      acc[book.category] = (acc[book.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  let favoriteCategory = 'Henüz Yok';
  let maxCount = 0;
  for (const [category, count] of Object.entries(categoryCount)) {
    if (count > maxCount) {
      maxCount = count;
      favoriteCategory = category;
    }
  }

  // Rozetler (Gamification)
  const badges = [
    {
      id: 'first_book',
      name: 'İlk Adım',
      description: 'İlk kitabını bitirdin.',
      icon: BookOpen,
      unlocked: totalCompletedCount >= 1,
      color: 'bg-emerald-500'
    },
    {
      id: 'five_books',
      name: 'Okuma Kurdu',
      description: '5 kitap bitirdin.',
      icon: Award,
      unlocked: totalCompletedCount >= 5,
      color: 'bg-blue-500'
    },
    {
      id: 'goal_achiever',
      name: 'Hedef Avcısı',
      description: 'Yıllık okuma hedefine ulaştın!',
      icon: Target,
      unlocked: totalCompletedCount >= userProfile.yearlyGoal,
      color: 'bg-amber-500'
    },
    {
      id: 'page_turner',
      name: 'Sayfa Canavarı',
      description: 'Toplam 1000 sayfa okudun.',
      icon: Bookmark,
      unlocked: totalPagesRead >= 1000,
      color: 'bg-purple-500'
    }
  ];

  const handleSaveGoal = () => {
    const goal = parseInt(tempGoal, 10);
    if (!isNaN(goal) && goal > 0) {
      updateUserProfile({ yearlyGoal: goal });
    }
    setIsEditingGoal(false);
  };

  // Isı Haritası Verisi (Son 20 hafta x 7 gün = 140 gün)
  const heatmapDays = Array.from({ length: 140 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (139 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    // O güne ait aktiviteleri topla
    const dayLogs = activityLogs.filter(log => log.date === dateStr);
    const totalActivityCount = dayLogs.reduce((acc, log) => acc + log.count, 0);
    
    // Kitap eklenme tarihi veya not alınma tarihleri de aslında buraya eklenebilir ama şu an için activityLogs var
    return {
      date: dateStr,
      count: totalActivityCount
    };
  });

  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-stone-100 dark:bg-stone-800';
    if (count < 3) return 'bg-amber-200 dark:bg-amber-900/40';
    if (count < 10) return 'bg-amber-400 dark:bg-amber-700/60';
    if (count < 30) return 'bg-amber-500 dark:bg-amber-500';
    return 'bg-amber-600 dark:bg-amber-400';
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full space-y-8 pb-20">
      
      {/* Üst Profil Kartı */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel anti-gravity p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3" />
        
        {/* Avatar */}
        <div className="relative group shrink-0">
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-stone-200 to-white dark:from-stone-800 dark:to-stone-700 shadow-xl border-4 border-white dark:border-stone-800 flex items-center justify-center text-5xl font-serif text-stone-400 dark:text-stone-500 overflow-hidden">
            {userProfile.avatarUrl ? (
               <img src={userProfile.avatarUrl} alt="Profil" className="w-full h-full object-cover" />
            ) : (
               <User size={48} />
            )}
          </div>
          <button className="absolute bottom-0 right-0 p-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
            <Camera size={16} />
          </button>
        </div>

        {/* Info & Progress */}
        <div className="flex-1 text-center md:text-left z-10 w-full">
          <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-1 flex items-center justify-center md:justify-start gap-2">
            {userProfile.name}
            <button className="text-stone-400 hover:text-amber-500 transition-colors p-1">
              <Pencil size={16} />
            </button>
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mb-6">
            {totalCompletedCount < 5 ? 'Acemi Okur' : totalCompletedCount < 15 ? 'Kitap Kurdu' : 'Bilge Okuyucu'} • {new Date(userProfile.joinDate).getFullYear()} yılından beri üye
          </p>

          <div className="bg-white/50 dark:bg-[#1A1E29]/50 rounded-2xl p-4 flex items-center gap-6 shadow-sm border border-stone-200/50 dark:border-white/5">
            {/* Circular Progress */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" className="stroke-stone-200 dark:stroke-stone-800" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  className="stroke-amber-500 transition-all duration-1000 ease-out"
                  strokeDasharray="283"
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-stone-800 dark:text-stone-200">{goalProgressPercentage}%</span>
              </div>
            </div>

            {/* Goal Text & Edit */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Yıllık Okuma Hedefi</span>
                <button 
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 p-1.5 rounded-lg transition-colors"
                >
                  <Settings size={16} />
                </button>
              </div>
              
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-20 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg px-3 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                    min="1"
                  />
                  <button onClick={handleSaveGoal} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Kaydet</button>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-stone-900 dark:text-white">{totalCompletedCount}</span>
                  <span className="text-stone-500 dark:text-stone-400 font-medium">/ {userProfile.yearlyGoal} kitap</span>
                </div>
              )}
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Bu yıl hedefinin {totalCompletedCount} kitabını tamamladın.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* İstatistikler */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1 space-y-6"
        >
          <div className="glass-panel p-6 rounded-3xl">
            <h2 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-6">Özet İstatistikler</h2>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Toplam Biten Kitap</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">{totalCompletedCount}</p>
              </div>
              <div className="h-px bg-stone-200 dark:bg-white/5" />
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Okunan Toplam Sayfa</p>
                <p className="text-2xl font-bold text-stone-900 dark:text-white">{totalPagesRead.toLocaleString('tr-TR')}</p>
              </div>
              <div className="h-px bg-stone-200 dark:bg-white/5" />
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Favori Kategori</p>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-500 truncate">{favoriteCategory}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Rozetler */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 glass-panel p-6 rounded-3xl flex flex-col"
        >
          <h2 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-6 flex items-center justify-between">
            Kazanılan Rozetler
            <span className="bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-1 rounded-full text-xs font-medium">
              {badges.filter(b => b.unlocked).length} / {badges.length}
            </span>
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all relative ${
                    badge.unlocked 
                      ? 'bg-white dark:bg-[#1A1E29] border-stone-200 dark:border-white/10 shadow-sm' 
                      : 'bg-stone-50 dark:bg-[#1A1E29]/30 border-stone-100 dark:border-white/5 opacity-60 grayscale'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3 shadow-md ${badge.unlocked ? badge.color : 'bg-stone-300 dark:bg-stone-700 shadow-none'}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">{badge.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight">{badge.description}</p>
                  
                  {badge.unlocked && (
                    <div className="absolute top-2 right-2 text-emerald-500">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Isı Haritası (Heatmap) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6 rounded-3xl"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={16} /> Okuma Alışkanlığı Haritası
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Son 140 günlük okuma ve odaklanma aktiviteniz.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
            <span>Az</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-stone-100 dark:bg-stone-800"></div>
              <div className="w-3 h-3 rounded-sm bg-amber-200 dark:bg-amber-900/40"></div>
              <div className="w-3 h-3 rounded-sm bg-amber-400 dark:bg-amber-700/60"></div>
              <div className="w-3 h-3 rounded-sm bg-amber-500 dark:bg-amber-500"></div>
              <div className="w-3 h-3 rounded-sm bg-amber-600 dark:bg-amber-400"></div>
            </div>
            <span>Çok</span>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4 hide-scrollbar">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5">
            {heatmapDays.map((day, i) => (
              <div 
                key={i} 
                title={`${day.date}: ${day.count} aktivite`}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm transition-colors hover:ring-2 hover:ring-offset-1 hover:ring-amber-500 hover:ring-offset-white dark:hover:ring-offset-[#1A1E29] ${getIntensityClass(day.count)}`}
              />
            ))}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
