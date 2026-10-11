import type { Endpoint, KeyValue } from '@/types';
import { interpolateVariables } from '@/lib/utils/interpolation';

export function prepareRequest(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []) {
  const resolve = (value: string) => {
    const resolved = interpolateVariables(value, variables);
    const missing = resolved.match(/\{\{[\w.-]+\}\}/g);
    if (missing) throw new Error(`Unresolved variables: ${[...new Set(missing)].join(', ')}`);
    return resolved;
  };
  const prepared: Endpoint = {
    ...endpoint,
    path: resolve(endpoint.path),
    headers: endpoint.headers.map(h => ({ ...h, value: h.enabled ? resolve(h.value) : h.value })),
    queryParams: endpoint.queryParams.map(q => ({ ...q, value: q.enabled ? resolve(q.value) : q.value })),
    pathParams: endpoint.pathParams.map(p => ({ ...p, value: p.enabled ? resolve(p.value) : p.value })),
    requestBody: resolve(endpoint.requestBody),
  };
  let path = prepared.path;
  for (const param of prepared.pathParams.filter(p => p.enabled && p.key)) {
    const key = param.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    path = path.replace(new RegExp(`:${key}(?=/|$|[?#])|\\{${key}\\}`, 'g'), () => encodeURIComponent(param.value));
  }
  if (/(?:^|\/):[\w]+|\{[\w]+\}/.test(path)) throw new Error('Fill all path parameters before sending this request.');
  const absolute = /^https?:\/\//i.test(path);
  const url = new URL(absolute ? path : `${resolve(baseUrl).replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP(S) URL without embedded credentials.');
  for (const q of prepared.queryParams.filter(q => q.enabled && q.key)) url.searchParams.append(q.key, q.value);
  const headers = Object.fromEntries(prepared.headers.filter(h => h.enabled && h.key).map(h => [h.key, h.value]));
  const hasBody = !['GET', 'HEAD'].includes(prepared.method) && !!prepared.requestBody;
  if (hasBody && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
  return { endpoint: prepared, url: url.href, method: prepared.method, headers, body: hasBody ? prepared.requestBody : undefined };
}

export async function sendProxyRequest(request: { url: string; method: string; headers: Record<string, string>; body?: string }, signal?: AbortSignal) {
  const response = await fetch('/api/proxy', {
    method: 'POST',
    credentials: 'omit',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `Proxy returned HTTP ${response.status}`);
  if (!result || typeof result.status !== 'number' || typeof result.body !== 'string' || !result.headers) throw new Error('Unexpected proxy response. Reload the app and check the backend version.');
  return result as { status: number; statusText: string; headers: Record<string, string>; body: string; size: number; latency: number; url: string };
}
