import React, { useState, useRef } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Globe,
  FileDown,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import { executeMock, executeLive } from '@/lib/engines/mock-executor';
import type { Endpoint, ExecutionMode } from '@/types';
import { copyToClipboard } from '@/lib/utils';

export interface RunResult {
  endpointId: string;
  name: string;
  method: string;
  path: string;
  expectedStatus: number;
  actualStatus: number;
  statusText: string;
  latencyMs: number;
  passed: boolean;
  error?: string;
}

export const CollectionRunnerModal: React.FC = () => {
  const { runnerOpen, setRunnerOpen } = useUIStore();
  const { activeCollection, endpoints, environments, activeEnvironmentId } = useCollectionStore();

  const [mode, setMode] = useState<ExecutionMode>('mock');
  const [delayMs, setDelayMs] = useState<number>(50);
  const [stopOnFailure, setStopOnFailure] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState<RunResult[]>([]);
  const [copiedReport, setCopiedReport] = useState(false);

  const abortRef = useRef(false);

  if (!activeCollection) return null;

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
  const baseUrl = activeEnv?.variables.find((v) => v.enabled && v.key === 'baseUrl')?.value || activeCollection.baseUrl || 'https://api.example.com';

  const handleStartRun = async () => {
    if (endpoints.length === 0) return;
    setIsRunning(true);
    setResults([]);
    setCurrentIndex(0);
    abortRef.current = false;

    const accumulatedResults: RunResult[] = [];

    for (let i = 0; i < endpoints.length; i++) {
      if (abortRef.current) break;
      setCurrentIndex(i);
      const ep = endpoints[i];

      try {
        let actualStatus = 200;
        let statusText = 'OK';
        let latency = 20;

        if (mode === 'mock') {
          const res = await executeMock(ep);
          actualStatus = res.status;
          statusText = res.statusText;
          latency = res.latency;
        } else {
          // Construct live headers
          const liveHeaders: Record<string, string> = {};
          (ep.headers || []).filter((h) => h.enabled && h.key).forEach((h) => {
            liveHeaders[h.key] = h.value;
          });
          const res = await executeLive(ep, baseUrl, liveHeaders);
          actualStatus = res.status;
          statusText = res.statusText;
          latency = res.latency;
        }

        // Determine pass/fail:
        // In mock mode, if actual status matches the mock scenario, it passed.
        // In live mode, 2xx and 3xx are passed.
        const expected = ep.mockScenario || 200;
        const passed = mode === 'mock' ? actualStatus === expected : actualStatus >= 200 && actualStatus < 400;

        const result: RunResult = {
          endpointId: ep.id,
          name: ep.name,
          method: ep.method,
          path: ep.path,
          expectedStatus: expected,
          actualStatus,
          statusText,
          latencyMs: latency,
          passed,
        };

        accumulatedResults.push(result);
        setResults([...accumulatedResults]);

        if (stopOnFailure && !passed) {
          break;
        }
      } catch (err: any) {
        const result: RunResult = {
          endpointId: ep.id,
          name: ep.name,
          method: ep.method,
          path: ep.path,
          expectedStatus: ep.mockScenario || 200,
          actualStatus: 0,
          statusText: 'Network / Proxy Error',
          latencyMs: 0,
          passed: false,
          error: err.message || 'Execution failed',
        };
        accumulatedResults.push(result);
        setResults([...accumulatedResults]);
        if (stopOnFailure) break;
      }

      if (delayMs > 0 && i < endpoints.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
  };

  const handleStopRun = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const avgLatency = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length) : 0;
  const progressPct = endpoints.length > 0 && results.length > 0 ? Math.round((results.length / endpoints.length) * 100) : 0;

  const generateMarkdownReport = () => {
    const lines = [
      `# APIFlow Collection Runner Report: ${activeCollection.name}`,
      `Generated: ${new Date().toISOString()}`,
      `Mode: ${mode.toUpperCase()} | Environment: ${activeEnv?.name || 'Default'} | Base URL: ${baseUrl}`,
      ``,
      `### Summary`,
      `- **Total Endpoints Tested**: ${results.length} / ${endpoints.length}`,
      `- **Passed**: ${passedCount} (${results.length > 0 ? Math.round((passedCount / results.length) * 100) : 0}%)`,
      `- **Failed**: ${failedCount}`,
      `- **Average Latency**: ${avgLatency}ms`,
      ``,
      `### Detailed Test Results`,
      `| Method | Endpoint | Expected | Actual | Latency | Status |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ];

    results.forEach((r) => {
      lines.push(
        `| **${r.method}** | \`${r.path}\` | ${r.expectedStatus} | ${r.actualStatus} ${r.statusText} | ${r.latencyMs}ms | ${r.passed ? '✅ PASSED' : '❌ FAILED'} |`
      );
    });

    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    const md = generateMarkdownReport();
    await copyToClipboard(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 1500);
  };

  return (
    <Modal
      isOpen={runnerOpen}
      onClose={() => {
        if (isRunning) handleStopRun();
        setRunnerOpen(false);
      }}
      title={`Collection Test Runner — ${activeCollection.name}`}
      description="Automated in-browser test runner. Sequentially executes every endpoint contract with real-time pass/fail telemetry."
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Control Bar */}
        <div className="p-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mode selection */}
            <div className="flex bg-[#141720] p-0.5 rounded-md border border-[#2A2F45]">
              <button
                type="button"
                onClick={() => !isRunning && setMode('mock')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  mode === 'mock' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Mock Engine</span>
              </button>
              <button
                type="button"
                onClick={() => !isRunning && setMode('live')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  mode === 'live' ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Live Proxy</span>
              </button>
            </div>

            {/* Delay Selector */}
            <div className="flex items-center gap-1.5 text-white/70">
              <span className="text-[11px]">Pacing:</span>
              <select
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                disabled={isRunning}
                className="bg-[#141720] border border-[#2A2F45] rounded px-2 py-1 text-white focus:outline-none"
              >
                <option value={0}>0ms (Instant)</option>
                <option value={50}>50ms</option>
                <option value={150}>150ms</option>
                <option value={300}>300ms</option>
              </select>
            </div>

            {/* Stop on Failure */}
            <label className="flex items-center gap-1.5 text-white/70 cursor-pointer">
              <input
                type="checkbox"
                checked={stopOnFailure}
                onChange={(e) => setStopOnFailure(e.target.checked)}
                disabled={isRunning}
                className="rounded border-[#2A2F45] bg-[#141720] text-indigo-500 focus:ring-0"
              />
              <span className="text-[11px]">Stop on Failure</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartRun}
                leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              >
                {results.length > 0 ? 'Run Again' : 'Start Run'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopRun}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                leftIcon={<Square className="w-3 h-3 fill-current" />}
              >
                Stop Run
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {(isRunning || results.length > 0) && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-white/60">
              <span>
                {isRunning ? `Running endpoint ${currentIndex + 1} of ${endpoints.length}...` : 'Execution Completed'}
              </span>
              <span>{results.length} / {endpoints.length} ({progressPct}%)</span>
            </div>
            <div className="h-1.5 w-full bg-[#1C2030] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${failedCount > 0 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="border border-[#2A2F45] rounded-lg overflow-hidden max-h-[340px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#141720] text-[11px] font-semibold text-white/60 sticky top-0 z-10 border-b border-[#2A2F45]">
              <tr>
                <th className="py-2 px-3 w-10">#</th>
                <th className="py-2 px-3 w-20">Method</th>
                <th className="py-2 px-3">Endpoint Path</th>
                <th className="py-2 px-3 w-24">Expected</th>
                <th className="py-2 px-3 w-28">Status</th>
                <th className="py-2 px-3 w-20">Latency</th>
                <th className="py-2 px-3 w-20 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F45]/50 bg-[#0C0E12]">
              {endpoints.map((ep, idx) => {
                const res = results.find((r) => r.endpointId === ep.id);
                const isCurrent = isRunning && currentIndex === idx;

                let methodColor = 'text-blue-400 bg-blue-500/10';
                if (ep.method === 'POST') methodColor = 'text-emerald-400 bg-emerald-500/10';
                else if (ep.method === 'PUT') methodColor = 'text-amber-400 bg-amber-500/10';
                else if (ep.method === 'DELETE') methodColor = 'text-rose-400 bg-rose-500/10';

                return (
                  <tr
                    key={ep.id}
                    className={`hover:bg-[#141720]/70 transition-colors ${
                      isCurrent ? 'bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/30' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[11px] text-white/40">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${methodColor}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-white/90 truncate max-w-[240px]">{ep.name}</div>
                      <div className="font-mono text-[10px] text-white/40 truncate max-w-[240px]">{ep.path}</div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-white/60">
                      {ep.mockScenario || 200}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {res ? (
                        <span className={res.passed ? 'text-emerald-400' : 'text-red-400'}>
                          {res.actualStatus} {res.statusText}
                        </span>
                      ) : isCurrent ? (
                        <span className="text-indigo-400 animate-pulse">Running...</span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-white/60">
                      {res ? `${res.latencyMs}ms` : '—'}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {res ? (
                        res.passed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PASS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <XCircle className="w-3 h-3" />
                            <span>FAIL</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-white/20">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom KPIs and Export */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2F45]">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-white/40 mr-1.5">Total:</span>
              <span className="font-semibold text-white">{results.length}</span>
            </div>
            <div>
              <span className="text-white/40 mr-1.5">Passed:</span>
              <span className="font-semibold text-emerald-400">{passedCount}</span>
            </div>
            <div>
              <span className="text-white/40 mr-1.5">Failed:</span>
              <span className="font-semibold text-rose-400">{failedCount}</span>
            </div>
            <div>
              <span className="text-white/40 mr-1.5">Avg Latency:</span>
              <span className="font-semibold text-white/80">{avgLatency}ms</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                leftIcon={copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedReport ? 'Report Copied!' : 'Copy Markdown Report'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRunnerOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
