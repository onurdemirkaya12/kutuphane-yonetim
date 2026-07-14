import React from 'react';
import { LayoutDashboard, Library, PenLine, Compass } from 'lucide-react';
import { cn } from '../lib/utils';

export type ViewType = 'overview' | 'library' | 'notes' | 'discover';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
    { id: 'library', label: 'Kütüphane', icon: Library },
    { id: 'notes', label: 'Notlarım', icon: PenLine },
    { id: 'discover', label: 'Keşfet', icon: Compass },
  ] as const;

  return (
    <div className="w-64 h-screen bg-stone-100 border-r border-stone-200 flex flex-col pt-8">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-serif font-semibold text-stone-800 tracking-tight">Kütüphanem</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                isActive 
                  ? "bg-stone-200/70 text-stone-900" 
                  : "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-stone-800" : "text-stone-500")} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-stone-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center text-stone-700 font-medium font-serif">
            K
          </div>
          <span className="text-sm font-medium text-stone-700">Kitap Kurdu</span>
        </div>
      </div>
    </div>
  );
}
