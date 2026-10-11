import { runActiveRequest } from '@/lib/execution/run-active-request';
import React, { useState, useMemo } from 'react';
import {
  Clock,
  HardDrive,
  Copy,
  Check,
  Zap,
  Globe,
  Layers,
  Terminal,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useExecutionStore } from '@/store/execution-store';
import { useCollectionStore } from '@/store/collection-store';
import { useUIStore } from '@/store/ui-store';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatBytes, formatLatency, copyToClipboard } from '@/lib/utils';
import { computeJsonDiff } from '@/lib/utils/json-diff';
import { evaluateAllAssertions } from '@/lib/assertions/evaluator';
import { executeMock, executeLive } from '@/lib/engines/mock-executor';
import { interpolateVariables } from '@/lib/engines/synthetic-engine';
import { trackEvent } from '@/lib/analytics';

export const ResponseViewer: React.FC = () => {
  const {
    response: storedResponse,
    responseEndpointId,
    previousResponse,
    error,
    warning,
    isExecuting,
    setResponse,
    setError,
    setIsExecuting,
  } = useExecutionStore();

  const {
    activeEndpoint,
    activeCollection,
    environments,
    activeEnvironmentId,
    addHistoryEntry,
  } = useCollectionStore();

  const response = responseEndpointId === activeEndpoint?.id ? storedResponse : null;
  const { responseTab, setResponseTab, executionMode } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [rawView, setRawView] = useState(false);

  // MUST be called unconditionally at top of component before any early returns (React Rules of Hooks)
  const jsonString = useMemo(() => {
    if (response?.body === undefined) return '';
    return typeof response.body === 'string'
      ? response.body
      : JSON.stringify(response.body, null, 2);
  }, [response]);

  const previousJsonString = useMemo(() => {
    if (previousResponse?.body === undefined) return '';
    return typeof previousResponse.body === 'string'
      ? previousResponse.body
      : JSON.stringify(previousResponse.body, null, 2);
  }, [previousResponse]);

  const diffLines = useMemo(() => {
    if (!previousJsonString || !jsonString) return [];
    return computeJsonDiff(previousJsonString, jsonString);
  }, [previousJsonString, jsonString]);

  const assertionResults = useMemo(() => {
    return evaluateAllAssertions(activeEndpoint?.assertions, response);
  }, [activeEndpoint?.assertions, response]);

  const passedTestsCount = useMemo(() => {
    return assertionResults.filter((r) => r.passed).length;
  }, [assertionResults]);

  const handleCopy = async () => {
    if (!response) return;
    const text = typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExecuteFromEmpty = runActiveRequest;

  if (isExecuting) {
    return (
      <div role="status" className="response-state">
        <div className="response-state-content">
          <div aria-hidden="true" className="mb-4 h-5 w-5 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin" />
          <h3>{executionMode === 'live' ? 'Sending request…' : 'Generating mock response…'}</h3>
          <p>The response, headers and test results will appear here.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="response-state">
        <div className="response-state-content">
          <h3 className="text-red-300">Request failed</h3>
          <p role="alert" className="font-mono break-words">{error}</p>
          <Button onClick={handleExecuteFromEmpty} variant="secondary" className="mt-5">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-state">
        <div className="response-state-content">
          <Terminal aria-hidden="true" className="mb-5 h-6 w-6 text-slate-500" />
          <h3>Ready when you are</h3>
          <p>{executionMode === 'live'
            ? 'Send a request to inspect the response body, headers and test results.'
            : 'Simulate this endpoint to inspect a mock response and run your assertions. No request is sent to your server.'}</p>
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Button variant="primary" onClick={handleExecuteFromEmpty} disabled={!activeEndpoint}>
              {executionMode === 'live' ? 'Send request' : 'Simulate request'}
            </Button>
            <span className="text-xs text-slate-400 font-mono">Ctrl + Enter</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141720] overflow-hidden">
      {warning && <div role="status" className="p-3 text-xs text-amber-300 bg-amber-500/10">{warning}</div>}
      {/* Top Response Meta Header */}
      <div className="p-3 border-b border-[#2A2F45] bg-[#141720]/80 backdrop-blur-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={response.status} statusText={response.statusText} size="md" />

          {activeEndpoint && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                response.status === (activeEndpoint.mockScenario || 200)
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
              title={`Contract assertion: Expected status ${activeEndpoint.mockScenario || 200}`}
            >
              {response.status === (activeEndpoint.mockScenario || 200) ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Contract Match</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Deviates ({activeEndpoint.mockScenario || 200})</span>
                </>
              )}
            </span>
          )}

          <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md bg-[#1C2030] text-emerald-400 border border-[#2A2F45]">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{formatLatency(response.latency)}</span>
          </span>

          <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-md bg-[#1C2030] text-white/70 border border-[#2A2F45]">
            <HardDrive className="w-3 h-3 text-white/40" />
            <span>{formatBytes(response.size)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {response.mode === 'mock' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm shadow-indigo-500/10">
              <Zap className="w-3 h-3 text-indigo-400" /> Mock Engine
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm shadow-emerald-500/10">
              <Globe className="w-3 h-3 text-emerald-400" /> Live Proxy
            </span>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-white/80 hover:text-white transition-colors"
            title="Copy response body"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-white/50" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Segmented Pill Tabs: Body / Headers / Diff / Tests */}
      <div className="px-3 py-2 bg-[#141720] border-b border-[#2A2F45] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#0C0E12] p-1 rounded-xl border border-[#2A2F45] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setResponseTab('body')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              responseTab === 'body'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Response Body
          </button>

          <button
            onClick={() => setResponseTab('headers')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              responseTab === 'headers'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Headers</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-[#1C2030] border border-[#2A2F45] text-white/60 rounded-full font-mono">
              {Object.keys(response.headers || {}).length}
            </span>
          </button>

          <button
            onClick={() => setResponseTab('diff')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              responseTab === 'diff'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Compare with previous run or mock response"
          >
            <GitCompare className="w-3 h-3 text-indigo-400" />
            <span>Diff / Compare</span>
            {previousResponse && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </button>

          <button
            onClick={() => setResponseTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              responseTab === 'tests'
                ? 'bg-[#1C2030] text-white shadow-sm border border-[#2A2F45] font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="View automated contract assertions and validation results"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Tests</span>
            {assertionResults.length > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                  passedTestsCount === assertionResults.length
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {passedTestsCount}/{assertionResults.length}
              </span>
            )}
          </button>
        </div>

        {responseTab === 'body' && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setRawView(!rawView)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                rawView
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                  : 'bg-[#0C0E12] text-white/50 border-[#2A2F45] hover:text-white'
              }`}
            >
              {rawView ? 'Raw JSON' : 'Pretty'}
            </button>
          </div>
        )}
      </div>

      {/* Response Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#0C0E12] font-mono text-xs select-text">
        {responseTab === 'body' && (
          <div className="relative">
            <pre className="text-white/90 leading-relaxed overflow-x-auto whitespace-pre-wrap break-words">
              {jsonString}
            </pre>
          </div>
        )}

        {responseTab === 'headers' && (
          <div className="border border-[#2A2F45] rounded-md overflow-hidden bg-[#0C0E12]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141720] border-b border-[#2A2F45] text-[11px] font-semibold text-white/50 uppercase">
                <tr>
                  <th className="px-3 py-2">Header Key</th>
                  <th className="px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F45]/50">
                {Object.entries(response.headers || {}).map(([key, val]) => (
                  <tr key={key} className="hover:bg-[#141720]/50">
                    <td className="px-3 py-1.5 text-indigo-400 font-semibold">{key}</td>
                    <td className="px-3 py-1.5 text-white/80 break-all">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {responseTab === 'diff' && (
          <div>
            {!previousResponse ? (
              <div className="text-center py-12 text-white/40">
                <GitCompare className="w-8 h-8 mx-auto mb-2 text-white/20" />
                <p className="font-semibold text-white/70">No Previous Execution to Compare</p>
                <p className="text-[11px] mt-1 text-white/40 max-w-sm mx-auto">
                  Click <span className="text-indigo-400 font-medium">Simulate</span> again or toggle between Mock &amp; Live Proxy to see line-by-line visual differences!
                </p>
              </div>
            ) : (
              <div className="border border-[#2A2F45] rounded-md overflow-hidden bg-[#0C0E12] font-mono text-xs">
                <div className="p-2.5 bg-[#141720] border-b border-[#2A2F45] flex items-center justify-between text-[11px] text-white/60">
                  <div className="flex items-center gap-4">
                    <span className="text-rose-400">
                      - Previous ({previousResponse.status} {previousResponse.statusText})
                    </span>
                    <span className="text-emerald-400">
                      + Current ({response.status} {response.statusText})
                    </span>
                  </div>
                  <span className="text-white/40">
                    {diffLines.filter((l) => l.type !== 'same').length} lines altered
                  </span>
                </div>
                <div className="overflow-x-auto p-2 leading-relaxed max-h-[500px]">
                  {diffLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start px-2 py-0.5 rounded text-[11px] ${
                        line.type === 'added'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : line.type === 'removed'
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'text-white/60'
                      }`}
                    >
                      <span className="w-5 flex-shrink-0 select-none text-[10px] text-white/30 font-bold">
                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                      </span>
                      <span className="whitespace-pre-wrap break-all flex-1">{line.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tests / Assertions Tab Panel */}
        {responseTab === 'tests' && (
          <div className="space-y-3">
            {assertionResults.length === 0 ? (
              <div className="p-8 text-center text-white/40 flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#0C0E12] flex items-center justify-center border border-[#2A2F45]">
                  <CheckCircle2 className="w-5 h-5 text-white/30" />
                </div>
                <p className="text-white/70 font-medium">No assertions configured</p>
                <p className="text-[11px] text-white/40 max-w-xs">
                  Switch to the <span className="text-indigo-400 font-medium">Tests & Assertions</span> tab in the Request panel to add automated checks.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="p-2.5 bg-[#0C0E12] border border-[#2A2F45] rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-white/90 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Contract Assertions Result</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                      passedTestsCount === assertionResults.length
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {passedTestsCount} / {assertionResults.length} PASSED
                  </span>
                </div>

                <div className="space-y-1.5">
                  {assertionResults.map((res) => (
                    <div
                      key={res.assertionId}
                      className={`p-2.5 rounded-lg border flex items-start gap-2.5 text-xs transition-all ${
                        res.passed
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-red-500/5 border-red-500/20'
                      }`}
                    >
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white/90 truncate">{res.message}</span>
                          <span
                            className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                              res.passed
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                          >
                            {res.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 font-mono">
                          <span>Target: <strong className="text-white/70">{res.target}</strong></span>
                          {res.property && <span>Property: <strong className="text-white/70">{res.property}</strong></span>}
                          <span>Actual: <strong className={res.passed ? 'text-emerald-400' : 'text-red-400'}>{res.actualValue}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
