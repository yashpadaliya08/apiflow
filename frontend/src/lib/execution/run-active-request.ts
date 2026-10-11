import { useCollectionStore } from '@/store/collection-store';
import { useExecutionStore } from '@/store/execution-store';
import { useUIStore } from '@/store/ui-store';
import { executeEndpoint } from './execute-endpoint';
import { trackEvent } from '@/lib/analytics';

let controller: AbortController | null = null;
export function cancelActiveRequest() { controller?.abort(); }

export async function runActiveRequest() {
  if (controller) return;
  const { activeEndpoint: endpoint, activeCollection, environments, activeEnvironmentId, addHistoryEntry } = useCollectionStore.getState();
  if (!endpoint) return;
  const execution = useExecutionStore.getState();
  const mode = useUIStore.getState().executionMode;
  const variables = [...(environments.find(e => e.id === activeEnvironmentId)?.variables || []), ...(activeCollection?.variables || [])];
  controller = new AbortController();
  execution.setError(null);
  execution.setWarning(null);
  execution.setIsExecuting(true);
  try {
    const { response } = await executeEndpoint(endpoint, activeCollection?.baseUrl || '', variables, mode, controller.signal);
    execution.setResponse(response, endpoint.id);
    try {
      trackEvent('request_simulated', { mode, status: response.status, latency: response.latency, method: endpoint.method });
    } catch { /* Optional metrics must never invalidate a completed request. */ }
    try {
      await addHistoryEntry({ endpointId: endpoint.id, endpointName: endpoint.name, method: endpoint.method, path: endpoint.path,
      status: response.status, latency: response.latency, timestamp: response.timestamp, response,
      requestBody: endpoint.requestBody, queryParams: endpoint.queryParams, headers: endpoint.headers });
    } catch {
      execution.setWarning('Response received, but local history could not be saved. Do not resend solely to save history.');
    }
  } catch (error) {
    execution.setError(error instanceof Error ? error.message : 'Request failed');
  } finally {
    controller = null;
    execution.setIsExecuting(false);
  }
}
