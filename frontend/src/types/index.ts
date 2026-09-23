// ═══════════════════════════════════════════════════
// APIFlow Studio — Core Type Definitions
// ═══════════════════════════════════════════════════

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Endpoint {
  id: string;
  collectionId: string;
  name: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  resource: string;
  authRequired: boolean;
  queryParams: KeyValue[];
  pathParams: KeyValue[];
  headers: KeyValue[];
  requestBody: string; // JSON string
  mockScenario: StatusCode;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockResponse {
  mode: 'mock';
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  latency: number;
  size: number;
  timestamp: string;
}

export interface LiveResponse {
  mode: 'live';
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  latency: number;
  size: number;
  timestamp: string;
  url: string;
}

export type ApiResponse = MockResponse | LiveResponse;

export interface HistoryEntry {
  id?: number;
  endpointId: string;
  endpointName: string;
  method: HttpMethod;
  path: string;
  status: number;
  latency: number;
  timestamp: string;
  response: ApiResponse;
  requestBody?: string;
  queryParams?: KeyValue[];
  headers?: KeyValue[];
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValue[];
  isActive: boolean;
}

export type ExecutionMode = 'mock' | 'live';

export interface CodeSnippet {
  curl: string;
  typescript: string;
  axios: string;
  python: string;
}
