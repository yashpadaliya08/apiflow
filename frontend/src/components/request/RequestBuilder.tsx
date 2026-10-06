import React, { useEffect } from 'react';
import {
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  Globe,
  Sliders,
  Plus,
  Share2,
} from 'lucide-react';
import { useCollectionStore } from '@/store/collection-store';
import { useExecutionStore } from '@/store/execution-store';
import { useUIStore } from '@/store/ui-store';
import { executeMock, executeLive } from '@/lib/engines/mock-executor';
import { interpolateVariables } from '@/lib/engines/synthetic-engine';
import { ParamTable } from '@/components/request/ParamTable';
import { BodyEditor } from '@/components/request/BodyEditor';
import { AssertionBuilder } from '@/components/request/AssertionBuilder';
import { MethodBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import type { HttpMethod, StatusCode } from '@/types';

export const RequestBuilder: React.FC = () => {
  const {
    activeEndpoint,
    activeCollection,
    createEndpoint,
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
        <div className="w-14 h-14 rounded-2xl bg-[#141720] border border-[#2A2F45] flex items-center justify-center mb-3 shadow-lg">
          <Layers className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="text-base font-semibold text-white/90">No Endpoint Selected</h3>
        <p className="text-xs text-white/40 max-w-sm mt-1.5 mb-4">
          Select an existing endpoint from the sidebar or click below to build your first API request.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={async () => {
            let colId = activeCollection?.id;
            if (!colId) {
              const created = await useCollectionStore.getState().createCollection('My API Collection');
              colId = created.id;
            }
            await createEndpoint(colId, {
              name: 'New Endpoint',
              method: 'GET',
              path: '/api/v1/resource',
              resource: 'General',
            });
          }}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Create New Endpoint
        </Button>
      </div>
    );
  }

  // Calculate resolved URL with environment variables and path parameter substitution
  const rawBase = activeCollection?.baseUrl || 'https://api.enterprise.dev';
  const resolvedBase = activeEnv ? interpolateVariables(rawBase, activeEnv.variables) : rawBase;
  let resolvedPath = activeEnv ? interpolateVariables(activeEndpoint.path, activeEnv.variables) : activeEndpoint.path;
  (activeEndpoint.pathParams || []).filter((p) => p.enabled && p.key).forEach((p) => {
    resolvedPath = resolvedPath.replace(`:${p.key}`, p.value).replace(`{${p.key}}`, p.value);
  });
  const isAbsolute = resolvedPath.startsWith('http://') || resolvedPath.startsWith('https://');
  const fullPreviewUrl = isAbsolute
    ? `${resolvedPath}`
    : `${resolvedBase}${resolvedPath.startsWith('/') ? '' : '/'}${resolvedPath}`;

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
      <div className="p-3 border-b border-[#2A2F45] bg-[#141720]/80 flex items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={activeEndpoint.name}
            onChange={(e) => updateActiveEndpointDraft({ name: e.target.value })}
            onBlur={saveActiveEndpointDraft}
            placeholder="Endpoint Name..."
            className="w-full bg-transparent text-sm font-semibold text-white/95 focus:outline-none focus:bg-[#1C2030] px-2 py-1 rounded-lg transition-colors border border-transparent focus:border-[#2A2F45]"
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
            className="w-36 bg-[#0C0E12] border border-[#2A2F45] px-2.5 py-1 text-xs text-white/70 rounded-lg focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />
        </div>
      </div>

      {/* Main Request Command Bar: Floating Elevated Container */}
      <div className="p-3 border-b border-[#2A2F45] bg-[#0C0E12]/80 space-y-2">
        <div className="p-1.5 rounded-xl bg-[#141720] border border-[#2A2F45] shadow-lg shadow-black/20 flex items-center gap-2">
          {/* Method selector with glowing method pill styling */}
          <select
            value={activeEndpoint.method}
            onChange={(e) => {
              updateActiveEndpointDraft({ method: e.target.value as HttpMethod });
              saveActiveEndpointDraft();
            }}
            className={`flex-shrink-0 h-9 px-2.5 font-mono font-bold text-xs rounded-lg border focus:outline-none cursor-pointer transition-all ${
              activeEndpoint.method === 'GET'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : activeEndpoint.method === 'POST'
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : activeEndpoint.method === 'PUT'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : activeEndpoint.method === 'PATCH'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}
          >
            {methods.map((m) => (
              <option key={m} value={m} className="bg-[#0C0E12] text-white">
                {m}
              </option>
            ))}
          </select>

          {/* URL Path input */}
          <div className="flex-1 min-w-[80px] relative flex items-center">
            <input
              type="text"
              value={activeEndpoint.path}
              onChange={(e) => updateActiveEndpointDraft({ path: e.target.value })}
              onBlur={saveActiveEndpointDraft}
              placeholder="/api/v1/resource"
              className="w-full h-9 px-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
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
              className="flex-shrink-0 h-9 px-2.5 bg-[#0C0E12] border border-[#2A2F45] text-xs font-mono text-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[110px]"
              title="Select simulated HTTP status response scenario"
            >
              {scenarios.map((s) => (
                <option key={s.code} value={s.code} className="bg-[#0C0E12] text-white">
                  {s.label}
                </option>
              ))}
            </select>
          )}

          {/* Send / Simulate Button with Signature First Page Gradient */}
          <Button
            variant={executionMode === 'mock' ? 'accent' : 'primary'}
            size="md"
            isLoading={isExecuting}
            onClick={handleExecute}
            className={`flex-shrink-0 whitespace-nowrap font-semibold px-4 rounded-lg shadow-md transition-all active:scale-95 ${
              executionMode === 'mock'
                ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25 border-0'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
            }`}
            leftIcon={executionMode === 'mock' ? <Sparkles className="w-3.5 h-3.5 flex-shrink-0" /> : <Send className="w-3.5 h-3.5 flex-shrink-0" />}
            title="Execute request (Ctrl+Enter)"
          >
            {executionMode === 'mock' ? 'Simulate' : 'Send'}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => useUIStore.getState().setShareOpen(true)}
            className="flex-shrink-0 px-2.5 text-cyan-400 border-[#2A2F45] hover:border-cyan-500/50 hover:bg-cyan-500/10 rounded-lg"
            title="Share interactive mock URL"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Resolved URL preview */}
        <div className="flex items-center justify-between text-[11px] text-white/40 px-1 pt-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-white/50 text-[10px] uppercase font-mono">TARGET:</span>
            <span className="font-mono text-indigo-400/90 truncate">{fullPreviewUrl}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 text-[10px]">
            <kbd className="px-1.5 py-0.5 bg-[#1C2030] border border-[#2A2F45] rounded font-mono text-white/60">
              Ctrl + ↵
            </kbd>
          </div>
        </div>
      </div>

      {/* Request Segmented Pill Tabs Header */}
      <div className="px-3 py-2 bg-[#141720] border-b border-[#2A2F45]">
        <div className="flex items-center gap-1 bg-[#0C0E12] p-1 rounded-xl border border-[#2A2F45] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setRequestTab('params')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              requestTab === 'params'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              requestTab === 'path'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              requestTab === 'headers'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              requestTab === 'body'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Body</span>
            {activeEndpoint.requestBody.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setRequestTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              requestTab === 'tests'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Tests & Assertions</span>
            {(activeEndpoint.assertions || []).filter((a) => a.enabled).length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold">
                {(activeEndpoint.assertions || []).filter((a) => a.enabled).length}
              </span>
            )}
          </button>
        </div>
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

        {requestTab === 'tests' && (
          <AssertionBuilder
            assertions={activeEndpoint.assertions || []}
            onChange={(items) => {
              updateActiveEndpointDraft({ assertions: items });
              saveActiveEndpointDraft();
            }}
          />
        )}
      </div>
    </div>
  );
};
