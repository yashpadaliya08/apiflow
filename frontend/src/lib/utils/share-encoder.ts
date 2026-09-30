import type { Endpoint } from '@/types';

/**
 * Encodes an Endpoint into a compressed URL-safe base64 string.
 */
export function encodeEndpointToUrl(endpoint: Endpoint): string {
  const payload = {
    name: endpoint.name,
    method: endpoint.method,
    path: endpoint.path,
    summary: endpoint.summary,
    headers: endpoint.headers,
    queryParams: endpoint.queryParams,
    pathParams: endpoint.pathParams,
    requestBody: endpoint.requestBody,
    mockScenario: endpoint.mockScenario,
  };

  const jsonStr = JSON.stringify(payload);
  // URL-safe base64 encoding with UTF-8 support
  const utf8Bytes = new TextEncoder().encode(jsonStr);
  let binary = '';
  utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const base64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000';
  return `${origin}/?mock=${base64}`;
}

/**
 * Decodes a URL-safe base64 string into a partial Endpoint structure.
 */
export function decodeEndpointFromUrl(encoded: string): Partial<Endpoint> | null {
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.method || !parsed.path) {
      return null;
    }

    return parsed;
  } catch (err) {
    console.warn('[ShareEncoder] Failed to decode shared mock payload:', err);
    return null;
  }
}
