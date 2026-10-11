import { saveAs } from 'file-saver';
import type { Collection, Endpoint, HttpMethod, KeyValue } from '@/types';

// Normalize legacy numeric bounds only at schema positions, never inside example data.
function exportSchema31(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const schema = { ...(raw as Record<string, unknown>) };
  for (const [exclusive, inclusive] of [['exclusiveMinimum', 'minimum'], ['exclusiveMaximum', 'maximum']]) {
    if (typeof schema[exclusive] === 'boolean') {
      if (schema[exclusive] === true) {
        if (typeof schema[inclusive] !== 'number') throw new Error(`${exclusive} requires a numeric ${inclusive} before OpenAPI export.`);
        schema[exclusive] = schema[inclusive];
        delete schema[inclusive];
      } else delete schema[exclusive];
    }
  }
  for (const key of ['properties', 'patternProperties', '$defs', 'definitions', 'dependentSchemas']) {
    const entries = schema[key];
    if (entries && typeof entries === 'object' && !Array.isArray(entries)) schema[key] = Object.fromEntries(Object.entries(entries).map(([name, child]) => [name, exportSchema31(child)]));
  }
  for (const key of ['items', 'additionalProperties', 'additionalItems', 'contains', 'not', 'if', 'then', 'else', 'propertyNames', 'unevaluatedProperties', 'unevaluatedItems']) {
    if (key in schema) schema[key] = exportSchema31(schema[key]);
  }
  for (const key of ['allOf', 'oneOf', 'anyOf', 'prefixItems']) {
    if (Array.isArray(schema[key])) schema[key] = (schema[key] as unknown[]).map(exportSchema31);
  }
  return schema;
}

// ═══════════════════════════════════════════════════
// EXPORT: OpenAPI 3.1.0 JSON
// ═══════════════════════════════════════════════════
export function exportToOpenAPI(collection: Collection, endpoints: Endpoint[]): string {
  const paths: Record<string, Record<string, unknown>> = {};
  const templatePaths = new Map<string, string>();

  endpoints.forEach((ep) => {
    // Convert /api/v1/users/:id or {id} into OpenAPI format /api/v1/users/{id}
    if (/\{\{/.test(ep.path) || /\{\{/.test(collection.baseUrl || '')) throw new Error('Resolve URL variables before exporting OpenAPI, or use Postman export.');
    const absolute = ep.path.match(/^(https?:\/\/[^/?#]+)(\/[^?#]*)?$/i);
    if (/[?#]/.test(ep.path) || (!absolute && !ep.path.startsWith('/'))) throw new Error('OpenAPI paths must be absolute HTTP URLs or start with /. Move query values into query parameters.');
    const server = absolute ? new URL(absolute[1]) : undefined;
    if (server?.username || server?.password) throw new Error('Remove URL credentials before exporting OpenAPI.');
    const openApiPath = (absolute ? absolute[2] || '/' : ep.path).replace(/(^|\/):([a-zA-Z0-9_]+)(?=\/|$)/g, '$1{$2}');
    const shape = openApiPath.replace(/\{[^{}]+\}/g, '{}');
    if (templatePaths.has(shape) && templatePaths.get(shape) !== openApiPath) throw new Error(`OpenAPI path template collision: ${openApiPath}. Use consistent parameter names.`);
    templatePaths.set(shape, openApiPath);

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const methodLower = ep.method.toLowerCase();
    if (paths[openApiPath][methodLower]) throw new Error(`Duplicate OpenAPI operation: ${ep.method} ${openApiPath}. Export these endpoints separately.`);
    const parameters: unknown[] = [];

    // Path params
    ep.pathParams.filter((p) => p.enabled && p.key).forEach((p) => {
      parameters.push({
        name: p.key,
        in: 'path',
        required: true,
        schema: { type: 'string' },
        example: p.value,
      });
    });

    // Query params
    ep.queryParams.filter((q) => q.enabled && q.key).forEach((q) => {
      parameters.push({
        name: q.key,
        in: 'query',
        required: false,
        schema: { type: 'string' },
        example: q.value,
      });
    });

    // Headers
    ep.headers
      .filter((h) => h.enabled && h.key && !['content-type', 'accept'].includes(h.key.toLowerCase()))
      .forEach((h) => {
        parameters.push({
          name: h.key,
          in: 'header',
          required: false,
          schema: { type: 'string' },
          example: h.value,
        });
      });

    let requestBodyObj: unknown = undefined;
    if (ep.requestBody && ['POST', 'PUT', 'PATCH'].includes(ep.method)) {
      try {
        const parsed = JSON.parse(ep.requestBody);
        requestBodyObj = {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                example: parsed,
              },
            },
          },
        };
      } catch {
        requestBodyObj = {
          content: {
            'application/json': {
              schema: { type: 'string' },
            },
          },
        };
      }
    }

    paths[openApiPath][methodLower] = {
      servers: server ? [{ url: server.origin }] : undefined,
      summary: ep.name,
      description: ep.summary || `${ep.method} ${ep.path}`,
      tags: [ep.resource || 'Default'],
      parameters: parameters.length > 0 ? parameters : undefined,
      requestBody: requestBodyObj,
      responses: {
        [ep.mockScenario || '200']: {
          description: `Successful simulation for ${ep.mockScenario || '200'}`,
          content: {
            'application/json': {
              schema: exportSchema31(ep.responseSchema || { type: 'object' }),
              example: ep.responseExample,
            },
          },
        },
      },
    };
  });

  const spec = {
    openapi: '3.1.0',
    info: {
      title: collection.name,
      version: '1.0.0',
      description: collection.description || 'Exported from APIFlow Studio',
    },
    servers: [
      {
        url: collection.baseUrl || 'https://api.example.com',
        description: 'Default Server',
      },
    ],
    paths,
  };

  return JSON.stringify(spec, null, 2);
}

// ═══════════════════════════════════════════════════
// EXPORT: Postman Collection v2.1.0 JSON
// ═══════════════════════════════════════════════════
export function exportToPostman(collection: Collection, endpoints: Endpoint[]): string {
  // Group endpoints by resource folder
  const folders: Record<string, Endpoint[]> = {};

  endpoints.forEach((ep) => {
    const res = ep.resource || 'General';
    if (!folders[res]) folders[res] = [];
    folders[res].push(ep);
  });

  const items = Object.entries(folders).map(([folderName, eps]) => ({
    name: folderName,
    item: eps.map((ep) => {
      const rawPath = /^(https?:\/\/|\{\{)/i.test(ep.path) ? ep.path : `{{baseUrl}}/${ep.path.replace(/^\//, '')}`;

      return {
        name: ep.name,
        request: {
          method: ep.method,
          header: ep.headers
            .filter((h) => h.enabled && h.key)
            .map((h) => ({
              key: h.key,
              value: h.value,
              type: 'text',
            })),
          url: {
            raw: `${rawPath}${
              ep.queryParams.filter((q) => q.enabled && q.key).length > 0
                ? (rawPath.includes('?') ? '&' : '?') + ep.queryParams.filter((q) => q.enabled && q.key).map((q) => `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value)}`).join('&')
                : ''
            }`,
            variable: ep.pathParams.filter(p => p.key).map(p => ({key:p.key,value:p.value,disabled:!p.enabled})),
            query: ep.queryParams
              .filter((q) => q.key)
              .map((q) => ({ key: q.key, value: q.value, disabled: !q.enabled })),
          },
          body:
            ep.requestBody && ['POST', 'PUT', 'PATCH'].includes(ep.method)
              ? {
                  mode: 'raw',
                  raw: ep.requestBody,
                  options: { raw: { language: 'json' } },
                }
              : undefined,
          description: ep.summary || '',
        },
        response: [],
      };
    }),
  }));

  const postman = {
    info: {
      _postman_id: collection.id,
      name: collection.name,
      description: collection.description || 'Exported from APIFlow Studio',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      ...(collection.variables || []).filter(v => v.key !== 'baseUrl' && v.enabled).map(v => ({ key: v.key, value: v.value, type: 'string' })),
      {
        key: 'baseUrl',
        value: collection.baseUrl || 'https://api.example.com',
        type: 'string',
      },
    ],
    item: items,
  };

  return JSON.stringify(postman, null, 2);
}

// ═══════════════════════════════════════════════════
// IMPORT: Parse OpenAPI or Postman JSON
// ═══════════════════════════════════════════════════
export { importCollection } from './collection-import';
export type { ImportResult } from './collection-import';

// ═══════════════════════════════════════════════════
// DOWNLOAD HELPER
// ═══════════════════════════════════════════════════
export function downloadFile(content: string, filename: string, contentType = 'application/json') {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  saveAs(blob, filename);
}
