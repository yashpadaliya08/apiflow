import { create } from 'zustand';
import { db } from '@/lib/db/dexie-db';
import { seedDatabase } from '@/lib/db/seed-data';
import type { Collection, Endpoint, Environment, HistoryEntry, KeyValue } from '@/types';

interface CollectionState {
  collections: Collection[];
  endpoints: Endpoint[];
  activeEndpoint: Endpoint | null;
  activeCollection: Collection | null;
  environments: Environment[];
  activeEnvironmentId: string | null;
  history: HistoryEntry[];
  isLoading: boolean;

  // Initializer
  init: () => Promise<void>;

  // Collections
  loadCollections: () => Promise<void>;
  selectCollection: (id: string) => Promise<void>;
  createCollection: (name: string, baseUrl?: string) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  // Endpoints
  loadEndpoints: (collectionId: string) => Promise<void>;
  selectEndpoint: (id: string | null) => Promise<void>;
  createEndpoint: (collectionId: string, partial?: Partial<Endpoint>) => Promise<Endpoint>;
  updateEndpoint: (id: string, updates: Partial<Endpoint>) => Promise<void>;
  deleteEndpoint: (id: string) => Promise<void>;
  updateActiveEndpointDraft: (updates: Partial<Endpoint>) => void;
  saveActiveEndpointDraft: () => Promise<void>;

  // Environments
  loadEnvironments: () => Promise<void>;
  saveEnvironment: (env: Environment) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironmentId: (id: string | null) => void;

  // History
  loadHistory: () => Promise<void>;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id'>) => Promise<void>;
  clearHistory: () => Promise<void>;
}

// Debounce timer for saving endpoint drafts
let saveDraftTimer: ReturnType<typeof setTimeout> | null = null;

const STORAGE_KEY_COL = 'apiflow_active_col';
const STORAGE_KEY_EP = 'apiflow_active_ep';

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  endpoints: [],
  activeEndpoint: null,
  activeCollection: null,
  environments: [],
  activeEnvironmentId: null,
  history: [],
  isLoading: true,

  init: async () => {
    try {
      set({ isLoading: true });
      await seedDatabase();

      const collections = await db.collections.toArray();
      set({ collections });

      // Restore active collection from localStorage if possible
      const savedColId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_COL) : null;
      let currentCollection = collections.find((c) => c.id === savedColId) || collections[0] || null;

      if (!currentCollection && collections.length === 0) {
        // Fallback create default collection if DB was completely wiped
        currentCollection = {
          id: 'col-default',
          name: 'My API Collection',
          baseUrl: 'https://api.example.com',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.collections.put(currentCollection);
        set({ collections: [currentCollection] });
      }

      if (currentCollection) {
        set({ activeCollection: currentCollection });
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_COL, currentCollection.id);
        }

        const endpoints = await db.endpoints.where('collectionId').equals(currentCollection.id).toArray();
        const savedEpId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_EP) : null;
        const currentEndpoint = endpoints.find((e) => e.id === savedEpId) || endpoints[0] || null;

        set({ endpoints, activeEndpoint: currentEndpoint });
        if (currentEndpoint && typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_EP, currentEndpoint.id);
        }
      }

      // Load environments
      const envs = await db.environments.toArray();
      if (envs.length === 0) {
        const defaultEnv: Environment = {
          id: 'env-default',
          name: 'Development',
          isActive: true,
          variables: [
            { id: 'v1', key: 'baseUrl', value: 'https://api.enterprise.dev', enabled: true },
            { id: 'v2', key: 'apiVersion', value: 'v1', enabled: true },
            { id: 'v3', key: 'token', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ae9...', enabled: true },
          ],
        };
        await db.environments.put(defaultEnv);
        set({ environments: [defaultEnv], activeEnvironmentId: defaultEnv.id });
      } else {
        const active = envs.find((e) => e.isActive) || envs[0];
        set({ environments: envs, activeEnvironmentId: active?.id || null });
      }

      // Load history
      const history = await db.history.orderBy('id').reverse().limit(50).toArray();
      set({ history });
    } catch (err) {
      console.error('[CollectionStore] Init error:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  loadCollections: async () => {
    const collections = await db.collections.toArray();
    set({ collections });
  },

  selectCollection: async (id: string) => {
    const col = await db.collections.get(id);
    if (!col) return;
    const endpoints = await db.endpoints.where('collectionId').equals(id).toArray();
    const activeEp = endpoints[0] || null;

    set({
      activeCollection: col,
      endpoints,
      activeEndpoint: activeEp,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_COL, col.id);
      if (activeEp) localStorage.setItem(STORAGE_KEY_EP, activeEp.id);
    }
  },

  createCollection: async (name: string, baseUrl = 'https://api.example.com') => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newCol: Collection = {
      id: `col-${Date.now()}-${uniqueSuffix}`,
      name: name.trim() || 'Untitled Collection',
      baseUrl: baseUrl.trim() || 'https://api.example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collections.put(newCol);

    // Auto-bootstrap an initial endpoint so the user never gets an empty/broken state
    const starterEndpoint: Endpoint = {
      id: `ep-${Date.now()}-${uniqueSuffix}-1`,
      collectionId: newCol.id,
      name: 'Get Resource',
      method: 'GET',
      path: '/api/v1/resource',
      resource: 'General',
      authRequired: false,
      queryParams: [{ id: 'q1', key: 'page', value: '1', enabled: true }],
      pathParams: [],
      headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
      requestBody: '',
      mockScenario: 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.endpoints.put(starterEndpoint);

    const collections = await db.collections.toArray();
    set({
      collections,
      activeCollection: newCol,
      endpoints: [starterEndpoint],
      activeEndpoint: starterEndpoint,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_COL, newCol.id);
      localStorage.setItem(STORAGE_KEY_EP, starterEndpoint.id);
    }

    return newCol;
  },

  updateCollection: async (id: string, updates: Partial<Collection>) => {
    await db.collections.update(id, { ...updates, updatedAt: new Date().toISOString() });
    const collections = await db.collections.toArray();
    const active = collections.find((c) => c.id === id) || get().activeCollection;
    set({ collections, activeCollection: active });
  },

  deleteCollection: async (id: string) => {
    await db.collections.delete(id);
    await db.endpoints.where('collectionId').equals(id).delete();
    const collections = await db.collections.toArray();
    let nextCol = collections[0] || null;

    if (!nextCol) {
      // Auto-create fallback if user deleted the last collection
      const uniqueSuffix = Math.random().toString(36).substring(2, 7);
      nextCol = {
        id: `col-${Date.now()}-${uniqueSuffix}`,
        name: 'My API Collection',
        baseUrl: 'https://api.example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.collections.put(nextCol);
      collections.push(nextCol);
    }

    const nextEndpoints = await db.endpoints.where('collectionId').equals(nextCol.id).toArray();
    const nextEp = nextEndpoints[0] || null;

    set({
      collections,
      activeCollection: nextCol,
      endpoints: nextEndpoints,
      activeEndpoint: nextEp,
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_COL, nextCol.id);
      if (nextEp) localStorage.setItem(STORAGE_KEY_EP, nextEp.id);
    }
  },

  loadEndpoints: async (collectionId: string) => {
    const endpoints = await db.endpoints.where('collectionId').equals(collectionId).toArray();
    set({ endpoints });
  },

  selectEndpoint: async (id: string | null) => {
    if (!id) {
      set({ activeEndpoint: null });
      return;
    }
    const ep = await db.endpoints.get(id);
    if (!ep) return;

    // If endpoint belongs to a different collection, synchronize active collection
    const activeCol = get().activeCollection;
    if (!activeCol || activeCol.id !== ep.collectionId) {
      const col = await db.collections.get(ep.collectionId);
      if (col) {
        const endpoints = await db.endpoints.where('collectionId').equals(col.id).toArray();
        set({ activeCollection: col, endpoints });
        if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY_COL, col.id);
      }
    }

    set({ activeEndpoint: ep });
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY_EP, ep.id);
  },

  createEndpoint: async (collectionId: string, partial: Partial<Endpoint> = {}) => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const newEndpoint: Endpoint = {
      id: `ep-${Date.now()}-${uniqueSuffix}`,
      collectionId,
      name: partial.name || 'New Endpoint',
      method: partial.method || 'GET',
      path: partial.path || '/api/v1/resource',
      resource: partial.resource || 'General',
      authRequired: partial.authRequired ?? false,
      queryParams: partial.queryParams ? [...partial.queryParams] : [],
      pathParams: partial.pathParams ? [...partial.pathParams] : [],
      headers: partial.headers ? [...partial.headers] : [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
      requestBody: partial.requestBody || '',
      mockScenario: partial.mockScenario || 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...partial,
    };

    await db.endpoints.put(newEndpoint);
    const endpoints = await db.endpoints.where('collectionId').equals(collectionId).toArray();
    set({ endpoints, activeEndpoint: newEndpoint });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_EP, newEndpoint.id);
    }

    return newEndpoint;
  },

  updateEndpoint: async (id: string, updates: Partial<Endpoint>) => {
    await db.endpoints.update(id, { ...updates, updatedAt: new Date().toISOString() });
    const activeCol = get().activeCollection;
    if (activeCol) {
      const endpoints = await db.endpoints.where('collectionId').equals(activeCol.id).toArray();
      const currentActive = get().activeEndpoint;
      const updatedActive = currentActive?.id === id ? { ...currentActive, ...updates } : currentActive;
      set({ endpoints, activeEndpoint: updatedActive });
    }
  },

  updateActiveEndpointDraft: (updates: Partial<Endpoint>) => {
    const active = get().activeEndpoint;
    if (!active) return;
    const updated = { ...active, ...updates };
    set({ activeEndpoint: updated });
    // Auto-sync into endpoints array for snappy UI
    set((state) => ({
      endpoints: state.endpoints.map((e) => (e.id === active.id ? updated : e)),
    }));
  },

  saveActiveEndpointDraft: async () => {
    const active = get().activeEndpoint;
    if (!active) return;

    // Debounce IndexedDB writes to 250ms to prevent lock contention on rapid typing
    if (saveDraftTimer) clearTimeout(saveDraftTimer);
    saveDraftTimer = setTimeout(async () => {
      try {
        const latest = get().activeEndpoint;
        if (latest) {
          await db.endpoints.put({ ...latest, updatedAt: new Date().toISOString() });
        }
      } catch (err) {
        console.error('[CollectionStore] Failed to save draft:', err);
      }
    }, 250);
  },

  deleteEndpoint: async (id: string) => {
    await db.endpoints.delete(id);
    const activeCol = get().activeCollection;
    if (activeCol) {
      const endpoints = await db.endpoints.where('collectionId').equals(activeCol.id).toArray();
      const activeEp = get().activeEndpoint;
      const nextActive = activeEp?.id === id ? endpoints[0] || null : activeEp;
      set({ endpoints, activeEndpoint: nextActive });
      if (nextActive && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_EP, nextActive.id);
      }
    }
  },

  loadEnvironments: async () => {
    const environments = await db.environments.toArray();
    set({ environments });
  },

  saveEnvironment: async (env: Environment) => {
    await db.environments.put(env);
    const environments = await db.environments.toArray();
    set({ environments });
  },

  deleteEnvironment: async (id: string) => {
    await db.environments.delete(id);
    const environments = await db.environments.toArray();
    const activeId = get().activeEnvironmentId === id ? environments[0]?.id || null : get().activeEnvironmentId;
    set({ environments, activeEnvironmentId: activeId });
  },

  setActiveEnvironmentId: (id: string | null) => {
    set({ activeEnvironmentId: id });
  },

  loadHistory: async () => {
    const history = await db.history.orderBy('id').reverse().limit(50).toArray();
    set({ history });
  },

  addHistoryEntry: async (entry: Omit<HistoryEntry, 'id'>) => {
    await db.history.add(entry as HistoryEntry);
    const history = await db.history.orderBy('id').reverse().limit(50).toArray();
    set({ history });
  },

  clearHistory: async () => {
    await db.history.clear();
    set({ history: [] });
  },
}));
