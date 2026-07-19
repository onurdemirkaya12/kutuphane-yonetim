import React from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { Overview } from './views/Overview';
import { Library } from './views/Library';
import { Notes } from './views/Notes';
import { Discover } from './views/Discover';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const [currentView, setCurrentView] = React.useState<ViewType>('overview');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 overflow-y-auto relative bg-transparent">
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
            {currentView === 'discover' && <Discover />}
          </motion.div>
        </AnimatePresence>
      </main>
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
