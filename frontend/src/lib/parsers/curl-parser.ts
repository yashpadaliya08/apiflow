import type { KeyValue, HttpMethod } from '@/types';

export interface ParsedCurl {
  method: HttpMethod;
  url: string;
  baseUrl: string;
  path: string;
  queryParams: KeyValue[];
  headers: KeyValue[];
  requestBody: string;
  name: string;
}

/**
 * Tokenize a cURL command line into individual arguments, respecting quotes and escapes.
 */
function tokenizeArgs(cmd: string): string[] {
  // Normalize multi-line backslash continuations
  const normalized = cmd.replace(/\\\r?\n/g, ' ').trim();
  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse any valid cURL string into an APIFlow endpoint structure.
 */
export function parseCurl(curlString: string): ParsedCurl {
  const trimmed = curlString.trim();
  if (!trimmed) {
    throw new Error('Please enter a valid cURL command.');
  }

  if (!trimmed.toLowerCase().startsWith('curl')) {
    throw new Error("Command must start with 'curl'.");
  }

  const tokens = tokenizeArgs(trimmed);
  let method: HttpMethod | null = null;
  let rawUrl = '';
  const headers: KeyValue[] = [];
  const bodyParts: string[] = [];
  let basicAuth = '';

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    // Method: -X, --request
    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase() as HttpMethod;
      }
      continue;
    }

    // Headers: -H, --header
    if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[++i];
        const separatorIdx = headerStr.indexOf(':');
        if (separatorIdx > 0) {
          const key = headerStr.slice(0, separatorIdx).trim();
          const value = headerStr.slice(separatorIdx + 1).trim();
          headers.push({
            id: `kv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            key,
            value,
            enabled: true,
          });
        }
      }
      continue;
    }

    // Body: -d, --data, --data-raw, --data-binary, --data-urlencode
    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-urlencode'
    ) {
      if (i + 1 < tokens.length) {
        bodyParts.push(tokens[++i]);
      }
      continue;
    }

    // Basic Auth: -u, --user
    if (token === '-u' || token === '--user') {
      if (i + 1 < tokens.length) {
        basicAuth = tokens[++i];
      }
      continue;
    }

    // Positional URL or flags
    if (!token.startsWith('-') && !rawUrl) {
      rawUrl = token;
    }
  }

  if (!rawUrl) {
    throw new Error('No target URL found in cURL command.');
  }

  // Handle basic auth if present
  if (basicAuth) {
    try {
      const encoded = btoa(basicAuth);
      headers.unshift({
        id: `kv-auth-${Date.now()}`,
        key: 'Authorization',
        value: `Basic ${encoded}`,
        enabled: true,
      });
    } catch {
      // ignore base64 errors
    }
  }

  // Infer default method
  if (!method) {
    method = bodyParts.length > 0 ? 'POST' : 'GET';
  }

  // Process body
  let requestBody = bodyParts.join('&');
  try {
    const parsedJson = JSON.parse(requestBody);
    requestBody = JSON.stringify(parsedJson, null, 2);
  } catch {
    // Keep as raw text/form
  }

  // Parse URL components
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new Error(`Invalid URL format in cURL: ${rawUrl}`);
  }

  const queryParams: KeyValue[] = [];
  parsedUrl.searchParams.forEach((value, key) => {
    queryParams.push({
      id: `kv-q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      key,
      value,
      enabled: true,
    });
  });

  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const path = parsedUrl.pathname || '/';

  // Generate clean name
  const segments = path.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'resource';
  const name = `${method} ${lastSegment.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return {
    method,
    url: rawUrl,
    baseUrl,
    path,
    queryParams,
    headers,
    requestBody,
    name,
  };
}
