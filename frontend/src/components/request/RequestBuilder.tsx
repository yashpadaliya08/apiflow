import React, { useEffect } from 'react';
import {
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  Globe,
  Sliders,
} from 'lucide-react';
import { useCollectionStore } from '@/store/collection-store';
import { useExecutionStore } from '@/store/execution-store';
import { useUIStore } from '@/store/ui-store';
import { executeMock, executeLive } from '@/lib/engines/mock-executor';
import { interpolateVariables } from '@/lib/engines/synthetic-engine';
import { trackEvent } from '@/lib/analytics';
import { ParamTable } from '@/components/request/ParamTable';
import { BodyEditor } from '@/components/request/BodyEditor';
import { MethodBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { HttpMethod, StatusCode } from '@/types';

export const RequestBuilder: React.FC = () => {
  const {
    activeEndpoint,
    activeCollection,
    updateActiveEndpointDraft,
    saveActiveEndpointDraft,
    environments,
    activeEnvironmentId,
    addHistoryEntry,
  } = useCollectionStore();

  const { response, isExecuting, setResponse, setError, setIsExecuting } = useExecutionStore();
  const { executionMode, requestTab, setRequestTab } = useUIStore();

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to execute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeEndpoint, executionMode, activeEnv]);

  if (!activeEndpoint) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0C0E12] text-white/40">
        <div className="w-12 h-12 rounded-xl bg-[#141720] border border-[#2A2F45] flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-white/80">No Endpoint Selected</h3>
        <p className="text-xs text-white/40 max-w-sm mt-1">
          Select an existing endpoint from the sidebar or click '+' to create a new one.
        </p>
      </div>
    );
  }

  // Calculate resolved URL with environment variables
  const rawBase = activeCollection?.baseUrl || 'https://api.enterprise.dev';
  const resolvedBase = activeEnv ? interpolateVariables(rawBase, activeEnv.variables) : rawBase;
  const resolvedPath = activeEnv ? interpolateVariables(activeEndpoint.path, activeEnv.variables) : activeEndpoint.path;
  const fullPreviewUrl = `${resolvedBase}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;

  const handleExecute = async () => {
    if (!activeEndpoint || isExecuting) return;
    setIsExecuting(true);
    setError(null);

    try {
      if (executionMode === 'mock') {
        const res = await executeMock(activeEndpoint);
        setResponse(res);

        trackEvent('request_simulated', {
          mode: 'mock',
          status: res.status,
          latency: res.latency,
          method: activeEndpoint.method,
          path: activeEndpoint.path,
        });

        // Record history
        await addHistoryEntry({
          endpointId: activeEndpoint.id,
          endpointName: activeEndpoint.name,
          method: activeEndpoint.method,
          path: activeEndpoint.path,
          status: res.status,
          latency: res.latency,
          timestamp: new Date().toISOString(),
          response: res,
          requestBody: activeEndpoint.requestBody,
          queryParams: activeEndpoint.queryParams,
          headers: activeEndpoint.headers,
        });
      } else {
        // Live Proxy mode
        const headerMap: Record<string, string> = {};
        activeEndpoint.headers
          .filter((h) => h.enabled && h.key)
          .forEach((h) => {
            headerMap[h.key] = activeEnv ? interpolateVariables(h.value, activeEnv.variables) : h.value;
          });

        const res = await executeLive(
          activeEndpoint,
          resolvedBase,
          headerMap
        );
        setResponse(res);

        trackEvent('request_simulated', {
          mode: 'live',
          status: res.status,
          latency: res.latency,
          method: activeEndpoint.method,
          path: activeEndpoint.path,
        });

        await addHistoryEntry({
          endpointId: activeEndpoint.id,
          endpointName: activeEndpoint.name,
          method: activeEndpoint.method,
          path: activeEndpoint.path,
          status: res.status,
          latency: res.latency,
          timestamp: new Date().toISOString(),
          response: res,
          requestBody: activeEndpoint.requestBody,
          queryParams: activeEndpoint.queryParams,
          headers: activeEndpoint.headers,
        });
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  const scenarios: { code: StatusCode; label: string }[] = [
    { code: 200, label: '200 OK' },
    { code: 201, label: '201 Created' },
    { code: 400, label: '400 Bad Request' },
    { code: 401, label: '401 Unauthorized' },
    { code: 403, label: '403 Forbidden' },
    { code: 404, label: '404 Not Found' },
    { code: 500, label: '500 Server Error' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141720] border-r border-[#2A2F45] overflow-hidden">
      {/* Top Header: Endpoint Name & Resource */}
      <div className="p-3 border-b border-[#2A2F45] bg-[#141720] flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={activeEndpoint.name}
            onChange={(e) => updateActiveEndpointDraft({ name: e.target.value })}
            onBlur={saveActiveEndpointDraft}
            placeholder="Endpoint Name..."
            className="w-full bg-transparent text-sm font-semibold text-white/95 focus:outline-none focus:bg-[#1C2030] px-1.5 py-0.5 rounded transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Resource / Tag input */}
          <input
            type="text"
            value={activeEndpoint.resource || ''}
            onChange={(e) => updateActiveEndpointDraft({ resource: e.target.value })}
            onBlur={saveActiveEndpointDraft}
            placeholder="Resource Tag (e.g. Users)"
            className="w-36 bg-[#0C0E12] border border-[#2A2F45] px-2 py-1 text-xs text-white/70 rounded focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Main Request Control Bar: Method + Path + Scenario + Send Button */}
      <div className="p-3 border-b border-[#2A2F45] bg-[#0C0E12]/60 space-y-2">
        <div className="flex items-center gap-2">
          {/* Method selector */}
          <select
            value={activeEndpoint.method}
            onChange={(e) => {
              updateActiveEndpointDraft({ method: e.target.value as HttpMethod });
              saveActiveEndpointDraft();
            }}
            className="h-9 px-2.5 bg-[#1C2030] border border-[#2A2F45] text-white font-mono font-bold text-xs rounded-md focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* URL Path input */}
          <div className="flex-1 relative flex items-center">
            <span className="absolute left-2.5 text-xs font-mono text-white/30 select-none pointer-events-none truncate max-w-[140px]">
              {resolvedBase}
            </span>
            <input
              type="text"
              value={activeEndpoint.path}
              onChange={(e) => updateActiveEndpointDraft({ path: e.target.value })}
              onBlur={saveActiveEndpointDraft}
              placeholder="/api/v1/resource"
              style={{ paddingLeft: `${Math.min(resolvedBase.length * 7.5 + 16, 180)}px` }}
              className="w-full h-9 pr-3 bg-[#1C2030] border border-[#2A2F45] rounded-md font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Mock Scenario Dropdown (if in Mock mode) */}
          {executionMode === 'mock' && (
            <select
              value={activeEndpoint.mockScenario || 200}
              onChange={(e) => {
                const sc = Number(e.target.value) as StatusCode;
                updateActiveEndpointDraft({ mockScenario: sc });
                saveActiveEndpointDraft();
              }}
              className="h-9 px-2.5 bg-[#1C2030] border border-[#2A2F45] text-xs font-mono text-white/90 rounded-md focus:outline-none focus:border-indigo-500 cursor-pointer"
              title="Select simulated HTTP status response scenario"
            >
              {scenarios.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </select>
          )}

          {/* Send Button */}
          <Button
            variant={executionMode === 'mock' ? 'accent' : 'primary'}
            size="md"
            isLoading={isExecuting}
            onClick={handleExecute}
            leftIcon={executionMode === 'mock' ? <Sparkles className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            title="Execute request (Ctrl+Enter)"
          >
            {executionMode === 'mock' ? 'Simulate' : 'Send'}
          </Button>
        </div>

        {/* Resolved URL preview */}
        <div className="flex items-center justify-between text-[11px] text-white/40 px-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-white/50">Target:</span>
            <span className="font-mono text-indigo-400/90 truncate">{fullPreviewUrl}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 text-[10px]">
            <kbd className="px-1.5 py-0.5 bg-[#1C2030] border border-[#2A2F45] rounded font-mono text-white/60">
              Ctrl + ↵
            </kbd>
          </div>
        </div>
      </div>

      {/* Request Tabs Header */}
      <div className="flex items-center border-b border-[#2A2F45] bg-[#141720] px-3 gap-1">
        <button
          onClick={() => setRequestTab('params')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            requestTab === 'params'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <span>Query Params</span>
          {activeEndpoint.queryParams.filter((q) => q.enabled && q.key).length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full font-mono">
              {activeEndpoint.queryParams.filter((q) => q.enabled && q.key).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setRequestTab('path')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            requestTab === 'path'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <span>Path Params</span>
          {activeEndpoint.pathParams.filter((p) => p.enabled && p.key).length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full font-mono">
              {activeEndpoint.pathParams.filter((p) => p.enabled && p.key).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setRequestTab('headers')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            requestTab === 'headers'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <span>Headers</span>
          {activeEndpoint.headers.filter((h) => h.enabled && h.key).length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full font-mono">
              {activeEndpoint.headers.filter((h) => h.enabled && h.key).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setRequestTab('body')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            requestTab === 'body'
              ? 'border-indigo-500 text-white font-semibold'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <span>Body</span>
          {activeEndpoint.requestBody.trim() && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0C0E12]">
        {requestTab === 'params' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Query parameters appended to the URL as key-value pairs.</span>
            </div>
            <ParamTable
              items={activeEndpoint.queryParams}
              onChange={(items) => {
                updateActiveEndpointDraft({ queryParams: items });
                saveActiveEndpointDraft();
              }}
              keyPlaceholder="Param name (e.g. limit)"
              valuePlaceholder="Value (e.g. 20)"
            />
          </div>
        )}

        {requestTab === 'path' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>Path parameters substituted for :paramName or {'{paramName}'}.</span>
            </div>
            <ParamTable
              items={activeEndpoint.pathParams}
              onChange={(items) => {
                updateActiveEndpointDraft({ pathParams: items });
                saveActiveEndpointDraft();
              }}
              keyPlaceholder="Param name (e.g. id)"
              valuePlaceholder="Value (e.g. 101)"
            />
          </div>
        )}

        {requestTab === 'headers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>HTTP headers sent with the request.</span>
            </div>
            <ParamTable
              items={activeEndpoint.headers}
              onChange={(items) => {
                updateActiveEndpointDraft({ headers: items });
                saveActiveEndpointDraft();
              }}
              keyPlaceholder="Header name (e.g. Authorization)"
              valuePlaceholder="Header value"
            />
          </div>
        )}

        {requestTab === 'body' && (
          <BodyEditor
            body={activeEndpoint.requestBody}
            onChange={(body) => {
              updateActiveEndpointDraft({ requestBody: body });
              saveActiveEndpointDraft();
            }}
            method={activeEndpoint.method}
            endpointPath={activeEndpoint.path}
          />
        )}
      </div>
    </div>
  );
};
