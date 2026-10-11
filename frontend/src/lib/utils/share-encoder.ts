import type { Endpoint, KeyValue } from '@/types';
import { sharedEndpointSchema } from '@/lib/validation';

const sensitive = /authorization|cookie|password|passwd|secret|token|api[-_]?key|credential|signature/i;
const REDACTED = '[REDACTED]';
function redact(value: unknown, depth = 0): unknown {
  if (depth > 30) return REDACTED;
  if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, sensitive.test(k) ? REDACTED : redact(v, depth + 1)]));
  return value;
}
function redactPairs(items: KeyValue[]) {
  return items.map(item => sensitive.test(item.key) ? { ...item, value: REDACTED, enabled: false } : item);
}
function redactSchema(value: unknown, secret = false, depth = 0): unknown {
  if (depth > 30) throw new Error('Schema is too deeply nested to share.');
  if (Array.isArray(value)) return value.map(child => redactSchema(child, secret, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => {
    // Literal data and schema vocabulary have different redaction rules.
    if (['example', 'examples', 'default', 'const', 'enum'].includes(key)) {
      return secret ? [] : [[key, redact(child)]];
    }
    if (['properties', '$defs', 'definitions', 'patternProperties'].includes(key) && child && typeof child === 'object') {
      return [[key, Object.fromEntries(Object.entries(child).map(([name, schema]) => [name, redactSchema(schema, secret || sensitive.test(name), depth + 1)]))]];
    }
    return [[key, redactSchema(child, secret, depth + 1)]];
  }));
}
function redactPath(path: string): string {
  const absolute = /^https?:\/\//i.test(path);
  const url = new URL(path, 'https://share.invalid');
  url.username = ''; url.password = ''; url.hash = '';
  for (const key of [...url.searchParams.keys()]) if (sensitive.test(key)) url.searchParams.set(key, REDACTED);
  return absolute ? url.href : path.split(/[?#]/)[0] + url.search;
}
export function getSharePreview(endpoint: Endpoint) {
  let body = '';
  if (endpoint.requestBody) {
    try { body = JSON.stringify(redact(JSON.parse(endpoint.requestBody)), null, 2); }
    catch { body = ''; }
  }
  return sharedEndpointSchema.parse({
    name: endpoint.name, method: endpoint.method, path: redactPath(endpoint.path), resource: endpoint.resource,
    headers: redactPairs(endpoint.headers), queryParams: redactPairs(endpoint.queryParams), pathParams: redactPairs(endpoint.pathParams),
    requestBody: body, mockScenario: endpoint.mockScenario,
    assertions: endpoint.assertions?.filter(a => !sensitive.test(a.property || '')).map(a => {
      try { return { ...a, expectedValue: JSON.stringify(redact(JSON.parse(a.expectedValue))) }; }
      catch { return a; }
    }),
    responseSchema: redactSchema(endpoint.responseSchema), responseExample: redact(endpoint.responseExample),
    mockSeed: endpoint.mockSeed, mockLatency: endpoint.mockLatency,
  });
}
export function encodeEndpointToUrl(endpoint: Endpoint): string {
  const bytes = new TextEncoder().encode(JSON.stringify(getSharePreview(endpoint)));
  if (bytes.length > 18000) throw new Error('This mock is too large for a share link. Export the collection instead.');
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
  return `${origin}/#mock=${encoded}`;
}
export function decodeEndpointFromUrl(encoded: string): Partial<Endpoint> | null {
  try {
    if (!encoded || encoded.length > 32000) return null;
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    return sharedEndpointSchema.parse(JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)))));
  } catch { return null; }
}
