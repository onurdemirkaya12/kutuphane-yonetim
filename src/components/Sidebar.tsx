import React from 'react';
import { LayoutDashboard, Library, PenLine, User, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';

export type ViewType = 'overview' | 'library' | 'notes' | 'profile';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const { theme, toggleTheme } = useAppContext();
  
  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'library', label: 'Kütüphane', icon: Library },
    { id: 'notes', label: 'Notlarım', icon: PenLine },
    { id: 'profile', label: 'Profilim', icon: User },
  ] as const;

  return (
    <div className="w-64 h-screen bg-stone-100/50 dark:bg-[#111318]/50 backdrop-blur-md border-r border-stone-200/50 dark:border-white/5 flex flex-col pt-8 transition-colors duration-500">
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
              onClick={() => onChangeView(item.id)}
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-400 to-stone-200 dark:from-stone-700 dark:to-stone-500 flex items-center justify-center text-stone-800 dark:text-stone-200 font-medium font-serif shadow-sm">
            O
          </div>
          <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Okur Profilim</span>
        </div>
      </div>
    </div>
  );
}
