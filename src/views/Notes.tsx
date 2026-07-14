import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Star, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function Notes() {
  const { notes, addNote, toggleFavoriteNote } = useAppContext();
  const [newNote, setNewNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addNote(newNote);
    setNewNote('');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-stone-800 mb-2">Notlarım</h1>
        <p className="text-stone-500">Okurken aldığınız notlar ve favori cümleleriniz.</p>
      </div>

      {/* Quick Add Note */}
      <div className="bg-white p-2 pl-4 rounded-2xl border border-stone-200 shadow-sm flex items-center space-x-4 focus-within:ring-2 ring-stone-200 transition-shadow">
        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
          <input 
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Hızlı bir not veya alıntı ekleyin..."
            className="w-full bg-transparent border-none focus:outline-none text-stone-700 py-3"
          />
          <button 
            type="submit"
            disabled={!newNote.trim()}
            className="p-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex gap-4 group">
            <button 
              onClick={() => toggleFavoriteNote(note.id)}
              className="mt-1 flex-shrink-0 text-stone-300 hover:text-amber-400 transition-colors focus:outline-none"
              title="Favori cümle olarak işaretle"
            >
              <Star 
                size={22} 
                className={cn(
                  "transition-all duration-300",
                  note.isFavoriteQuote ? "fill-amber-400 text-amber-400" : "group-hover:fill-amber-400/50"
                )} 
              />
            </button>
            <div className="flex-1">
              <p className={cn(
                "text-stone-800 leading-relaxed",
                note.isFavoriteQuote && "font-serif text-lg italic"
              )}>
                {note.content}
              </p>
              <span className="text-xs text-stone-400 mt-3 inline-block">
                {format(note.createdAt, "d MMMM yyyy", { locale: tr })}
              </span>
            </div>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="text-center py-12 text-stone-500">
            Henüz hiç not eklemediniz.
          </div>
        )}
      </div>
    </div>
  );
}
