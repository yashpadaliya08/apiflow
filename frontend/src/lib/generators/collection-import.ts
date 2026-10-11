import type { Collection, Endpoint, HttpMethod, KeyValue, StatusCode } from '@/types';
import { collectionSchema, endpointSchema } from '@/lib/validation';

export interface ImportResult { collection: Collection; endpoints: Endpoint[]; warnings: string[] }
const methods: HttpMethod[] = ['GET','HEAD','OPTIONS','POST','PUT','PATCH','DELETE'];
const kv = (key: string, value: unknown, enabled = true): KeyValue => ({ id: crypto.randomUUID(), key, value: String(value ?? ''), enabled });

function resolveRef(value: any, document: any, seen: string[] = [], depth = 0): any {
  if (depth > 30) throw new Error('OpenAPI schema nesting exceeds the supported depth.');
  if (Array.isArray(value)) return value.map(v => resolveRef(v, document, seen, depth + 1));
  if (!value || typeof value !== 'object') return value;
  if (value.$ref) {
    const ref = String(value.$ref);
    if (!ref.startsWith('#/')) throw new Error('External OpenAPI references are not supported. Bundle the spec before importing.');
    if (seen.includes(ref)) throw new Error('Recursive OpenAPI references require a concrete example or a flattened schema.');
    let target = document;
    for (const key of ref.slice(2).split('/').map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'))) {
      if (!target || !Object.prototype.hasOwnProperty.call(target, key)) throw new Error(`Unresolved OpenAPI reference: ${ref}`);
      target = target[key];
    }
    const { $ref, ...rest } = value;
    return { ...resolveRef(target, document, [...seen, ref], depth + 1), ...resolveRef(rest, document, seen, depth + 1) };
  }
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, resolveRef(v, document, seen, depth + 1)]));
}

export function importCollection(rawJson: string): ImportResult {
  if (rawJson.length > 5 * 1024 * 1024) throw new Error('Import files must be smaller than 5 MB.');
  let data: any;
  try { data = JSON.parse(rawJson); } catch { throw new Error('Provide a valid JSON specification. YAML must be converted to JSON first.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected a JSON specification object.');
  const now = new Date().toISOString();
  const warnings: string[] = [];
  const collection: Collection = { id: crypto.randomUUID(), name:'Imported Collection', baseUrl:'', createdAt:now, updatedAt:now };
  const endpoints: Endpoint[] = [];
  function add(partial: Partial<Endpoint>) {
    if (endpoints.length >= 2000) throw new Error('Import is limited to 2000 endpoints per collection.');
    endpoints.push(endpointSchema.parse({ id:crypto.randomUUID(), collectionId:collection.id, authRequired:false, name:'Endpoint', method:'GET', path:'/', resource:'General', queryParams:[], pathParams:[], headers:[], requestBody:'', mockScenario:200, createdAt:now, updatedAt:now, ...partial }));
  }
  if (typeof data.info?.schema === 'string' && data.info.schema.includes('postman.com')) {
    collection.name = typeof data.info.name === 'string' ? data.info.name : 'Imported Postman Collection';
    collection.description = typeof data.info.description === 'string' ? data.info.description : '';
    collection.variables = (Array.isArray(data.variable) ? data.variable : []).map((v: any) => kv(String(v.key), v.value, !v.disabled));
    const base = collection.variables?.find(v => v.key === 'baseUrl' && v.enabled)?.value;
    collection.baseUrl = base || '';
    function parse(items: any[], folder = 'General', inheritedAuth: any = data.auth, depth = 0) {
      if (!Array.isArray(items) || depth > 20) throw new Error('Invalid or excessively nested Postman items.');
      for (const item of items) {
        if (item.item) { parse(item.item, item.name || folder, item.auth ?? inheritedAuth, depth + 1); continue; }
        const req = typeof item.request === 'string' ? { url:item.request, method:'GET' } : item.request;
        if (!req) continue;
        const method = String(req.method || 'GET').toUpperCase() as HttpMethod;
        if (!methods.includes(method)) { warnings.push(`Skipped unsupported method ${method}.`); continue; }
        const rawUrl = typeof req.url === 'string' ? req.url : req.url?.raw;
        if (typeof rawUrl !== 'string') throw new Error(`Missing URL for ${item.name || 'request'}.`);
        const expanded = rawUrl.replace(/\{\{([\w.-]+)\}\}/g, (match: string, key: string) => collection.variables?.find(v => v.enabled && v.key === key)?.value ?? match);
        const hasVariables = /\{\{[\w.-]+\}\}/.test(rawUrl);
        let url: URL;
        try { url = new URL(expanded, collection.baseUrl || 'https://api.example.com'); } catch {
          if (!hasVariables) throw new Error(`Invalid URL for ${item.name || 'request'}.`);
          url = new URL('https://api.example.com');
        }
        if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error('Imported URLs must use HTTP(S) without embedded credentials.');
        if (!collection.baseUrl) collection.baseUrl = url.origin;
        const baseUrl = new URL(collection.baseUrl.includes('{{') ? 'https://api.example.com' : collection.baseUrl);
        const basePath = baseUrl.pathname.replace(/\/$/, '');
        const sameBase = url.origin === baseUrl.origin && (!basePath || url.pathname === basePath || url.pathname.startsWith(basePath + '/'));
        // Keep templates intact: the selected environment, not import time,
        // determines their values. Separate raw queries to avoid double encoding.
        const path = hasVariables ? rawUrl.split(/[?#]/)[0] : sameBase ? (url.pathname.slice(basePath.length) || '/') : url.origin + url.pathname;
        const rawQuery = new URLSearchParams(rawUrl.split('#')[0].split('?').slice(1).join('?'));
        const queryParams: KeyValue[] = Array.isArray(req.url?.query) ? req.url.query.map((q: any) => kv(String(q.key), q.value, !q.disabled)) : [...rawQuery.entries()].map(([k,v]) => kv(k,v));
        const headers: KeyValue[] = (Array.isArray(req.header) ? req.header : []).map((h: any) => kv(String(h.key), h.value, !h.disabled));
        const auth = req.auth ?? inheritedAuth;
        const authValue = (name: string) => auth?.[auth.type]?.find((v: any) => v.key === name)?.value;
        if (!headers.some(h => h.key.toLowerCase() === 'authorization')) {
          if (auth?.type === 'bearer') headers.push(kv('Authorization', `Bearer ${authValue('token') || ''}`));
          else if (auth?.type === 'basic') {
            const credential = `${authValue('username') || ''}:${authValue('password') || ''}`;
            if (credential.includes('{{')) warnings.push(`Basic auth variables for ${item.name} need manual configuration.`);
            else headers.push(kv('Authorization', `Basic ${btoa(unescape(encodeURIComponent(credential)))}`));
          } else if (auth?.type === 'apikey') {
            (authValue('in') === 'query' ? queryParams : headers).push(kv(authValue('key') || 'X-API-Key', authValue('value') || ''));
          } else if (auth?.type && auth.type !== 'noauth') warnings.push(`Configure ${auth.type} authentication manually for ${item.name}.`);
        }
        if (req.body?.mode && req.body.mode !== 'raw') warnings.push(`Non-raw body for ${item.name} was not imported.`);
        if (item.event || data.event) warnings.push('Postman scripts are not executed or imported. Recreate checks as visual assertions.');
        add({ name:String(item.name || `${method} ${path}`), method, path, resource:folder, headers, queryParams,
          pathParams:(Array.isArray(req.url?.variable) ? req.url.variable : []).map((v: any) => kv(String(v.key),v.value)),
          requestBody:typeof req.body?.raw === 'string' ? req.body.raw : '', authRequired:!!auth && auth.type !== 'noauth' });
      }
    }
    parse(data.item || []);
  } else if (data.openapi || data.swagger) {
    if (!data.paths || Array.isArray(data.paths) || typeof data.paths !== 'object') throw new Error('OpenAPI paths must be an object.');
    if (data.swagger) throw new Error('Convert Swagger 2.0 to OpenAPI 3.x before importing.');
    collection.name = data.info?.title || 'Imported OpenAPI Collection';
    collection.description = data.info?.description || '';
    const server = data.servers?.[0];
    collection.baseUrl = server?.url || 'https://api.example.com';
    for (const [name, variable] of Object.entries(server?.variables || {})) collection.baseUrl = collection.baseUrl.replace(`{${name}}`, String((variable as any).default ?? ''));
    for (const [path, rawItem] of Object.entries(data.paths)) {
      const item = resolveRef(rawItem, data);
      for (const method of methods) {
        const op = item[method.toLowerCase()];
        if (!op) continue;
        const queryParams: KeyValue[] = [], pathParams: KeyValue[] = [], headers: KeyValue[] = [];
        const parameters = new Map<string, any>();
        for (const p of [...(item.parameters || []), ...(op.parameters || [])]) parameters.set(`${p.in}:${p.name}`, p);
        for (const p of parameters.values()) {
          const target = p.in === 'query' ? queryParams : p.in === 'path' ? pathParams : p.in === 'header' ? headers : null;
          if (target) target.push(kv(p.name, p.example ?? p.schema?.example ?? p.schema?.default ?? ''));
        }
        const body = op.requestBody?.content?.['application/json'];
        const responseCode = Object.keys(op.responses || {}).find(code => ['200','201'].includes(code)) || '200';
        const response = op.responses?.[responseCode]?.content?.['application/json'];
        const namedExample = Object.values(response?.examples || {})[0] as { value?: unknown } | undefined;
        const example = response && Object.prototype.hasOwnProperty.call(response, 'example') ? response.example : namedExample?.value;
        if (op.security?.length || data.security?.length) warnings.push('OpenAPI security requirements were detected. Configure credentials before sending live requests.');
        if (op.servers || item.servers) warnings.push('Operation-level server overrides require manual configuration.');
        add({ name:op.summary || `${method} ${path}`, summary:op.description || '', method, path, resource:op.tags?.[0] || 'General',
          queryParams,pathParams,headers, requestBody:body?.example !== undefined ? JSON.stringify(body.example,null,2) : body?.schema?.example !== undefined ? JSON.stringify(body.schema.example,null,2) : '',
          authRequired:!!(op.security ?? data.security)?.length, mockScenario:Number(responseCode) as StatusCode,
          responseSchema:response?.schema, responseExample:example });
      }
    }
  } else throw new Error('Unsupported format. Import OpenAPI 3.x or Postman Collection v2.1 JSON.');
  if (!endpoints.length) throw new Error('No supported endpoints were found in this specification.');
  collection.baseUrl ||= 'https://api.example.com';
  return { collection:collectionSchema.parse(collection), endpoints, warnings:[...new Set(warnings)] };
}
