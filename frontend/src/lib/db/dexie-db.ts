import Dexie, { type Table } from 'dexie';
import type { Collection, Endpoint, HistoryEntry, Environment } from '@/types';

class APIFlowDatabase extends Dexie {
  collections!: Table<Collection, string>;
  endpoints!: Table<Endpoint, string>;
  history!: Table<HistoryEntry, number>;
  environments!: Table<Environment, string>;

  constructor() {
    super('APIFlowDB');
    this.version(1).stores({
      collections:  'id, name, createdAt',
      endpoints:    'id, collectionId, method, resource, name',
      history:      '++id, endpointId, timestamp, status, method',
      environments: 'id, name, isActive',
    });
  }
}

export const db = new APIFlowDatabase();
