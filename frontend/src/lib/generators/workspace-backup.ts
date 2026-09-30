import { db } from '@/lib/db/dexie-db';
import type { Collection, Endpoint, Environment } from '@/types';
import { downloadFile } from './import-export';

export interface WorkspaceBackup {
  version: '1.0';
  exportedAt: string;
  source: 'APIFlow Studio — Open Design Engine';
  collections: Collection[];
  endpoints: Endpoint[];
  environments: Environment[];
}

/**
 * Exports all collections, endpoints, and environments into a universal JSON backup.
 */
export async function exportFullWorkspace(): Promise<void> {
  const [collections, endpoints, environments] = await Promise.all([
    db.collections.toArray(),
    db.endpoints.toArray(),
    db.environments.toArray(),
  ]);

  const backup: WorkspaceBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: 'APIFlow Studio — Open Design Engine',
    collections,
    endpoints,
    environments,
  };

  const filename = `apiflow-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(JSON.stringify(backup, null, 2), filename);
}

/**
 * Validates and restores a workspace backup into IndexedDB.
 */
export async function restoreWorkspaceBackup(jsonString: string): Promise<{
  collectionCount: number;
  endpointCount: number;
  environmentCount: number;
}> {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON file format.');
  }

  if (!parsed || !Array.isArray(parsed.collections) || !Array.isArray(parsed.endpoints)) {
    throw new Error('Backup file is missing required collections or endpoints structure.');
  }

  // Restore collections
  for (const col of parsed.collections) {
    await db.collections.put(col);
  }

  // Restore endpoints
  for (const ep of parsed.endpoints) {
    await db.endpoints.put(ep);
  }

  // Restore environments if present
  if (Array.isArray(parsed.environments)) {
    for (const env of parsed.environments) {
      await db.environments.put(env);
    }
  }

  return {
    collectionCount: parsed.collections.length,
    endpointCount: parsed.endpoints.length,
    environmentCount: parsed.environments?.length || 0,
  };
}
