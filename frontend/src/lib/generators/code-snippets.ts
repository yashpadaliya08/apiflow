import type { Endpoint, KeyValue } from '@/types';

// ═══════════════════════════════════════════════════
// Build full URL with path params substituted
// ═══════════════════════════════════════════════════
function buildUrl(baseUrl: string, path: string, pathParams: KeyValue[]): string {
  let resolved = path;
  pathParams.filter(p => p.enabled).forEach(p => {
    resolved = resolved.replace(`:${p.key}`, p.value).replace(`{${p.key}}`, p.value);
  });
  return `${baseUrl}${resolved}`;
}

// ═══════════════════════════════════════════════════
// Build query string
// ═══════════════════════════════════════════════════
function buildQuery(params: KeyValue[]): string {
  const enabled = params.filter(p => p.enabled && p.key);
  if (!enabled.length) return '';
  return '?' + enabled.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
}

// ═══════════════════════════════════════════════════
// cURL snippet
// ═══════════════════════════════════════════════════
export function buildCurl(endpoint: Endpoint, baseUrl: string): string {
  const url = buildUrl(baseUrl, endpoint.path, endpoint.pathParams) + buildQuery(endpoint.queryParams);
  const headers = endpoint.headers
    .filter(h => h.enabled && h.key)
    .map(h => `  -H '${h.key}: ${h.value}'`)
    .join(' \\\n');

  const body = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody
    ? `  -d '${endpoint.requestBody.replace(/'/g, "'\\''")}' \\\n`
    : '';

  return `curl -X ${endpoint.method} '${url}' \\
${headers ? headers + ' \\\n' : ''}${body}  --compressed`;
}

// ═══════════════════════════════════════════════════
// TypeScript fetch snippet
// ═══════════════════════════════════════════════════
export function buildTypeScript(endpoint: Endpoint, baseUrl: string): string {
  const url = buildUrl(baseUrl, endpoint.path, endpoint.pathParams) + buildQuery(endpoint.queryParams);
  const headersObj = Object.fromEntries(
    endpoint.headers.filter(h => h.enabled && h.key).map(h => [h.key, h.value])
  );
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody;

  return `const response = await fetch('${url}', {
  method: '${endpoint.method}',
  headers: ${JSON.stringify({ 'Content-Type': 'application/json', ...headersObj }, null, 4)},${hasBody ? `
  body: JSON.stringify(${endpoint.requestBody}),` : ''}
});

const data = await response.json();
console.log(data);`;
}

// ═══════════════════════════════════════════════════
// Axios snippet
// ═══════════════════════════════════════════════════
export function buildAxios(endpoint: Endpoint, baseUrl: string): string {
  const url = buildUrl(baseUrl, endpoint.path, endpoint.pathParams);
  const params = endpoint.queryParams.filter(p => p.enabled && p.key);
  const headersObj = Object.fromEntries(
    endpoint.headers.filter(h => h.enabled && h.key).map(h => [h.key, h.value])
  );
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody;

  return `import axios from 'axios';

const { data } = await axios.${endpoint.method.toLowerCase()}('${url}', ${hasBody ? `${endpoint.requestBody},\n` : ''}{
  headers: ${JSON.stringify(headersObj, null, 4)},${params.length ? `
  params: ${JSON.stringify(Object.fromEntries(params.map(p => [p.key, p.value])), null, 4)},` : ''}
});

console.log(data);`;
}

// ═══════════════════════════════════════════════════
// Python requests snippet
// ═══════════════════════════════════════════════════
export function buildPython(endpoint: Endpoint, baseUrl: string): string {
  const url = buildUrl(baseUrl, endpoint.path, endpoint.pathParams);
  const params = endpoint.queryParams.filter(p => p.enabled && p.key);
  const headersObj = Object.fromEntries(
    endpoint.headers.filter(h => h.enabled && h.key).map(h => [h.key, h.value])
  );
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody;

  return `import requests

url = "${url}"
headers = ${JSON.stringify(headersObj, null, 4).replace(/"/g, '"')}
${params.length ? `params = ${JSON.stringify(Object.fromEntries(params.map(p => [p.key, p.value])), null, 4)}\n` : ''}${hasBody ? `payload = ${endpoint.requestBody}\n` : ''}
response = requests.${endpoint.method.toLowerCase()}(
    url,
    headers=headers,${params.length ? '\n    params=params,' : ''}${hasBody ? '\n    json=payload,' : ''}
)

print(response.status_code)
print(response.json())`;
}

// ═══════════════════════════════════════════════════
// All snippets
// ═══════════════════════════════════════════════════
export function buildAllSnippets(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []) {
  // If variables provided, resolve baseUrl
  let resolvedBase = baseUrl;
  variables.filter(v => v.enabled).forEach(v => {
    resolvedBase = resolvedBase.replace(`{{${v.key}}}`, v.value);
  });

  return {
    curl: buildCurl(endpoint, resolvedBase),
    typescript: buildTypeScript(endpoint, resolvedBase),
    axios: buildAxios(endpoint, resolvedBase),
    python: buildPython(endpoint, resolvedBase),
  };
}

export const generateAllSnippets = buildAllSnippets;
