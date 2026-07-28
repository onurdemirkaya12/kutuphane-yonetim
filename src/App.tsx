import React from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { AppProvider, useAppContext } from './context/AppContext';
import { Overview } from './views/Overview';
import { Library } from './views/Library';
import { Notes } from './views/Notes';
import { Profile } from './views/Profile';
import { Admin } from './views/Admin';
import { Login } from './views/Login';
import { FocusTimer } from './components/FocusTimer';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, MailWarning, LogOut, Send } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';

function AppContent() {
  const { user, authLoading, logout } = useAppContext();
  const [currentView, setCurrentView] = React.useState<ViewType>('overview');
  const [resending, setResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState('');

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50 dark:bg-[#0a0a0a]">
        <Loader2 size={40} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!user.emailVerified) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-stone-50 dark:bg-[#0a0a0a] p-4 text-stone-900 dark:text-stone-100">
        <div className="max-w-md w-full glass-panel p-8 rounded-3xl shadow-xl text-center border border-stone-200/50 dark:border-stone-800/50">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-6">
            <MailWarning size={40} />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-4">E-posta Doğrulaması Gerekli</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-8">
            Kütüphanenize erişmek için lütfen <strong>{user.email}</strong> adresine gönderilen doğrulama bağlantısına tıklayın. Eğer maili göremiyorsanız spam kutusunu kontrol edebilirsiniz.
          </p>
          
          {resendMessage && (
            <p className={`text-sm mb-4 font-medium ${resendMessage.includes('Hata') ? 'text-red-500' : 'text-emerald-500'}`}>
              {resendMessage}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={async () => {
                setResending(true);
                try {
                  await sendEmailVerification(user);
                  setResendMessage("Doğrulama maili tekrar gönderildi!");
                } catch (error: any) {
                  console.error(error);
                  if (error.code === 'auth/too-many-requests') {
                    setResendMessage("Çok fazla istek yapıldı. Lütfen biraz bekleyin.");
                  } else {
                    setResendMessage("Bir hata oluştu. Daha sonra tekrar deneyin.");
                  }
                } finally {
                  setResending(false);
                }
              }}
              disabled={resending}
              className="w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              {resending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Doğrulama Mailini Tekrar Gönder
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 py-3 rounded-xl font-medium hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <LogOut size={18} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto relative bg-transparent pt-[env(safe-area-inset-top)] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="min-h-full"
          >
            {currentView === 'overview' && <Overview />}
            {currentView === 'library' && <Library />}
            {currentView === 'notes' && <Notes />}
            {currentView === 'profile' && <Profile />}
            {currentView === 'admin' && <Admin />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <FocusTimer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
