import { faker } from '@faker-js/faker';
import type { Endpoint, MockResponse, StatusCode } from '@/types';
import {
  generateListResponse,
  generateDetailResponse,
  generateAuthResponse,
  generateCreateResponse,
  generateSyntheticBody,
} from './synthetic-engine';

// ═══════════════════════════════════════════════════
// Realistic latency jitter: 12–45ms
// ═══════════════════════════════════════════════════
const randomLatency = () => Math.floor(Math.random() * 33) + 12;

// ═══════════════════════════════════════════════════
// Standard mock headers
// ═══════════════════════════════════════════════════
const mockHeaders = (): Record<string, string> => ({
  'content-type': 'application/json; charset=utf-8',
  'x-request-id': faker.string.uuid(),
  'x-ratelimit-limit': '1000',
  'x-ratelimit-remaining': String(faker.number.int({ min: 800, max: 999 })),
  'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
  'cache-control': 'no-store',
  'server': 'APIFlow-Mock/1.0',
});

// ═══════════════════════════════════════════════════
// Response body builders by status code
// ═══════════════════════════════════════════════════
function buildResponseBody(endpoint: Endpoint, status: StatusCode): unknown {
  const path = endpoint.path.toLowerCase();
  const method = endpoint.method;

  switch (status) {
    case 200: {
      if (path.includes('/auth/login') || path.includes('/auth/signin')) return generateAuthResponse(endpoint);
      const pathParamId = endpoint.pathParams.find(p => p.enabled && (p.key === 'id' || p.key.endsWith('Id')))?.value;
      if (method === 'GET' && (path.includes(':id') || path.includes('{id}') || pathParamId)) {
        return generateDetailResponse(pathParamId);
      }
      if (method === 'GET') return generateListResponse(endpoint.resource);
      if (method === 'PUT' || method === 'PATCH') return generateDetailResponse(pathParamId);
      if (method === 'DELETE') return { success: true, deleted: true, id: pathParamId || faker.string.alphanumeric(8) };
      return generateDetailResponse(pathParamId);
    }
    case 201: {
      const created = generateCreateResponse(endpoint);
      return { ...created as object, message: 'Resource created successfully' };
    }
    case 400:
      return {
        error: 'Validation Error',
        code: 'VALIDATION_FAILED',
        message: 'The request body contains invalid fields.',
        details: [
          { field: 'email', message: 'Must be a valid email address' },
          { field: 'amount', message: 'Must be a positive number' },
        ],
        timestamp: new Date().toISOString(),
        requestId: faker.string.uuid(),
      };
    case 401:
      return {
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
        message: 'Authentication token is missing or expired.',
        hint: 'Include a valid Bearer token in the Authorization header.',
        timestamp: new Date().toISOString(),
      };
    case 403:
      return {
        error: 'Forbidden',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action.',
        requiredRole: 'admin',
        yourRole: 'user',
        timestamp: new Date().toISOString(),
      };
    case 404:
      return {
        error: 'Not Found',
        code: 'RESOURCE_NOT_FOUND',
        message: `The requested ${endpoint.resource.toLowerCase()} resource could not be found.`,
        resource: endpoint.resource,
        timestamp: new Date().toISOString(),
      };
    case 500:
      return {
        error: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        supportId: faker.string.alphanumeric(16).toUpperCase(),
        timestamp: new Date().toISOString(),
      };
    default:
      return { message: 'Unknown response' };
  }
}

// ═══════════════════════════════════════════════════
// Status text map
// ═══════════════════════════════════════════════════
const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  500: 'Internal Server Error',
};

// ═══════════════════════════════════════════════════
// Location header for 201 responses
// ═══════════════════════════════════════════════════
function locationHeader(endpoint: Endpoint, status: StatusCode): Record<string, string> {
  if (status === 201) {
    const id = `id_${faker.string.alphanumeric(8)}`;
    return { location: `${endpoint.path.replace(/:\w+/g, id)}/${id}` };
  }
  if (status === 401) {
    return { 'www-authenticate': 'Bearer realm="APIFlow Studio", charset="UTF-8"' };
  }
  return {};
}

// ═══════════════════════════════════════════════════
// Main mock executor
// ═══════════════════════════════════════════════════
export async function executeMock(endpoint: Endpoint): Promise<MockResponse> {
  const status = endpoint.mockScenario;
  const latency = randomLatency();

  // Simulate realistic network latency
  await new Promise(resolve => setTimeout(resolve, latency));

  const body = buildResponseBody(endpoint, status);
  const bodyStr = JSON.stringify(body);
  const size = new Blob([bodyStr]).size;

  return {
    mode: 'mock',
    status,
    statusText: STATUS_TEXT[status] ?? 'Unknown',
    headers: {
      ...mockHeaders(),
      ...locationHeader(endpoint, status),
    },
    body,
    latency,
    size,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════
// Live API executor
// ═══════════════════════════════════════════════════
export async function executeLive(
  endpoint: Endpoint,
  baseUrl: string,
  headers: Record<string, string>
): Promise<MockResponse> {
  const start = performance.now();

  const url = `${baseUrl}${endpoint.path}`;
  const options: RequestInit = {
    method: endpoint.method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };

  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
    options.body = endpoint.requestBody;
  }

  const res = await fetch(url, options);
  const latency = Math.round(performance.now() - start);

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }

  const bodyStr = JSON.stringify(body);
  const size = new Blob([bodyStr]).size;

  const resHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => { resHeaders[k] = v; });

  return {
    mode: 'mock', // reuse same shape
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
    body,
    latency,
    size,
    timestamp: new Date().toISOString(),
  };
}
