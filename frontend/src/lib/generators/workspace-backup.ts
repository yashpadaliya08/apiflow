import { db } from '@/lib/db/dexie-db';
import type { Collection, Endpoint, Environment } from '@/types';
import { downloadFile } from './import-export';
import { z } from 'zod';
import { collectionSchema, endpointSchema, environmentSchema } from '@/lib/validation';

const backupSchema = z.object({
  version: z.literal('1.0'),
  collections: z.array(collectionSchema).max(500),
  endpoints: z.array(endpointSchema).max(10000),
  environments: z.array(environmentSchema).max(500).default([]),
});

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

  const validated = backupSchema.safeParse(parsed);
  if (!validated.success) throw new Error('Backup validation failed. Check its version, collections, endpoints and environments. Nothing was restored.');
  parsed = validated.data;
  const collectionIds = new Set(parsed.collections.map((col: Collection) => col.id));
  if (parsed.endpoints.some((ep: Endpoint) => !collectionIds.has(ep.collectionId))) throw new Error('Backup contains endpoints without a matching collection.');
  await db.transaction('rw', db.collections, db.endpoints, db.environments, async () => {
    await db.collections.bulkPut(parsed.collections);
    await db.endpoints.bulkPut(parsed.endpoints);
    await db.environments.bulkPut(parsed.environments);
  });

  return {
    collectionCount: parsed.collections.length,
    endpointCount: parsed.endpoints.length,
    environmentCount: parsed.environments?.length || 0,
  };
}
