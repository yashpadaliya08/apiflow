import React, { useEffect, useState } from 'react';
import { BarChart3, Activity, Clock, Globe, Zap, Users, Copy, Download, RefreshCw, Lock, Unlock, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { getStoredSummary, type AnalyticsSummary } from '@/lib/analytics';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServerStats {
  uniqueVisitors: number;
  totalSimulations: number;
  totalLiveProxy: number;
  totalCodeCopies: number;
  totalExports: number;
  uptimeSeconds: number;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [localSummary, setLocalSummary] = useState<AnalyticsSummary>(getStoredSummary());
  const [serverStats, setServerStats] = useState<ServerStats | null>(null);
  const [loadingServer, setLoadingServer] = useState(false);
  const [adminKey, setAdminKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('apiflow_admin_key') || '' : '';
  });
  const [inputKey, setInputKey] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchServerStats = async (keyToUse?: string) => {
    const key = keyToUse !== undefined ? keyToUse : adminKey;
    if (!key) {
      setServerStats(null);
      return;
    }

    try {
      setLoadingServer(true);
      setAuthError(null);
      const res = await fetch('/api/stats', {
        headers: { 'x-admin-key': key },
      });

      if (res.ok) {
        const data = await res.json();
        setServerStats(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('apiflow_admin_key', key);
          setAdminKey(key);
        }
      } else if (res.status === 401) {
        setServerStats(null);
        setAuthError('Invalid Admin Key. Access denied.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('apiflow_admin_key');
          setAdminKey('');
        }
      } else {
        setServerStats(null);
      }
    } catch {
      // Backend might be offline in pure client mode
    } finally {
      setLoadingServer(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    await fetchServerStats(inputKey.trim());
    setInputKey('');
  };

  const handleLock = () => {
    setServerStats(null);
    setAdminKey('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('apiflow_admin_key');
      document.cookie = 'apiflow_admin_key=; path=/; max-age=0';
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLocalSummary(getStoredSummary());
      if (adminKey) {
        fetchServerStats(adminKey);
      }
    }
  }, [isOpen]);

  const totalReqs = localSummary.totalSimulations + localSummary.totalLiveProxy;
  const success2xx = localSummary.statusDistribution['2xx'];
  const successRate = totalReqs > 0 ? Math.round((success2xx / totalReqs) * 100) : 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Simulation Metrics & Telemetry"
      description="Monitor local client-side simulations, latency timers, and protected server telemetry"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Top Metric Cards Grid (Local Client) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="text-[11px] font-semibold uppercase">Simulations</span>
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">{localSummary.totalSimulations}</div>
            <span className="text-[10px] text-white/40">In-browser mock</span>
          </div>

          <div className="p-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="text-[11px] font-semibold uppercase">Live Proxy</span>
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">{localSummary.totalLiveProxy}</div>
            <span className="text-[10px] text-white/40">CORS bypass calls</span>
          </div>

          <div className="p-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="text-[11px] font-semibold uppercase">Avg Latency</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {localSummary.avgLatencyMs ? `${localSummary.avgLatencyMs}ms` : '--'}
            </div>
            <span className="text-[10px] text-white/40">Client jitter</span>
          </div>

          <div className="p-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg">
            <div className="flex items-center justify-between text-white/50 mb-1">
              <span className="text-[11px] font-semibold uppercase">Success Rate</span>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-400">{totalReqs > 0 ? `${successRate}%` : '100%'}</div>
            <span className="text-[10px] text-white/40">{success2xx} of {totalReqs} 2xx</span>
          </div>
        </div>

        {/* Status Code Distribution Bar */}
        <div className="p-3.5 bg-[#0C0E12] border border-[#2A2F45] rounded-lg space-y-2">
          <div className="flex items-center justify-between text-white/70 font-semibold text-[11px]">
            <span>HTTP Status Code Distribution</span>
            <span className="text-white/40 font-mono text-[10px]">{totalReqs} total executions</span>
          </div>

          <div className="h-3 w-full bg-[#1C2030] rounded-full overflow-hidden flex">
            {totalReqs === 0 ? (
              <div className="w-full bg-[#2A2F45]/50 h-full" />
            ) : (
              <>
                <div
                  style={{ width: `${(localSummary.statusDistribution['2xx'] / totalReqs) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`2xx Success: ${localSummary.statusDistribution['2xx']}`}
                />
                <div
                  style={{ width: `${(localSummary.statusDistribution['4xx'] / totalReqs) * 100}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`4xx Client Errors: ${localSummary.statusDistribution['4xx']}`}
                />
                <div
                  style={{ width: `${(localSummary.statusDistribution['5xx'] / totalReqs) * 100}%` }}
                  className="bg-red-500 h-full transition-all"
                  title={`5xx Server Errors: ${localSummary.statusDistribution['5xx']}`}
                />
              </>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px] text-white/60 font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>2xx Success: {localSummary.statusDistribution['2xx']}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>4xx Client Errors: {localSummary.statusDistribution['4xx']}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>5xx Server Errors: {localSummary.statusDistribution['5xx']}</span>
            </span>
          </div>
        </div>

        {/* Server & Global Telemetry (Protected) */}
        <div className="p-3.5 bg-[#0C0E12] border border-[#2A2F45] rounded-lg space-y-2.5">
          <div className="flex items-center justify-between text-white/70 font-semibold text-[11px]">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Server-Side Telemetry</span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-[#1C2030] text-white/50 border border-[#2A2F45]">
                {serverStats ? 'UNLOCKED' : 'PROTECTED'}
              </span>
            </div>

            {serverStats && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchServerStats()}
                  disabled={loadingServer}
                  className="text-white/40 hover:text-white flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingServer ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleLock}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] ml-1"
                  title="Lock Telemetry"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>

          {serverStats ? (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-3 gap-2 font-mono text-white/80">
                <div className="p-2 rounded bg-[#141720] border border-[#2A2F45]">
                  <div className="text-[10px] text-white/40">Unique IPs</div>
                  <div className="text-base font-bold text-indigo-400">{serverStats.uniqueVisitors}</div>
                </div>
                <div className="p-2 rounded bg-[#141720] border border-[#2A2F45]">
                  <div className="text-[10px] text-white/40">Global Simulations</div>
                  <div className="text-base font-bold text-emerald-400">{serverStats.totalSimulations}</div>
                </div>
                <div className="p-2 rounded bg-[#141720] border border-[#2A2F45]">
                  <div className="text-[10px] text-white/40">Server Uptime</div>
                  <div className="text-base font-bold text-white">{Math.round(serverStats.uptimeSeconds / 60)} min</div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <a
                  href={`/stats?key=${encodeURIComponent(adminKey)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  <span>Open Full Traffic Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#141720]/60 border border-[#2A2F45] rounded-md space-y-2">
              <div className="flex items-center gap-2 text-white/60">
                <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-[11px]">Server visitor metrics and server traffic are restricted to admin access.</span>
              </div>

              {authError && (
                <div className="text-red-400 text-[11px]">{authError}</div>
              )}

              <form onSubmit={handleUnlock} className="flex gap-1.5 items-center pt-1">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter ADMIN_KEY..."
                  className="flex-1 px-2.5 py-1 bg-[#0C0E12] border border-[#2A2F45] text-white rounded text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
                <Button size="xs" variant="primary" type="submit" isLoading={loadingServer}>
                  Unlock
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" size="xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
