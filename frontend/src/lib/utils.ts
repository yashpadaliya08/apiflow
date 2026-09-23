import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HttpMethod } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMethodClass(method: HttpMethod): string {
  return `method-${method.toLowerCase()}`;
}

export function getMethodColor(method: HttpMethod): string {
  const colors: Record<HttpMethod, string> = {
    GET: 'var(--color-method-get)',
    POST: 'var(--color-method-post)',
    PUT: 'var(--color-method-put)',
    PATCH: 'var(--color-method-patch)',
    DELETE: 'var(--color-method-delete)',
  };
  return colors[method];
}

export function getStatusClass(status: number): string {
  if (status >= 500) return 'status-5xx';
  if (status >= 400) return 'status-4xx';
  if (status >= 300) return 'status-3xx';
  return 'status-2xx';
}

export function getStatusColor(status: number): string {
  if (status >= 500) return 'var(--color-status-5xx)';
  if (status >= 400) return 'var(--color-status-4xx)';
  if (status >= 300) return 'var(--color-status-3xx)';
  return 'var(--color-status-2xx)';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function prettifyJson(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

export const formatJson = prettifyJson;
export const getMethodBadgeClass = getMethodClass;
export const getStatusBadgeClass = getStatusClass;

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function extractPathParams(path: string): string[] {
  const matches = path.match(/:(\w+)|\{(\w+)\}/g) ?? [];
  return matches.map(m => m.replace(/[:{}]/g, ''));
}

export function buildUrlWithParams(
  baseUrl: string,
  path: string,
  pathParams: Array<{ key: string; value: string; enabled: boolean }>,
  queryParams: Array<{ key: string; value: string; enabled: boolean }>
): string {
  let resolved = path;
  pathParams.filter(p => p.enabled).forEach(p => {
    resolved = resolved.replace(`:${p.key}`, p.value).replace(`{${p.key}}`, p.value);
  });
  const query = queryParams
    .filter(p => p.enabled && p.key)
    .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
  return `${baseUrl}${resolved}${query ? '?' + query : ''}`;
}
