import React, { useEffect, useState } from 'react';
import { useCollectionStore } from '@/store/collection-store';
import { Navbar } from '@/components/layout/Navbar';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/components/landing/LandingPage';
import { Zap } from 'lucide-react';
import { trackPageView } from '@/lib/analytics';

export const App: React.FC = () => {
  const { init, isLoading } = useCollectionStore();
  const [view, setView] = useState<'studio' | 'landing'>('studio');

  useEffect(() => {
    init();
    trackPageView();
  }, [init]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0C0E12] flex flex-col items-center justify-center text-white select-none">
        <div className="relative mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
        </div>
        <h2 className="text-base font-semibold tracking-tight text-white/90">APIFlow Studio</h2>
        <p className="text-xs text-white/40 mt-1">Initializing Dexie.js database & Enterprise mock seed...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0C0E12] flex flex-col overflow-hidden text-white">
      {/* Top Navbar */}
      <Navbar currentView={view} onToggleView={setView} />

      {/* Main View Area */}
      {view === 'studio' ? (
        <AppShell />
      ) : (
        <LandingPage onLaunchStudio={() => setView('studio')} />
      )}
    </div>
  );
};

export default App;
