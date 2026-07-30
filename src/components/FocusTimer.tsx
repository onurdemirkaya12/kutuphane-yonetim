import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, X, Play, Pause, Square, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function FocusTimer() {
  const { books, updateBook, logActivity, addReadingSession } = useAppContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [pagesRead, setPagesRead] = useState<string>('');

  const readingBooks = books.filter(b => b.status === 'reading');

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

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
            {isActive ? (
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
            <div className="p-4 border-b border-stone-100 dark:border-white/5 flex items-center justify-between bg-stone-50/50 dark:bg-black/20">
              <h3 className="font-serif font-medium flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <Timer size={18} className="text-amber-500" />
                Odak Modu
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {showCompletion ? (
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
                        className="w-full px-3 py-2 text-sm bg-stone-100 dark:bg-black/20 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-stone-700 dark:text-stone-300"
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
                            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${durationMinutes === mins ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500' : 'bg-stone-100 dark:bg-black/20 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-white/5'}`}
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
                      className="w-14 h-14 flex items-center justify-center bg-amber-500 text-white rounded-full hover:bg-amber-600 hover:scale-105 transition-all shadow-lg"
                    >
                      {isActive ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                    </button>
                    {(isActive || timeLeft < durationMinutes * 60) && (
                      <button
                        onClick={stopTimer}
                        className="w-14 h-14 flex items-center justify-center bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 rounded-full hover:bg-stone-200 dark:hover:bg-white/10 hover:text-red-500 transition-all"
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
