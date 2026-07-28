import React, { useState } from 'react';
import { User, Award, BookOpen, Target, Settings, CheckCircle2, ChevronRight, Bookmark, Pencil, Camera, Calendar, LogOut, Database, AlertTriangle, Loader2 } from 'lucide-react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export function Profile() {
  const { userProfile, updateUserProfile, books, activityLogs, user, logout } = useAppContext();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(userProfile.yearlyGoal.toString());
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  const handleMigration = async () => {
    if (!user) return;
    setIsMigrating(true);
    setMigrationStatus("Veriler taranıyor...");
    
    try {
      const batch = writeBatch(db);
      let count = 0;
      
      const booksSnapshot = await getDocs(collection(db, 'books'));
      booksSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (!data.userId) {
          batch.update(doc(db, 'books', docSnapshot.id), { userId: user.uid });
          count++;
        }
      });

      const notesSnapshot = await getDocs(collection(db, 'notes'));
      notesSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (!data.userId) {
          batch.update(doc(db, 'notes', docSnapshot.id), { userId: user.uid });
          count++;
        }
      });

      if (count > 0) {
        setMigrationStatus("Veriler aktarılıyor...");
        await batch.commit();
        setMigrationStatus(`Başarılı! Toplam ${count} kayıt hesabınıza devredildi. Lütfen sayfayı yenileyin.`);
      } else {
        setMigrationStatus("Aktarılacak sahipsiz eski veri bulunamadı.");
      }
    } catch (error) {
      console.error(error);
      setMigrationStatus("Hata! Lütfen Firebase kurallarını esnettiğinizden emin olun.");
    } finally {
      setIsMigrating(false);
    }
  };

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
    <div className="p-4 md:p-8 pt-6 md:pt-8 max-w-5xl mx-auto min-h-full space-y-6 md:space-y-8 pb-24 md:pb-8">
      
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
          <div className="flex flex-col md:flex-row md:items-start justify-between w-full mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-stone-900 dark:text-stone-100 mb-1 flex items-center justify-center md:justify-start gap-2">
                {userProfile.name}
                <button className="text-stone-400 hover:text-amber-500 transition-colors p-1">
                  <Pencil size={16} />
                </button>
              </h1>
              <p className="text-stone-500 dark:text-stone-400">
                {user?.email} • {totalCompletedCount < 5 ? 'Acemi Okur' : totalCompletedCount < 15 ? 'Kitap Kurdu' : 'Bilge Okuyucu'}
              </p>
            </div>
            
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium shrink-0 mx-auto md:mx-0"
            >
              <LogOut size={16} />
              Çıkış Yap
            </button>
          </div>

          <div className="bg-white/50 dark:bg-[#1A1E29]/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm border border-stone-200/50 dark:border-white/5">
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
            <div className="flex-1 w-full min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-between w-full mb-2 gap-2">
                <span className="text-[11px] sm:text-sm font-bold sm:font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider truncate">Yıllık Okuma Hedefi</span>
                <button 
                  onClick={() => setIsEditingGoal(!isEditingGoal)}
                  className="text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 p-1.5 rounded-lg transition-colors shrink-0"
                >
                  <Settings size={16} />
                </button>
              </div>
              
              {isEditingGoal ? (
                <div className="flex items-center justify-center sm:justify-start gap-2 w-full">
                  <input
                    type="number"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-16 sm:w-20 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg px-2 sm:px-3 py-1.5 text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium shrink-0"
                    min="1"
                  />
                  <button onClick={handleSaveGoal} className="bg-amber-500 hover:bg-amber-600 text-white px-2 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0">Kaydet</button>
                </div>
              ) : (
                <div className="flex items-baseline justify-center sm:justify-start gap-2 w-full">
                  <span className="text-3xl font-bold text-stone-900 dark:text-white">{totalCompletedCount}</span>
                  <span className="text-stone-500 dark:text-stone-400 font-medium">/ {userProfile.yearlyGoal} kitap</span>
                </div>
              )}
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 sm:mt-1">Bu yıl hedefinin {totalCompletedCount} kitabını tamamladın.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Migration Alert */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20"
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white mb-1">Eski Verileri İçeri Aktar</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">Önceden eklediğiniz ve "sahipsiz" görünen kitapları tek tıkla hesabınıza geçirin.</p>
              {migrationStatus && (
                <p className={`text-sm font-medium mt-2 ${migrationStatus.includes('Hata') ? 'text-red-500' : 'text-emerald-500'}`}>
                  Durum: {migrationStatus}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={handleMigration}
            disabled={isMigrating}
            className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
          >
            {isMigrating ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
            {isMigrating ? 'Aktarılıyor...' : 'Verileri Aktar'}
          </button>
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
