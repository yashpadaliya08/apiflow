import React, { useEffect, useState } from 'react';
import { Zap, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';

interface StatsData {
  status: string;
  activeVisitors: number;
  uniqueVisitors: number;
  totalPageviews: number;
  totalSimulations: number;
  totalLiveProxy: number;
  sourceCounts: Record<string, number>;
  deviceCounts: Record<string, number>;
  campaignCounts: Record<string, number>;
  countryCounts: Record<string, number>;
  recentVisits: Array<{
    id: string;
    formattedTime: string;
    source: string;
    tag: string;
    device: string;
    country: string;
    ipMasked: string;
  }>;
  uptimeSeconds: number;
}

export const StatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const totalSources = stats?.sourceCounts
    ? Object.values(stats.sourceCounts).reduce((a, b) => a + b, 0) || 1
    : 1;

  return (
    <div className="min-h-screen bg-[#090B0E] text-[#F1F5F9] font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">APIFlow Live Traffic Monitor</h1>
              <p className="text-xs text-white/50">Real-Time Visitor Detection & Referral Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"></span>
              <span>Live Auto-Refresh (3s)</span>
            </div>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors"
            >
              <span>Open Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-white/50 font-medium flex items-center justify-between mb-2">
              <span>Active Right Now</span>
              <span>🟢</span>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
              {stats?.activeVisitors ?? 1}
            </div>
            <div className="text-[11px] text-white/40 mt-1">Visitors active in last 5 minutes</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-white/50 font-medium flex items-center justify-between mb-2">
              <span>Unique Visitors</span>
              <span>👥</span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {stats?.uniqueVisitors ?? 1}
            </div>
            <div className="text-[11px] text-white/40 mt-1">Total unique IP addresses</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-white/50 font-medium flex items-center justify-between mb-2">
              <span>Total Pageviews</span>
              <span>👁️</span>
            </div>
            <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">
              {stats?.totalPageviews ?? 0}
            </div>
            <div className="text-[11px] text-white/40 mt-1">Total page load sessions</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-white/50 font-medium flex items-center justify-between mb-2">
              <span>Simulations & Mocks</span>
              <span>⚡</span>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
              {(stats?.totalSimulations ?? 0) + (stats?.totalLiveProxy ?? 0)}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              {stats?.totalLiveProxy ?? 0} live proxy calls
            </div>
          </div>
        </div>

        {/* Section Grid: Traffic breakdown & Link Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold flex items-center justify-between">
              <span>Traffic by Source</span>
              <span className="text-xs font-normal text-white/40">Reddit, Social, Direct</span>
            </h2>

            <div className="space-y-3 pt-2">
              {[
                { name: 'Reddit', count: stats?.sourceCounts?.['Reddit'] ?? 0, color: 'bg-orange-500', icon: '🔴' },
                { name: 'Twitter / X', count: stats?.sourceCounts?.['Twitter / X'] ?? 0, color: 'bg-sky-500', icon: '🐦' },
                { name: 'Hacker News', count: stats?.sourceCounts?.['Hacker News'] ?? 0, color: 'bg-amber-600', icon: '🟠' },
                { name: 'Direct / Clean Link', count: stats?.sourceCounts?.['Direct'] ?? 0, color: 'bg-indigo-500', icon: '🔗' },
                { name: 'Other Referrals', count: stats?.sourceCounts?.['Other'] ?? 0, color: 'bg-purple-500', icon: '🌐' },
              ].map((item) => {
                const pct = Math.round((item.count / totalSources) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>{item.icon} {item.name}</span>
                      <span className="text-white/60 font-mono"><strong>{item.count}</strong> ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Links */}
          <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md space-y-4">
            <h2 className="text-sm font-bold flex items-center justify-between">
              <span>Your Tagged Campaign Links</span>
              <span className="text-xs font-normal text-white/40">1-Click Copy</span>
            </h2>
            <p className="text-xs text-white/50">
              Post these exact links on Reddit or Twitter to trace every click on your live dashboard:
            </p>

            <div className="space-y-2 pt-1">
              {[
                { key: 'selfhosted', label: 'r/selfhosted Reddit Post', param: '?ref=selfhosted' },
                { key: 'webdev', label: 'r/webdev Reddit Post', param: '?ref=webdev' },
                { key: 'twitter', label: 'Twitter / X Thread', param: '?ref=twitter' },
                { key: 'direct', label: 'Clean Homepage Link', param: '' },
              ].map((c) => {
                const fullUrl = `${origin}/${c.param}`;
                const isCopied = copiedKey === c.key;
                return (
                  <div
                    key={c.key}
                    className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-xl text-xs gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white/90 truncate">{c.label}</div>
                      <div className="text-[11px] font-mono text-indigo-400 truncate">{c.param || '/ (direct)'}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(c.key, fullUrl)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg font-medium cursor-pointer transition-colors"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Visitor Feed Table */}
        <div className="p-5 rounded-2xl bg-[#12161F]/80 border border-white/10 backdrop-blur-md space-y-4">
          <h2 className="text-sm font-bold flex items-center justify-between">
            <span>Real-Time Visitor Stream</span>
            <span className="text-xs font-normal text-white/40">Recent 30 visits</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/40 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Campaign / Tag</th>
                  <th className="py-2.5 px-3">Device</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">IP (Masked)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {stats?.recentVisits && stats.recentVisits.length > 0 ? (
                  stats.recentVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3 font-mono text-white/60">{v.formattedTime}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                          v.source === 'Reddit' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                          v.source === 'Twitter / X' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                          v.source === 'Hacker News' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                          'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {v.source}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-white/60">{v.tag || 'direct'}</td>
                      <td className="py-2.5 px-3 text-white/70">{v.device || 'Desktop'}</td>
                      <td className="py-2.5 px-3 text-white/80">{v.country || 'Global'}</td>
                      <td className="py-2.5 px-3 font-mono text-white/40">{v.ipMasked || 'unknown'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-white/40">
                      Listening for live visitors...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
