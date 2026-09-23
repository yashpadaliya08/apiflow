import React from 'react';
import { Play, Trash2, Clock, Zap } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MethodBadge, StatusBadge } from '@/components/ui/Badge';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import { useExecutionStore } from '@/store/execution-store';
import { formatLatency } from '@/lib/utils';
import type { HistoryEntry } from '@/types';

export const HistoryDrawer: React.FC = () => {
  const { historyOpen, setHistoryOpen } = useUIStore();
  const { history, selectEndpoint, clearHistory } = useCollectionStore();
  const { setResponse } = useExecutionStore();

  const handleReplay = (entry: HistoryEntry) => {
    selectEndpoint(entry.endpointId);
    setResponse(entry.response);
    setHistoryOpen(false);
  };

  return (
    <Modal
      isOpen={historyOpen}
      onClose={() => setHistoryOpen(false)}
      title="Request Execution History"
      description="Recent API test calls saved in Dexie.js IndexedDB. Click any entry to view or replay."
      maxWidth="2xl"
    >
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-[#2A2F45] pb-2">
          <span className="text-white/50 text-[11px] font-semibold uppercase">
            Showing {history.length} recent executions
          </span>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all execution history?')) {
                  clearHistory();
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-1.5 divide-y divide-[#2A2F45]/30">
          {history.length === 0 ? (
            <div className="p-8 text-center text-white/40">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
              <p>No executions recorded yet.</p>
              <p className="text-[11px] text-white/30 mt-0.5">
                Send a request in Mock Engine or Live Proxy mode to see it recorded here.
              </p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => handleReplay(item)}
                className="pt-2 pb-1.5 px-2.5 rounded-lg bg-[#0C0E12] hover:bg-[#1C2030] border border-[#2A2F45] cursor-pointer flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <MethodBadge method={item.method} size="sm" />
                  <StatusBadge status={item.status} size="sm" />

                  <div className="overflow-hidden flex-1">
                    <div className="font-mono text-white/90 text-xs truncate">{item.path}</div>
                    <div className="text-[10px] text-white/40 truncate">{item.endpointName}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-white/40">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-white/30" />
                    <span>{formatLatency(item.latency)}</span>
                  </span>

                  <span className="text-[10px] text-white/30 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReplay(item);
                    }}
                    className="p-1 rounded bg-indigo-600/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                    title="Load & Replay"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
