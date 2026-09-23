import { saveAs } from 'file-saver';
import type { Collection, Endpoint, HttpMethod, KeyValue } from '@/types';

// ═══════════════════════════════════════════════════
// EXPORT: OpenAPI 3.1.0 JSON
// ═══════════════════════════════════════════════════
export function exportToOpenAPI(collection: Collection, endpoints: Endpoint[]): string {
  const paths: Record<string, Record<string, unknown>> = {};

  endpoints.forEach((ep) => {
    // Convert /api/v1/users/:id or {id} into OpenAPI format /api/v1/users/{id}
    const openApiPath = ep.path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const methodLower = ep.method.toLowerCase();
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
              schema: { type: 'object' },
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
      // Split path into segments
      const cleanPath = ep.path.startsWith('/') ? ep.path.slice(1) : ep.path;
      const pathSegments = cleanPath.split('/').filter(Boolean);

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
            raw: `{{baseUrl}}${ep.path}${
              ep.queryParams.filter((q) => q.enabled && q.key).length > 0
                ? '?' + ep.queryParams.filter((q) => q.enabled && q.key).map((q) => `${q.key}=${encodeURIComponent(q.value)}`).join('&')
                : ''
            }`,
            host: ['{{baseUrl}}'],
            path: pathSegments,
            query: ep.queryParams
              .filter((q) => q.enabled && q.key)
              .map((q) => ({ key: q.key, value: q.value })),
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
export interface ImportResult {
  collection: Collection;
  endpoints: Endpoint[];
}

export function importCollection(rawJson: string): ImportResult {
  const data = JSON.parse(rawJson);
  const now = new Date().toISOString();

  // 1. Postman Collection v2.1
  if (data.info && data.info.schema && data.info.schema.includes('postman.com')) {
    const colId = `col-${Date.now()}`;
    const baseUrlVar = Array.isArray(data.variable)
      ? data.variable.find((v: { key: string }) => v.key === 'baseUrl')?.value
      : 'https://api.example.com';

    const collection: Collection = {
      id: colId,
      name: data.info.name || 'Imported Postman Collection',
      description: data.info.description || 'Imported from Postman',
      baseUrl: baseUrlVar || 'https://api.example.com',
      createdAt: now,
      updatedAt: now,
    };

    const endpoints: Endpoint[] = [];

    // Helper to recursively parse items
    function parseItems(items: any[], folderName: string) {
      for (const it of items) {
        if (it.item && Array.isArray(it.item)) {
          parseItems(it.item, it.name || folderName);
        } else if (it.request) {
          const req = it.request;
          const method = (req.method || 'GET').toUpperCase() as HttpMethod;
          const rawUrl = typeof req.url === 'string' ? req.url : req.url?.raw || '';
          // Extract path
          let path = '/';
          try {
            if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
              const u = new URL(rawUrl);
              path = u.pathname;
            } else {
              const cleaned = rawUrl.replace(/\{\{.*?\}\}/g, '');
              const qIdx = cleaned.indexOf('?');
              path = (qIdx >= 0 ? cleaned.slice(0, qIdx) : cleaned) || '/';
            }
          } catch {
            path = rawUrl || '/';
          }

          const queryParams: KeyValue[] = [];
          if (req.url && Array.isArray(req.url.query)) {
            req.url.query.forEach((q: any, i: number) => {
              if (q.key) {
                queryParams.push({
                  id: `q-${Date.now()}-${i}`,
                  key: q.key,
                  value: q.value || '',
                  enabled: true,
                });
              }
            });
          }

          const headers: KeyValue[] = [];
          if (Array.isArray(req.header)) {
            req.header.forEach((h: any, i: number) => {
              if (h.key) {
                headers.push({
                  id: `h-${Date.now()}-${i}`,
                  key: h.key,
                  value: h.value || '',
                  enabled: !h.disabled,
                });
              }
            });
          }

          let requestBody = '';
          if (req.body && req.body.raw) {
            requestBody = req.body.raw;
          }

          endpoints.push({
            id: `ep-${Date.now()}-${endpoints.length}`,
            collectionId: colId,
            name: it.name || `${method} ${path}`,
            method,
            path,
            summary: req.description || '',
            resource: folderName || 'General',
            authRequired: !!req.auth,
            queryParams,
            pathParams: [],
            headers,
            requestBody,
            mockScenario: 200,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    parseItems(data.item || [], 'General');
    return { collection, endpoints };
  }

  // 2. OpenAPI 3.0 / 3.1
  if (data.openapi || data.swagger) {
    const colId = `col-${Date.now()}`;
    const baseUrl = Array.isArray(data.servers) && data.servers[0]?.url ? data.servers[0].url : 'https://api.example.com';

    const collection: Collection = {
      id: colId,
      name: data.info?.title || 'Imported OpenAPI Spec',
      description: data.info?.description || 'Imported from OpenAPI Spec',
      baseUrl,
      createdAt: now,
      updatedAt: now,
    };

    const endpoints: Endpoint[] = [];

    if (data.paths && typeof data.paths === 'object') {
      Object.entries(data.paths).forEach(([pathKey, pathItem]: [string, any]) => {
        const supportedMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        supportedMethods.forEach((m) => {
          const operation = pathItem[m.toLowerCase()];
          if (!operation) return;

          const queryParams: KeyValue[] = [];
          const pathParams: KeyValue[] = [];
          const headers: KeyValue[] = [];

          const allParams = [...(pathItem.parameters || []), ...(operation.parameters || [])];
          allParams.forEach((p: any, i: number) => {
            const kv: KeyValue = {
              id: `param-${Date.now()}-${i}`,
              key: p.name || '',
              value: p.example || (p.schema?.example ? String(p.schema.example) : ''),
              enabled: true,
            };
            if (p.in === 'query') queryParams.push(kv);
            if (p.in === 'path') pathParams.push(kv);
            if (p.in === 'header') headers.push(kv);
          });

          let requestBody = '';
          const bodyContent = operation.requestBody?.content?.['application/json'];
          if (bodyContent?.example) {
            requestBody = JSON.stringify(bodyContent.example, null, 2);
          } else if (bodyContent?.schema?.example) {
            requestBody = JSON.stringify(bodyContent.schema.example, null, 2);
          }

          endpoints.push({
            id: `ep-${Date.now()}-${endpoints.length}`,
            collectionId: colId,
            name: operation.summary || `${m} ${pathKey}`,
            method: m,
            path: pathKey,
            summary: operation.description || '',
            resource: operation.tags?.[0] || 'Default',
            authRequired: !!operation.security,
            queryParams,
            pathParams,
            headers,
            requestBody,
            mockScenario: 200,
            createdAt: now,
            updatedAt: now,
          });
        });
      });
    }

    return { collection, endpoints };
  }

  throw new Error('Unsupported format. Please provide a valid OpenAPI 3.x or Postman Collection v2.1 JSON file.');
}

// ═══════════════════════════════════════════════════
// DOWNLOAD HELPER
// ═══════════════════════════════════════════════════
export function downloadFile(content: string, filename: string, contentType = 'application/json') {
  const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
  saveAs(blob, filename);
}
