import React from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { Overview } from './views/Overview';
import { Library } from './views/Library';
import { Notes } from './views/Notes';
import { Profile } from './views/Profile';
import { FocusTimer } from './components/FocusTimer';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const [currentView, setCurrentView] = React.useState<ViewType>('overview');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto relative bg-transparent pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
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
