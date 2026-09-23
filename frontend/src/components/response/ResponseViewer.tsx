import React, { useState } from 'react';
import {
  Clock,
  HardDrive,
  Copy,
  Check,
  Zap,
  Globe,
  Layers,
  Terminal,
} from 'lucide-react';
import { useExecutionStore } from '@/store/execution-store';
import { useUIStore } from '@/store/ui-store';
import { StatusBadge } from '@/components/ui/Badge';
import { formatBytes, formatLatency, copyToClipboard } from '@/lib/utils';

export const ResponseViewer: React.FC = () => {
  const { response, error, isExecuting } = useExecutionStore();
  const { responseTab, setResponseTab } = useUIStore();
  const [copied, setCopied] = useState(false);
  const [rawView, setRawView] = useState(false);

  const handleCopy = async () => {
    if (!response) return;
    const text = typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2);
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isExecuting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0C0E12] select-none">
        <div className="relative mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Zap className="w-5 h-5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-sm font-semibold text-white/90">Executing Request</h3>
        <p className="text-xs text-white/40 mt-1">Generating synthetic schema & simulating latency...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0C0E12] text-red-400 select-none">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-3">
          <Terminal className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-sm font-semibold text-red-300">Execution Failed</h3>
        <p className="text-xs text-red-400/80 max-w-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0C0E12] text-white/40 select-none">
        <div className="w-12 h-12 rounded-xl bg-[#141720] border border-[#2A2F45] flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-white/30" />
        </div>
        <h3 className="text-sm font-semibold text-white/70">No Response Yet</h3>
        <p className="text-xs text-white/40 max-w-xs mt-1">
          Click <span className="text-indigo-400 font-semibold">Simulate</span> or press{' '}
          <kbd className="px-1.5 py-0.5 bg-[#1C2030] rounded border border-[#2A2F45] font-mono text-[11px] text-white/70">
            Ctrl+Enter
          </kbd>{' '}
          to execute request.
        </p>
      </div>
    );
  }

  const jsonString =
    typeof response.body === 'string'
      ? response.body
      : JSON.stringify(response.body, null, 2);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#141720] overflow-hidden">
      {/* Top Response Meta Header */}
      <div className="p-3 border-b border-[#2A2F45] bg-[#141720] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={response.status} statusText={response.statusText} size="md" />

          <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-[#1C2030] text-emerald-400 border border-[#2A2F45]">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{formatLatency(response.latency)}</span>
          </span>

          <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-[#1C2030] text-white/70 border border-[#2A2F45]">
            <HardDrive className="w-3 h-3 text-white/40" />
            <span>{formatBytes(response.size)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {response.mode === 'mock' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
              <Zap className="w-3 h-3 text-indigo-400" /> Mock Engine
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
              <Globe className="w-3 h-3 text-emerald-400" /> Live Proxy
            </span>
          )}

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-white/80 hover:text-white transition-colors"
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

      {/* Tabs: Body / Headers */}
      <div className="flex items-center justify-between border-b border-[#2A2F45] bg-[#141720] px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setResponseTab('body')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              responseTab === 'body'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Response Body
          </button>

          <button
            onClick={() => setResponseTab('headers')}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              responseTab === 'headers'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <span>Headers</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-[#1C2030] text-white/60 rounded-full font-mono">
              {Object.keys(response.headers || {}).length}
            </span>
          </button>
        </div>

        {responseTab === 'body' && (
          <div className="flex items-center gap-1 py-1">
            <button
              onClick={() => setRawView(!rawView)}
              className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                rawView
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                  : 'bg-transparent text-white/50 border-[#2A2F45] hover:text-white'
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
      </div>
    </div>
  );
};
