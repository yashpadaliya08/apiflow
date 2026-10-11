import type { KeyValue } from '@/types';

/**
 * Interpolates environment variable templates `{{variable_name}}` into a target string.
 * Lightweight zero-dependency utility to prevent bundling Faker into the critical request pipeline.
 */
export function interpolateVariables(
  str: string,
  variables: KeyValue[]
): string {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/\{\{([\w.-]+)\}\}/g, (match, key) => {
    const found = variables.find(v => v.key === key && v.enabled);
    return found ? found.value : match;
  });
}
