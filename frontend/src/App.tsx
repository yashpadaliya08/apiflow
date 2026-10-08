import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useCollectionStore } from '@/store/collection-store';
import { Navbar } from '@/components/layout/Navbar';
import { Zap } from 'lucide-react';
import { trackPageView } from '@/lib/analytics';

const AppShell = lazy(() => import('@/components/layout/AppShell').then((m) => ({ default: m.AppShell })));
const LandingPage = lazy(() => import('@/components/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const StatsDashboard = lazy(() => import('@/components/stats/StatsDashboard').then((m) => ({ default: m.StatsDashboard })));

export const App: React.FC = () => {
  const { init, isLoading } = useCollectionStore();
  const [view, setView] = useState<'studio' | 'landing'>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes('mock=') || search.includes('view=studio') || hash === '#studio') {
        return 'studio';
      }
    }
    return 'landing';
  });
  const isStats = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/stats') || window.location.pathname.startsWith('/admin/stats')
  );

  useEffect(() => {
    trackPageView();
    if (isStats) return;

    if (view === 'studio') {
      init();
    } else {
      // Warm up database in background only when main thread is idle (preserves LCP & TBT)
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = window.requestIdleCallback(() => init(), { timeout: 4000 });
        return () => window.cancelIdleCallback(id);
      } else {
        const timer = setTimeout(() => init(), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [init, isStats, view]);

  if (isStats) {
    return (
      <Suspense fallback={<div className="h-screen w-screen bg-[#090B0E] flex items-center justify-center text-white text-xs">Loading Telemetry...</div>}>
        <StatsDashboard />
      </Suspense>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0C0E12] flex flex-col overflow-hidden text-white">
      {/* Top Navbar */}
      <Navbar currentView={view} onToggleView={setView} />

      {/* Main View Area */}
      {view === 'studio' ? (
        isLoading ? (
          <div className="h-full w-full bg-[#0C0E12] flex flex-col items-center justify-center text-white select-none">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
                <Zap className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
            <h2 className="text-base font-semibold tracking-tight text-white/90">APIFlow Studio</h2>
            <p className="text-xs text-white/40 mt-1 font-mono">Initializing Dexie.js database & Enterprise mock seed...</p>
          </div>
        ) : (
          <Suspense fallback={<div className="h-full w-full bg-[#0C0E12] flex items-center justify-center text-white/50 text-xs font-mono">Loading Studio...</div>}>
            <AppShell />
          </Suspense>
        )
      ) : (
        <Suspense fallback={<div className="h-full w-full bg-[#0C0E12] flex items-center justify-center text-white/50 text-xs">Loading Overview...</div>}>
          <LandingPage onLaunchStudio={() => {
            init();
            setView('studio');
          }} />
        </Suspense>
      )}
    </div>
  );
};

export default App;
