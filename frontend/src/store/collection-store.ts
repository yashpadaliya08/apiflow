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

      let currentCollection = collections[0] || null;
      if (currentCollection) {
        set({ activeCollection: currentCollection });
        const endpoints = await db.endpoints.where('collectionId').equals(currentCollection.id).toArray();
        set({ endpoints, activeEndpoint: endpoints[0] || null });
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
        await db.environments.add(defaultEnv);
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
    set({
      activeCollection: col,
      endpoints,
      activeEndpoint: endpoints[0] || null,
    });
  },

  createCollection: async (name: string, baseUrl = 'https://api.example.com') => {
    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name,
      baseUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collections.add(newCol);
    const collections = await db.collections.toArray();
    set({ collections, activeCollection: newCol, endpoints: [], activeEndpoint: null });
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
    const nextCol = collections[0] || null;
    let nextEndpoints: Endpoint[] = [];
    if (nextCol) {
      nextEndpoints = await db.endpoints.where('collectionId').equals(nextCol.id).toArray();
    }
    set({
      collections,
      activeCollection: nextCol,
      endpoints: nextEndpoints,
      activeEndpoint: nextEndpoints[0] || null,
    });
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
    if (ep) set({ activeEndpoint: ep });
  },

  createEndpoint: async (collectionId: string, partial: Partial<Endpoint> = {}) => {
    const newEndpoint: Endpoint = {
      id: `ep-${Date.now()}`,
      collectionId,
      name: partial.name || 'New Endpoint',
      method: partial.method || 'GET',
      path: partial.path || '/api/v1/resource',
      resource: partial.resource || 'General',
      authRequired: partial.authRequired ?? false,
      queryParams: partial.queryParams || [],
      pathParams: partial.pathParams || [],
      headers: partial.headers || [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
      requestBody: partial.requestBody || '',
      mockScenario: partial.mockScenario || 200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...partial,
    };
    await db.endpoints.add(newEndpoint);
    const endpoints = await db.endpoints.where('collectionId').equals(collectionId).toArray();
    set({ endpoints, activeEndpoint: newEndpoint });
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
    await db.endpoints.put({ ...active, updatedAt: new Date().toISOString() });
  },

  deleteEndpoint: async (id: string) => {
    await db.endpoints.delete(id);
    const activeCol = get().activeCollection;
    if (activeCol) {
      const endpoints = await db.endpoints.where('collectionId').equals(activeCol.id).toArray();
      const activeEp = get().activeEndpoint;
      const nextActive = activeEp?.id === id ? endpoints[0] || null : activeEp;
      set({ endpoints, activeEndpoint: nextActive });
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
