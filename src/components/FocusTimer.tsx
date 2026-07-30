import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, X, Play, Pause, Square, BookOpen, PenLine } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function FocusTimer() {
  const { books, updateBook, logActivity, addReadingSession } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  
  // Timer state
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [pagesRead, setPagesRead] = useState<string>('');

  // Manual state
  const [manualMinutes, setManualMinutes] = useState<string>('30');
  const [manualPages, setManualPages] = useState<string>('');

  const readingBooks = books.filter(b => b.status === 'reading');

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0 && mode === 'timer') {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0 && mode === 'timer') {
      handleComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => {
    if (!isActive && !sessionStartTime) {
      setSessionStartTime(Date.now());
    }
    setIsActive(!isActive);
  };

  const stopTimer = () => {
    const elapsedSeconds = durationMinutes * 60 - timeLeft;
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    if (elapsedMinutes > 0 && sessionStartTime) {
      setIsActive(false);
      setShowCompletion(true);
      
      const endTime = Date.now();
      
      logActivity('focus', elapsedMinutes);
      addReadingSession({
        startTime: sessionStartTime,
        endTime,
        durationMinutes: elapsedMinutes,
        bookId: selectedBookId || undefined
      });
      
      setSessionStartTime(null);
    } else {
      setIsActive(false);
      setTimeLeft(durationMinutes * 60);
      setSessionStartTime(null);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    setShowCompletion(true);
    
    const endTime = Date.now();
    const startTime = sessionStartTime || (endTime - durationMinutes * 60 * 1000);
    
    // Log focus time
    logActivity('focus', durationMinutes);
    addReadingSession({
      startTime,
      endTime,
      durationMinutes,
      bookId: selectedBookId || undefined
    });
    
    setSessionStartTime(null);
  };

  const submitPages = () => {
    const pages = parseInt(pagesRead, 10);
    if (!isNaN(pages) && pages > 0 && selectedBookId) {
      const book = books.find(b => b.id === selectedBookId);
      if (book) {
        updateBook(selectedBookId, {
          readPages: (book.readPages || 0) + pages
        });
      }
      logActivity('read', pages);
    }
    
    // Reset
    setShowCompletion(false);
    setPagesRead('');
    setTimeLeft(durationMinutes * 60);
    setIsOpen(false);
  };

  const handleManualSubmit = () => {
    const mins = parseInt(manualMinutes, 10);
    const pgs = parseInt(manualPages, 10);
    
    if (isNaN(mins) || mins <= 0) return;

    const endTime = Date.now();
    const startTime = endTime - mins * 60 * 1000;

    logActivity('focus', mins);
    addReadingSession({
      startTime,
      endTime,
      durationMinutes: mins,
      bookId: selectedBookId || undefined
    });

    if (!isNaN(pgs) && pgs > 0 && selectedBookId) {
      const book = books.find(b => b.id === selectedBookId);
      if (book) {
        updateBook(selectedBookId, {
          readPages: (book.readPages || 0) + pgs
        });
      }
      logActivity('read', pgs);
    }
    
    // Reset
    setManualMinutes('30');
    setManualPages('');
    setIsOpen(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 w-14 h-14 bg-amber-500 text-white rounded-full shadow-lg shadow-amber-500/20 flex items-center justify-center hover:bg-amber-600 hover:scale-105 transition-all z-40 group"
            title="Odak Modu"
          >
            {isActive && mode === 'timer' ? (
              <div className="relative flex items-center justify-center">
                <Timer size={24} className="animate-pulse" />
                <svg className="absolute w-14 h-14 -rotate-90">
                   <circle cx="28" cy="28" r="26" fill="none" strokeWidth="2" stroke="rgba(255,255,255,0.2)" />
                   <circle 
                      cx="28" cy="28" r="26" 
                      fill="none" 
                      strokeWidth="2" 
                      stroke="white" 
                      strokeDasharray="163" 
                      strokeDashoffset={163 - (163 * (timeLeft / (durationMinutes * 60)))} 
                      className="transition-all duration-1000 linear" 
                   />
                </svg>
              </div>
            ) : (
              <Timer size={24} className="group-hover:rotate-12 transition-transform" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Timer Widget Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-80 bg-white dark:bg-[#1A1E29] rounded-3xl shadow-2xl border border-stone-200 dark:border-white/10 overflow-hidden z-50"
          >
            <div className="p-3 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-black/20">
              <div className="flex bg-stone-200/50 dark:bg-white/5 rounded-lg p-1">
                <button 
                  onClick={() => setMode('timer')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${mode === 'timer' ? 'bg-white dark:bg-stone-700 shadow-sm text-amber-600 dark:text-amber-500' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
                >
                  <Timer size={14} />
                  Sayaç
                </button>
                <button 
                  onClick={() => setMode('manual')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${mode === 'manual' ? 'bg-white dark:bg-stone-700 shadow-sm text-emerald-600 dark:text-emerald-500' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}
                >
                  <PenLine size={14} />
                  Manuel
                </button>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {mode === 'manual' ? (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Kitap Seç (Opsiyonel)</label>
                    <select 
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm bg-stone-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-stone-700 dark:text-stone-200 font-medium appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='2' stroke='gray' class='w-4 h-4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                    >
                      <option value="" className="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-200">Kitap Seç</option>
                      {readingBooks.map(b => (
                        <option key={b.id} value={b.id} className="bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-200">{b.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Süre (Dk)</label>
                      <input 
                        type="number"
                        value={manualMinutes}
                        onChange={(e) => setManualMinutes(e.target.value)}
                        placeholder="Örn: 45"
                        min="1"
                        className="w-full px-4 py-2.5 bg-stone-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 dark:text-stone-200 font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Sayfa</label>
                      <input 
                        type="number"
                        value={manualPages}
                        onChange={(e) => setManualPages(e.target.value)}
                        placeholder="Örn: 20"
                        min="1"
                        className="w-full px-4 py-2.5 bg-stone-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 dark:text-stone-200 font-medium"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handleManualSubmit}
                    disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
                    className="w-full mt-2 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    <PenLine size={18} />
                    Seansı Kaydet
                  </button>
                </div>
              ) : showCompletion ? (
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BookOpen size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">Harika İş!</h4>
                  <p className="text-sm text-stone-500 dark:text-stone-400">Okuma seansınızı tamamladınız. Bu seans boyunca kaç sayfa okudunuz?</p>
                  
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number"
                      value={pagesRead}
                      onChange={(e) => setPagesRead(e.target.value)}
                      placeholder="Sayfa sayısı"
                      className="flex-1 px-4 py-2 bg-stone-100 dark:bg-black/20 border border-stone-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-stone-200"
                    />
                    <button 
                      onClick={submitPages}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Kaydet
                    </button>
                  </div>
                  <button 
                    onClick={() => { setShowCompletion(false); setIsOpen(false); setTimeLeft(durationMinutes * 60); }}
                    className="text-xs text-stone-400 hover:text-stone-500 mt-2 block w-full"
                  >
                    Atla
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {!isActive && timeLeft === durationMinutes * 60 && (
                    <div className="w-full mb-6 space-y-3">
                      <select 
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-stone-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-stone-700 dark:text-stone-300 font-medium"
                      >
                        <option value="">Kitap Seç (Opsiyonel)</option>
                        {readingBooks.map(b => (
                          <option key={b.id} value={b.id}>{b.title}</option>
                        ))}
                      </select>
                      
                      <div className="flex gap-2">
                        {[15, 30, 45, 60].map(mins => (
                          <button
                            key={mins}
                            onClick={() => { setDurationMinutes(mins); setTimeLeft(mins * 60); }}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${durationMinutes === mins ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500' : 'bg-stone-100 dark:bg-black/20 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/5'}`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-5xl font-serif font-bold text-stone-800 dark:text-stone-100 mb-8 tracking-wider tabular-nums">
                    {formatTime(timeLeft)}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={toggleTimer}
                      className="w-14 h-14 flex items-center justify-center bg-amber-500 text-white rounded-full hover:bg-amber-600 hover:scale-105 transition-all shadow-lg shadow-amber-500/20"
                    >
                      {isActive ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                    </button>
                    {(isActive || timeLeft < durationMinutes * 60) && (
                      <button
                        onClick={stopTimer}
                        className="w-14 h-14 flex items-center justify-center bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 hover:text-red-500 transition-all shadow-sm"
                      >
                        <Square size={20} className="fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
