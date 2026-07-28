import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { motion } from 'motion/react';
import { Users, Eye, LogOut } from 'lucide-react';
import { ADMIN_EMAIL } from '../config/admin';

interface UserData {
  id: string;
  email: string;
  lastLogin: string;
}

export function Admin() {
  const { user, viewingUserId, setViewingUserId } = useAppContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserData[];
        setUsers(usersList);
      } catch (error) {
        console.error("Kullanıcılar alınırken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Yalnızca adminse fetch et
    if (user && user.email === ADMIN_EMAIL) {
      fetchUsers();
    }
  }, [user]);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-stone-500">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full space-y-6 pb-24 md:pb-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Yönetim Paneli</h1>
          <p className="text-stone-500">Tüm kullanıcıları görüntüleyin ve kütüphanelerini yönetin.</p>
        </div>
      </div>

      {viewingUserId && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <Eye size={20} />
            <span className="font-medium">
              Şu anda başka bir kullanıcının kütüphanesini görüntülüyorsunuz. (Sol menüden "Kütüphane"ye geçin)
            </span>
          </div>
          <button 
            onClick={() => setViewingUserId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <LogOut size={16} />
            Kendi Kütüphaneme Dön
          </button>
        </motion.div>
      )}

      <div className="glass-panel p-6 rounded-3xl">
        <h2 className="text-xl font-bold mb-4">Kayıtlı Kullanıcılar</h2>
        
        {loading ? (
          <p className="text-stone-500 text-center py-8">Yükleniyor...</p>
        ) : (
          <div className="space-y-3">
            {users.map(u => (
              <div 
                key={u.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border gap-4 ${viewingUserId === u.id ? 'border-amber-500 bg-amber-500/5' : 'border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-black/20'}`}
              >
                <div>
                  <p className="font-medium text-stone-900 dark:text-white">
                    {u.email} {u.email === ADMIN_EMAIL && '(Siz)'}
                  </p>
                  <p className="text-sm text-stone-500">
                    Son giriş: {u.lastLogin ? new Date(u.lastLogin).toLocaleString('tr-TR') : 'Bilinmiyor'}
                  </p>
                </div>
                
                {u.email !== ADMIN_EMAIL && (
                  <button
                    onClick={() => setViewingUserId(u.id)}
                    className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Kütüphanesini Gör
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
