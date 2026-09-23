import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExecutionMode } from '@/types';

interface UIState {
  // Theme
  theme: 'dark';
  // Active
  activeCollectionId: string | null;
  activeEndpointId: string | null;
  // Sidebar
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  searchQuery: string;
  methodFilter: 'ALL' | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // Modals
  codeSnippetOpen: boolean;
  importOpen: boolean;
  exportOpen: boolean;
  historyOpen: boolean;
  envOpen: boolean;
  // Execution
  executionMode: ExecutionMode;
  isExecuting: boolean;
  // Request panel active tab
  requestTab: 'params' | 'headers' | 'body' | 'path';
  // Response panel active tab
  responseTab: 'body' | 'headers' | 'cookies';

  // Actions
  setActiveCollection: (id: string | null) => void;
  setActiveEndpoint: (id: string | null) => void;
  setSidebarWidth: (w: number) => void;
  toggleSidebar: () => void;
  setSearchQuery: (q: string) => void;
  setMethodFilter: (m: UIState['methodFilter']) => void;
  setCodeSnippetOpen: (v: boolean) => void;
  setImportOpen: (v: boolean) => void;
  setExportOpen: (v: boolean) => void;
  setHistoryOpen: (v: boolean) => void;
  setEnvOpen: (v: boolean) => void;
  setExecutionMode: (m: ExecutionMode) => void;
  setIsExecuting: (v: boolean) => void;
  setRequestTab: (t: UIState['requestTab']) => void;
  setResponseTab: (t: UIState['responseTab']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeCollectionId: null,
      activeEndpointId: null,
      sidebarWidth: 280,
      sidebarCollapsed: false,
      searchQuery: '',
      methodFilter: 'ALL',
      codeSnippetOpen: false,
      importOpen: false,
      exportOpen: false,
      historyOpen: false,
      envOpen: false,
      executionMode: 'mock',
      isExecuting: false,
      requestTab: 'params',
      responseTab: 'body',

      setActiveCollection: (id) => set({ activeCollectionId: id }),
      setActiveEndpoint: (id) => set({ activeEndpointId: id }),
      setSidebarWidth: (w) => set({ sidebarWidth: w }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setMethodFilter: (m) => set({ methodFilter: m }),
      setCodeSnippetOpen: (v) => set({ codeSnippetOpen: v }),
      setImportOpen: (v) => set({ importOpen: v }),
      setExportOpen: (v) => set({ exportOpen: v }),
      setHistoryOpen: (v) => set({ historyOpen: v }),
      setEnvOpen: (v) => set({ envOpen: v }),
      setExecutionMode: (m) => set({ executionMode: m }),
      setIsExecuting: (v) => set({ isExecuting: v }),
      setRequestTab: (t) => set({ requestTab: t }),
      setResponseTab: (t) => set({ responseTab: t }),
    }),
    {
      name: 'apiflow-ui',
      partialize: (state) => ({
        activeCollectionId: state.activeCollectionId,
        activeEndpointId: state.activeEndpointId,
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
        executionMode: state.executionMode,
      }),
    }
  )
);
