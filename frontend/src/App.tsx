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
      if (search.includes('mock=') || hash.startsWith('#mock=') || search.includes('view=studio') || hash === '#studio') {
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
    <div data-workspace={view === 'studio' ? '' : undefined} className="h-screen w-screen bg-[#0C0E12] flex flex-col overflow-hidden text-white">
      {/* Top Navbar */}
      <Navbar currentView={view} onToggleView={setView} />

      {/* Main View Area */}
      {view === 'studio' ? (
        isLoading ? (
          <div className="h-full w-full bg-[#0C0E12] flex flex-col items-center justify-center text-white select-none">
            <div className="relative mb-4">
              <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center">
                <Zap className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
            <h2 className="text-base font-semibold tracking-tight text-white/90">APIFlow Studio</h2>
            <p role="status" className="text-sm text-slate-400 mt-2">Opening your saved workspace…</p>
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
