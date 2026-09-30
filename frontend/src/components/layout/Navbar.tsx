import React, { useState, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Plus,
  Play,
  Zap,
  Globe,
  Code2,
  Download,
  History,
  Settings,
  Trash2,
  BookOpen,
  MonitorPlay,
  BarChart3,
  Sparkles,
  Share2,
  ShieldCheck,
  Radio,
  Laptop,
} from 'lucide-react';
import { useCollectionStore } from '@/store/collection-store';
import { useUIStore } from '@/store/ui-store';
import { Button } from '@/components/ui/Button';
import { AnalyticsModal } from '@/components/modals/AnalyticsModal';

interface NavbarProps {
  currentView: 'studio' | 'landing';
  onToggleView: (view: 'studio' | 'landing') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onToggleView }) => {
  const {
    collections,
    activeCollection,
    selectCollection,
    createCollection,
    deleteCollection,
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    history,
  } = useCollectionStore();

  const {
    executionMode,
    setExecutionMode,
    setCodeSnippetOpen,
    setImportOpen,
    setEnvOpen,
    setHistoryOpen,
    setRunnerOpen,
    setTemplatesOpen,
    setShareOpen,
    setWebhookOpen,
  } = useUIStore();

  const [colDropdownOpen, setColDropdownOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [isCreatingCol, setIsCreatingCol] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    } else {
      alert('To install APIFlow Studio as an app, click the Install icon in your browser address bar (Chrome, Edge, or Brave).');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasAdminQuery = window.location.search.includes('admin=');
      const hasAdminCookie = document.cookie.includes('apiflow_admin_key');
      setIsAdminActive(hasAdminQuery || hasAdminCookie);

      const handleKeyDown = (e: KeyboardEvent) => {
        // Ctrl+Shift+A or Cmd+Shift+A toggles Analytics
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
          e.preventDefault();
          setAnalyticsOpen((prev) => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    await createCollection(newColName.trim());
    setNewColName('');
    setIsCreatingCol(false);
    setColDropdownOpen(false);
    // Reset filters so the new collection and endpoint are fully visible
    useUIStore.getState().setMethodFilter('ALL');
    useUIStore.getState().setSearchQuery('');
  };

  if (currentView === 'landing') {
    return (
      <header className="h-14 bg-[#141720] border-b border-[#2A2F45] px-4 sm:px-6 flex items-center justify-between select-none z-30 shrink-0">
        {/* Brand */}
        <div
          onClick={() => onToggleView('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="APIFlow Studio"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">APIFlow</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                STUDIO
              </span>
            </div>
          </div>
        </div>

        {/* Center Quick Anchor Links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-white/60">
          <a href="#interactive-demo" className="hover:text-white transition-colors">
            Interactive Tour
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#assertions-preview" className="hover:text-white transition-colors">
            Test Builder
          </a>
          <a href="#webhooks-preview" className="hover:text-white transition-colors">
            Webhooks
          </a>
          <a href="#offline-desktop" className="hover:text-white transition-colors">
            Offline PWA
          </a>
          <a href="#open-design" className="hover:text-white transition-colors">
            Open Design
          </a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAdminActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAnalyticsOpen(true)}
              leftIcon={<BarChart3 className="w-3.5 h-3.5 text-cyan-400" />}
              title="Admin Telemetry (Ctrl+Shift+A)"
              className="hidden sm:inline-flex"
            >
              Analytics
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleInstallPWA}
            leftIcon={<Laptop className="w-3.5 h-3.5 text-indigo-400" />}
            title="Install APIFlow Studio as desktop app (PWA)"
            className="hidden sm:inline-flex"
          >
            Install App
          </Button>

          <Button
            size="sm"
            variant="accent"
            onClick={() => onToggleView('studio')}
            leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
            className="shadow-md shadow-indigo-500/25 px-4"
          >
            Launch Studio
          </Button>
        </div>

        <AnalyticsModal isOpen={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
      </header>
    );
  }

  return (
    <header className="h-14 min-h-[3.5rem] bg-[#141720] border-b border-[#2A2F45] px-3 sm:px-4 flex items-center justify-between select-none z-30 gap-2 shrink-0 relative">
      {/* Left: Brand + Collection Picker */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div
          onClick={() => onToggleView('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Go to landing page"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">APIFlow</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                STUDIO
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-[#2A2F45]" />

        {/* Collection Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setColDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-xs font-medium text-white/90 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="max-w-[220px] sm:max-w-[280px] truncate">{activeCollection?.name || 'Select Collection'}</span>
            <ChevronDown className="w-3 h-3 text-white/50 shrink-0" />
          </button>

          {colDropdownOpen && (
            <>
              {/* Backdrop for closing dropdown on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setColDropdownOpen(false);
                  setIsCreatingCol(false);
                }}
              />

              <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#141720] border border-[#2A2F45] rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  Collections
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className={`group flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[#1C2030] cursor-pointer ${
                        col.id === activeCollection?.id ? 'text-indigo-400 font-medium bg-[#1C2030]/60' : 'text-white/80'
                      }`}
                      onClick={() => {
                        selectCollection(col.id);
                        setColDropdownOpen(false);
                        useUIStore.getState().setMethodFilter('ALL');
                        useUIStore.getState().setSearchQuery('');
                      }}
                    >
                      <span className="truncate flex-1">{col.name}</span>
                      {collections.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete collection "${col.name}"?`)) {
                              deleteCollection(col.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded ml-2 transition-opacity"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2A2F45] my-1 pt-1 px-2">
                  {!isCreatingCol ? (
                    <button
                      onClick={() => setIsCreatingCol(true)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-indigo-400 hover:bg-indigo-500/10 font-medium transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Collection</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateCollection} className="p-1 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Collection Name..."
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        autoFocus
                        className="w-full px-2 py-1 text-xs bg-[#0C0E12] border border-[#2A2F45] rounded text-white focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex gap-1 justify-end">
                        <Button size="xs" variant="ghost" type="button" onClick={() => setIsCreatingCol(false)}>
                          Cancel
                        </Button>
                        <Button size="xs" variant="primary" type="submit">
                          Save
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-1 text-xs text-white/60">
          <button
            onClick={() => setEnvOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-white/80 hover:text-white transition-colors"
            title="Manage environment variables"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="max-w-[100px] truncate">{activeEnv?.name || 'No Environment'}</span>
            <Settings className="w-3 h-3 text-white/40 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Center: Execution Mode Segmented Control */}
      <div className="flex items-center bg-[#0C0E12] p-1 rounded-lg border border-[#2A2F45] shrink-0 whitespace-nowrap">
        <button
          onClick={() => setExecutionMode('mock')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all shrink-0 whitespace-nowrap ${
            executionMode === 'mock'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Simulate responses client-side with 7 status codes & Faker heuristics"
        >
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">Mock Engine</span>
        </button>

        <button
          onClick={() => setExecutionMode('live')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all shrink-0 whitespace-nowrap ${
            executionMode === 'live'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
          title="Send real HTTP requests via local backend CORS bypass proxy"
        >
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">Live Proxy</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setTemplatesOpen(true)}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          title="Browse industry API starter templates (Stripe, OpenAI, SaaS Auth)"
        >
          Templates
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setWebhookOpen(true)}
          leftIcon={<Radio className="w-3.5 h-3.5 text-rose-400" />}
          title="Simulate and dispatch Stripe, GitHub, Clerk webhooks to local handlers"
        >
          Webhooks
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setRunnerOpen(true)}
          leftIcon={<Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/30" />}
          title="Run all endpoints in collection sequentially"
        >
          Runner
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setCodeSnippetOpen(true)}
          leftIcon={<Code2 className="w-3.5 h-3.5 text-indigo-400" />}
          title="Generate cURL, TypeScript, Axios, and Python code"
        >
          Code
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShareOpen(true)}
          leftIcon={<Share2 className="w-3.5 h-3.5 text-cyan-400" />}
          title="Generate 1-click shareable interactive mock link"
        >
          Share
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setImportOpen(true)}
          leftIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
          title="Import / Export OpenAPI 3.1 & Postman 2.1 collections"
        >
          Portability
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setHistoryOpen(true)}
          leftIcon={<History className="w-3.5 h-3.5 text-amber-400" />}
          className="relative"
          title="View recent execution history"
        >
          <span>History</span>
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-indigo-500/30 text-indigo-300 rounded-full font-mono">
              {history.length}
            </span>
          )}
        </Button>

        {isAdminActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAnalyticsOpen(true)}
            leftIcon={<BarChart3 className="w-3.5 h-3.5 text-cyan-400" />}
            title="Admin Telemetry (Ctrl+Shift+A)"
          >
            Analytics
          </Button>
        )}

        <Button
          size="sm"
          variant="ghost"
          onClick={handleInstallPWA}
          leftIcon={<Laptop className="w-3.5 h-3.5 text-indigo-400" />}
          title="Install APIFlow Studio as desktop app (PWA)"
          className="text-white/70 hover:text-white"
        >
          Install App
        </Button>

        <div className="h-5 w-px bg-[#2A2F45] mx-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={() => onToggleView('landing')}
          leftIcon={<BookOpen className="w-3.5 h-3.5 text-purple-400" />}
          title="Return to Landing Page & Overview Docs"
        >
          Overview & Docs
        </Button>
      </div>

      <AnalyticsModal isOpen={analyticsOpen} onClose={() => setAnalyticsOpen(false)} />
    </header>
  );
};
