import React from 'react';
import { LayoutDashboard, Library, PenLine, User, Moon, Sun, ShieldAlert } from 'lucide-react';
import { ADMIN_EMAIL } from '../config/admin';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export type ViewType = 'overview' | 'library' | 'notes' | 'profile' | 'admin';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const { theme, toggleTheme, userProfile, user } = useAppContext();
  
  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'library', label: 'Kütüphane', icon: Library },
    { id: 'notes', label: 'Notlarım', icon: PenLine },
    { id: 'profile', label: 'Profilim', icon: User },
  ];

  if (user && user.email === ADMIN_EMAIL) {
    navItems.push({ id: 'admin', label: 'Yönetim', icon: ShieldAlert } as any);
  }

  return (
    <>
      {/* MASAÜSTÜ YAN MENÜ */}
      <div className="hidden md:flex w-64 h-screen bg-stone-100/50 dark:bg-[#111318]/50 backdrop-blur-md border-r border-stone-200/50 dark:border-white/5 flex-col pt-8 transition-colors duration-500 z-50">
        <div className="px-6 mb-10">
          <h1 className="text-2xl font-serif font-semibold text-stone-800 dark:text-stone-100 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-800 dark:bg-stone-200 flex items-center justify-center">
               <span className="text-stone-100 dark:text-stone-900 font-bold text-lg">K</span>
            </div>
            Kütüphanem
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as ViewType)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium relative group",
                  isActive 
                    ? "text-stone-900 dark:text-white" 
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-stone-200/70 dark:bg-white/10 rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={18} className={cn("relative z-10", isActive ? "text-stone-800 dark:text-white" : "text-stone-500 dark:text-stone-400")} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-stone-200/50 dark:border-white/5 space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2 rounded-lg bg-stone-200/50 dark:bg-white/5 hover:bg-stone-200 dark:hover:bg-white/10 transition-colors text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            <span>{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-400 to-stone-200 dark:from-stone-700 dark:to-stone-500 flex items-center justify-center text-stone-800 dark:text-stone-200 font-medium font-serif shadow-sm overflow-hidden">
               {userProfile?.avatarUrl ? (
                 <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 'O'
               )}
            </div>
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate w-32">{userProfile?.name || 'Okur Profilim'}</span>
          </div>
        </div>
      </div>

      {/* MOBİL ALT MENÜ (TAB BAR) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 dark:bg-[#111318]/90 backdrop-blur-xl border-t border-stone-200/50 dark:border-white/10 flex items-center justify-around pb-[env(safe-area-inset-bottom)] px-2 pt-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewType)}
              className={cn(
                "flex flex-col items-center justify-center w-16 py-1 transition-colors relative",
                isActive 
                  ? "text-amber-500 dark:text-amber-500" 
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
              )}
            >
              <div className="relative mb-1">
                {isActive && (
                  <motion.div
                    layoutId="mobile-active"
                    className="absolute inset-0 bg-amber-100 dark:bg-amber-900/30 rounded-full scale-150"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={22} className="relative z-10" />
              </div>
              <span className="text-[10px] font-medium relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
