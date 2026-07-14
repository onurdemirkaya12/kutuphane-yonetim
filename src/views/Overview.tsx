import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BookOpen, CheckCircle, Star, Quote } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function Overview() {
  const { books, notes, stats, discoverBooks } = useAppContext();

  const totalBooks = books.length;
  const completedBooks = books.filter(b => b.status === 'completed').length;
  const favoriteBooks = books.filter(b => b.isFavorite).length;
  const readingBooks = books.filter(b => b.status === 'reading');
  
  const favoriteQuotes = notes.filter(n => n.isFavoriteQuote);
  const discoverPreview = discoverBooks.slice(0, 3);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Toplam Kitap" value={totalBooks} icon={<BookOpen size={20} />} />
        <StatCard title="Tamamlanan" value={completedBooks} icon={<CheckCircle size={20} />} />
        <StatCard title="Favorilerim" value={favoriteBooks} icon={<Star size={20} className="fill-amber-400 text-amber-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Currently Reading */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-4">Şu Anda Okuduğum</h2>
            {readingBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {readingBooks.map(book => (
                  <div key={book.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex space-x-4">
                    <div className={`w-20 h-28 ${book.coverColor} rounded-md shadow-inner flex-shrink-0`} />
                    <div className="flex flex-col justify-center">
                      <h3 className="font-serif font-medium text-lg text-stone-900 leading-tight">{book.title}</h3>
                      <p className="text-stone-500 text-sm mt-1">{book.author}</p>
                      <div className="mt-4 flex items-center space-x-2">
                        <div className="h-1.5 w-24 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-600 w-1/3" />
                        </div>
                        <span className="text-xs text-stone-400">%33</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm text-center">
                <p className="text-stone-500">Şu anda okuduğunuz bir kitap bulunmuyor.</p>
              </div>
            )}
          </section>

          {/* Reading Stats Chart */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-4">Okuma İstatistikleri</h2>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#78716c" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#78716c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#44403c' }}
                  />
                  <Area type="monotone" dataKey="pagesRead" name="Okunan Sayfa" stroke="#57534e" strokeWidth={2} fillOpacity={1} fill="url(#colorPages)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Favorite Quotes */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-4">Favori Cümleler</h2>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-6">
              {favoriteQuotes.length > 0 ? (
                favoriteQuotes.slice(0,3).map(note => (
                  <div key={note.id} className="relative">
                    <Quote size={24} className="text-stone-200 absolute -top-2 -left-2 rotate-180" />
                    <p className="font-serif italic text-stone-700 text-lg relative z-10 pl-6 leading-relaxed">
                      "{note.content}"
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-stone-500 text-sm">Henüz favori cümleniz yok.</p>
              )}
            </div>
          </section>

          {/* Discover Preview */}
          <section>
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-4">Keşfedilecekler</h2>
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
              {discoverPreview.map(book => (
                <div key={book.id} className="flex items-center space-x-4">
                  <div className={`w-12 h-16 ${book.coverColor} rounded shadow-sm flex-shrink-0`} />
                  <div>
                    <h4 className="font-serif font-medium text-stone-900">{book.title}</h4>
                    <p className="text-sm text-stone-500">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-stone-500 mb-1">{title}</p>
        <p className="text-3xl font-serif font-semibold text-stone-800">{value}</p>
      </div>
      <div className="h-12 w-12 bg-stone-50 rounded-full flex items-center justify-center text-stone-600">
        {icon}
      </div>
    </div>
  );
}
