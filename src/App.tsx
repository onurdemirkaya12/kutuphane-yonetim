import React from 'react';
import { Sidebar, ViewType } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { Overview } from './views/Overview';
import { Library } from './views/Library';
import { Notes } from './views/Notes';
import { Discover } from './views/Discover';

export default function App() {
  const [currentView, setCurrentView] = React.useState<ViewType>('overview');

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-stone-50">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
        
        <main className="flex-1 overflow-y-auto">
          {currentView === 'overview' && <Overview />}
          {currentView === 'library' && <Library />}
          {currentView === 'notes' && <Notes />}
          {currentView === 'discover' && <Discover />}
        </main>
      </div>
    </AppProvider>
  );
}
