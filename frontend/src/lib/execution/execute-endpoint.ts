import type { Endpoint, ExecutionMode, KeyValue } from '@/types';
import { executeLive, executeMock } from '@/lib/engines/mock-executor';
import { evaluateAllAssertions } from '@/lib/assertions/evaluator';

export async function executeEndpoint(endpoint: Endpoint, baseUrl: string, variables: KeyValue[], mode: ExecutionMode, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const response = mode === 'mock' ? await executeMock(endpoint) : await executeLive(endpoint, baseUrl, {}, variables, signal);
  signal?.throwIfAborted();
  const assertions = evaluateAllAssertions(endpoint.assertions, response);
  const passed = assertions.length ? assertions.every(a => a.passed)
    : mode === 'mock' ? response.status === endpoint.mockScenario : response.status >= 200 && response.status < 400;
  return { response, assertions, passed };
}
