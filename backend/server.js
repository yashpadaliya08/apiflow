const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['*'],
  exposedHeaders: ['*'],
}));

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.raw({ type: '*/*', limit: '20mb' }));

// ═══════════════════════════════════════════════════════════════
// Real-time Traffic, Visitor & Telemetry Analytics Engine
// ═══════════════════════════════════════════════════════════════

const globalStats = {
  totalPageviews: 0,
  totalEvents: 0,
  totalSimulations: 0,
  totalLiveProxy: 0,
  totalCodeCopies: 0,
  totalExports: 0,
  uniqueIps: new Set(),
  activeSessions: new Map(), // ip -> lastActiveTimestamp
  recentVisits: [], // last 100 visits
  sourceCounts: {
    Reddit: 0,
    'Twitter / X': 0,
    'Hacker News': 0,
    'Google Search': 0,
    Direct: 0,
    Other: 0,
  },
  deviceCounts: {
    Desktop: 0,
    Mobile: 0,
    Tablet: 0,
    Bot: 0,
  },
  countryCounts: {},
  campaignCounts: {},
  serverStartTime: new Date().toISOString(),
};

function maskIp(ip) {
  if (!ip) return 'unknown';
  const clean = ip.replace(/^.*:/, ''); // strip ipv6 prefix if mapped
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.***`;
  }
  return clean.substring(0, 7) + '...';
}

function parseDevice(userAgent) {
  if (!userAgent) return 'Desktop';
  const ua = userAgent.toLowerCase();
  if (/bot|crawl|spider|slurp|headless/i.test(ua)) return 'Bot';
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|android|iphone|ipod|blackberry|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function parseReferrer(rawReferrer, refParam) {
  if (refParam && typeof refParam === 'string' && refParam.trim().length > 0) {
    const p = refParam.toLowerCase().trim();
    if (p.includes('reddit') || p.includes('selfhosted') || p.includes('webdev')) {
      return { source: 'Reddit', tag: refParam, icon: 'reddit' };
    }
    if (p.includes('twitter') || p.includes('x.com') || p.includes('tweet')) {
      return { source: 'Twitter / X', tag: refParam, icon: 'twitter' };
    }
    if (p.includes('hn') || p.includes('hackernews') || p.includes('ycombinator')) {
      return { source: 'Hacker News', tag: refParam, icon: 'hackernews' };
    }
    if (p.includes('producthunt') || p.includes('ph')) {
      return { source: 'Product Hunt', tag: refParam, icon: 'producthunt' };
    }
    if (p.includes('linkedin')) {
      return { source: 'LinkedIn', tag: refParam, icon: 'linkedin' };
    }
    return { source: 'Other', tag: refParam, icon: 'tag' };
  }

  if (!rawReferrer || rawReferrer === 'direct' || rawReferrer === '') {
    return { source: 'Direct', tag: 'direct', icon: 'direct' };
  }

  try {
    const url = new URL(rawReferrer);
    const host = url.hostname.toLowerCase();
    if (host.includes('reddit.com') || host.includes('redd.it')) {
      const sub = url.pathname.includes('/r/') ? url.pathname.split('/')[2] : 'reddit';
      return { source: 'Reddit', tag: `r/${sub}`, icon: 'reddit' };
    }
    if (host.includes('twitter.com') || host.includes('t.co') || host.includes('x.com')) {
      return { source: 'Twitter / X', tag: 'feed', icon: 'twitter' };
    }
    if (host.includes('ycombinator.com')) {
      return { source: 'Hacker News', tag: 'showhn', icon: 'hackernews' };
    }
    if (host.includes('google.')) {
      return { source: 'Google Search', tag: 'organic', icon: 'google' };
    }
    if (host.includes('github.com')) {
      return { source: 'GitHub', tag: 'github', icon: 'github' };
    }
    if (host.includes('linkedin.com')) {
      return { source: 'LinkedIn', tag: 'post', icon: 'linkedin' };
    }
    return { source: 'Other', tag: host, icon: 'external' };
  } catch {
    return { source: 'Other', tag: String(rawReferrer).slice(0, 30), icon: 'external' };
  }
}

function recordVisit({ ip, userAgent, referrer, refParam, path: visitPath, country }) {
  const parsed = parseReferrer(referrer, refParam);
  const device = parseDevice(userAgent);
  const masked = maskIp(ip);
  const now = new Date();

  globalStats.totalPageviews++;
  globalStats.uniqueIps.add(ip);
  globalStats.activeSessions.set(ip, Date.now());

  // Count source
  const src = globalStats.sourceCounts[parsed.source] !== undefined ? parsed.source : 'Other';
  globalStats.sourceCounts[src] = (globalStats.sourceCounts[src] || 0) + 1;

  // Count device
  globalStats.deviceCounts[device] = (globalStats.deviceCounts[device] || 0) + 1;

  // Count campaign
  if (parsed.tag && parsed.tag !== 'direct') {
    globalStats.campaignCounts[parsed.tag] = (globalStats.campaignCounts[parsed.tag] || 0) + 1;
  }

  // Count country
  const resolvedCountry = (country && country !== 'XX' && country.length === 2) ? country.toUpperCase() : 'Global';
  globalStats.countryCounts[resolvedCountry] = (globalStats.countryCounts[resolvedCountry] || 0) + 1;

  const visitRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: now.toISOString(),
    formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    source: parsed.source,
    tag: parsed.tag,
    icon: parsed.icon,
    device,
    country: resolvedCountry,
    path: visitPath || '/',
    ipMasked: masked,
  };

  globalStats.recentVisits.unshift(visitRecord);
  if (globalStats.recentVisits.length > 100) {
    globalStats.recentVisits.pop();
  }
}

function getActiveVisitorsCount() {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  let active = 0;
  for (const [ip, lastSeen] of globalStats.activeSessions.entries()) {
    if (lastSeen >= fiveMinutesAgo) {
      active++;
    } else {
      globalStats.activeSessions.delete(ip);
    }
  }
  return Math.max(active, 1); // at least current session
}

// Telemetry & Visitor Ingestion Endpoint
app.post(['/api/telemetry', '/api/visit'], (req, res) => {
  try {
    const data = Buffer.isBuffer(req.body)
      ? JSON.parse(req.body.toString('utf8'))
      : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);

    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const country = req.headers['cf-ipcountry'] || 'Global';
    const userAgent = req.headers['user-agent'] || '';

    if (data?.event === 'page_view') {
      recordVisit({
        ip: clientIp,
        userAgent,
        referrer: data.referrer,
        refParam: data.refParam,
        path: data.path,
        country,
      });
    } else if (data?.event === 'request_simulated') {
      globalStats.totalEvents++;
      if (data.properties?.mode === 'live') globalStats.totalLiveProxy++;
      else globalStats.totalSimulations++;
      globalStats.activeSessions.set(clientIp, Date.now());
    } else if (data?.event === 'code_copied') {
      globalStats.totalEvents++;
      globalStats.totalCodeCopies++;
      globalStats.activeSessions.set(clientIp, Date.now());
    } else if (data?.event === 'spec_exported') {
      globalStats.totalEvents++;
      globalStats.totalExports++;
      globalStats.activeSessions.set(clientIp, Date.now());
    }

    res.json({ ok: true, activeVisitors: getActiveVisitorsCount() });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// JSON Stats API Endpoint
app.get('/api/stats', (req, res) => {
  res.json({
    status: 'online',
    activeVisitors: getActiveVisitorsCount(),
    uniqueVisitors: Math.max(globalStats.uniqueIps.size, 1),
    totalPageviews: globalStats.totalPageviews,
    totalSimulations: globalStats.totalSimulations,
    totalLiveProxy: globalStats.totalLiveProxy,
    totalCodeCopies: globalStats.totalCodeCopies,
    totalExports: globalStats.totalExports,
    sourceCounts: globalStats.sourceCounts,
    deviceCounts: globalStats.deviceCounts,
    campaignCounts: globalStats.campaignCounts,
    countryCounts: globalStats.countryCounts,
    recentVisits: globalStats.recentVisits.slice(0, 30),
    uptimeSeconds: Math.round(process.uptime()),
    serverStartTime: globalStats.serverStartTime,
  });
});

// Visual Admin Stats Dashboard (Served directly by Express)
app.get(['/stats', '/admin/stats'], (req, res) => {
  const host = req.get('host') || 'localhost:5000';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${host}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>APIFlow Studio — Real-Time Live Traffic & Visitor Analytics</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090B0E;
      --card-bg: rgba(18, 22, 31, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent: #6366F1;
      --accent-glow: rgba(99, 102, 241, 0.25);
      --emerald: #10B981;
      --emerald-glow: rgba(16, 185, 129, 0.2);
      --text: #F1F5F9;
      --text-muted: #94A3B8;
      --font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      background-image: 
        radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent),
        radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.08), transparent);
      color: var(--text);
      font-family: var(--font-sans);
      min-height: 100vh;
      padding: 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px var(--accent-glow);
    }
    .brand-title { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .brand-sub { font-size: 13px; color: var(--text-muted); }
    
    .status-badge {
      display: flex; align-items: center; gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px; font-weight: 600; color: #34D399;
    }
    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      backdrop-filter: blur(12px);
      transition: transform 0.2s, border-color 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .kpi-label { font-size: 13px; color: var(--text-muted); font-weight: 500; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
    .kpi-val { font-size: 32px; font-weight: 800; letter-spacing: -1px; }
    .kpi-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .kpi-active { color: #34D399; text-shadow: 0 0 20px var(--emerald-glow); }
    .kpi-accent { color: #818CF8; }

    /* Section Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    @media (max-width: 860px) { .grid-2 { grid-template-columns: 1fr; } }

    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
      backdrop-filter: blur(12px);
    }
    .panel-title {
      font-size: 15px; font-weight: 700; margin-bottom: 16px;
      display: flex; align-items: center; justify-content: space-between;
    }

    /* Referral Bars */
    .bar-row { margin-bottom: 14px; }
    .bar-meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
    .bar-name { font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .bar-track { height: 8px; background: rgba(255, 255, 255, 0.06); border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
    .fill-reddit { background: #FF4500; }
    .fill-twitter { background: #1DA1F2; }
    .fill-hn { background: #FF6600; }
    .fill-direct { background: #6366F1; }
    .fill-other { background: #A855F7; }

    /* Shareable Links Builder */
    .link-builder {
      display: flex; flex-direction: column; gap: 10px;
    }
    .link-item {
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.06);
      padding: 10px 14px; border-radius: 10px; font-size: 13px;
    }
    .link-tag { font-family: var(--font-mono); font-size: 12px; color: #818CF8; }
    .copy-btn {
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #A5B4FC;
      padding: 4px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 600; cursor: pointer;
      transition: all 0.15s;
    }
    .copy-btn:hover { background: #6366F1; color: white; }

    /* Recent Visits Table */
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 12px; color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--card-border); }
    td { padding: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
    }
    .badge-reddit { background: rgba(255, 69, 0, 0.15); color: #FF6A3D; border: 1px solid rgba(255, 69, 0, 0.3); }
    .badge-twitter { background: rgba(29, 161, 242, 0.15); color: #38BDF8; border: 1px solid rgba(29, 161, 242, 0.3); }
    .badge-hn { background: rgba(255, 102, 0, 0.15); color: #FB923C; border: 1px solid rgba(255, 102, 0, 0.3); }
    .badge-direct { background: rgba(99, 102, 241, 0.15); color: #A5B4FC; border: 1px solid rgba(99, 102, 241, 0.3); }
    .badge-device { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); border: 1px solid rgba(255, 255, 255, 0.1); }
    .time-mono { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }

    /* Controls bar */
    .controls {
      display: flex; gap: 10px; align-items: center;
    }
    .btn-refresh {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 6px 14px; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .btn-refresh:hover { background: rgba(255, 255, 255, 0.15); }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div>
          <h1 class="brand-title">APIFlow Live Traffic Monitor</h1>
          <p class="brand-sub">Real-Time Visitor Detection & Referral Intelligence</p>
        </div>
      </div>
      <div class="controls">
        <div class="status-badge">
          <span class="pulse-dot"></span>
          <span>Live Auto-Refresh (3s)</span>
        </div>
        <button class="btn-refresh" onclick="fetchStats()">↻ Refresh Now</button>
      </div>
    </header>

    <!-- Top KPIs -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Active Users Right Now <span>🟢</span></div>
        <div class="kpi-val kpi-active" id="val-active">1</div>
        <div class="kpi-sub">Active in the last 5 minutes</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Unique Visitors <span>👥</span></div>
        <div class="kpi-val" id="val-visitors">1</div>
        <div class="kpi-sub">Total unique IP addresses</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Page Views <span>👁️</span></div>
        <div class="kpi-val kpi-accent" id="val-views">1</div>
        <div class="kpi-sub">Web sessions loaded</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">API Simulations & Mocks <span>⚡</span></div>
        <div class="kpi-val" id="val-simulations">0</div>
        <div class="kpi-sub"><span id="val-proxy">0</span> live proxy calls</div>
      </div>
    </section>

    <!-- Breakdown Grid -->
    <section class="grid-2">
      <!-- Referral Breakdown -->
      <div class="panel">
        <h2 class="panel-title">
          <span>Traffic by Source</span>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">Reddit, Social, Direct</span>
        </h2>
        <div id="sources-container">
          <!-- Populated by JS -->
        </div>
      </div>

      <!-- Campaign Link Generator -->
      <div class="panel">
        <h2 class="panel-title">
          <span>Your Tagged Campaign Links</span>
          <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">1-Click Copy</span>
        </h2>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px;">
          Use these links when posting on Reddit, Twitter, or blogs to track exactly who clicks!
        </p>
        <div class="link-builder">
          <div class="link-item">
            <div>
              <strong>r/selfhosted Reddit Post</strong>
              <div class="link-tag">?ref=selfhosted</div>
            </div>
            <button class="copy-btn" onclick="copyLink('${baseUrl}/?ref=selfhosted')">Copy Link</button>
          </div>
          <div class="link-item">
            <div>
              <strong>r/webdev Reddit Post</strong>
              <div class="link-tag">?ref=webdev</div>
            </div>
            <button class="copy-btn" onclick="copyLink('${baseUrl}/?ref=webdev')">Copy Link</button>
          </div>
          <div class="link-item">
            <div>
              <strong>Twitter / X Thread</strong>
              <div class="link-tag">?ref=twitter</div>
            </div>
            <button class="copy-btn" onclick="copyLink('${baseUrl}/?ref=twitter')">Copy Link</button>
          </div>
          <div class="link-item">
            <div>
              <strong>Direct Clean URL</strong>
              <div class="link-tag">${baseUrl}/</div>
            </div>
            <button class="copy-btn" onclick="copyLink('${baseUrl}/')">Copy Link</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Visitors Feed -->
    <section class="panel">
      <h2 class="panel-title">
        <span>Real-Time Visitor Stream</span>
        <span style="font-size: 12px; color: var(--text-muted);" id="recent-count">Last 30 visits</span>
      </h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Referral Source</th>
              <th>Campaign / Tag</th>
              <th>Device</th>
              <th>Country</th>
              <th>IP (Masked)</th>
            </tr>
          </thead>
          <tbody id="visits-table-body">
            <tr>
              <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">Listening for live visitors...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    function copyLink(url) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Copied link to clipboard:\\n' + url);
      });
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();

        // Update KPIs
        document.getElementById('val-active').textContent = data.activeVisitors || 1;
        document.getElementById('val-visitors').textContent = data.uniqueVisitors || 1;
        document.getElementById('val-views').textContent = data.totalPageviews || 0;
        document.getElementById('val-simulations').textContent = (data.totalSimulations || 0) + (data.totalLiveProxy || 0);
        document.getElementById('val-proxy').textContent = data.totalLiveProxy || 0;

        // Render Referral Breakdown
        const sc = data.sourceCounts || {};
        const totalSources = Object.values(sc).reduce((a, b) => a + b, 0) || 1;
        const srcContainer = document.getElementById('sources-container');
        
        const sourceMap = [
          { name: 'Reddit', count: sc.Reddit || 0, class: 'fill-reddit', icon: '🔴' },
          { name: 'Twitter / X', count: sc['Twitter / X'] || 0, class: 'fill-twitter', icon: '🐦' },
          { name: 'Hacker News', count: sc['Hacker News'] || 0, class: 'fill-hn', icon: '🟠' },
          { name: 'Direct / Clean Link', count: sc.Direct || 0, class: 'fill-direct', icon: '🔗' },
          { name: 'Other Referrals', count: sc.Other || 0, class: 'fill-other', icon: '🌐' },
        ];

        srcContainer.innerHTML = sourceMap.map(s => {
          const pct = Math.round((s.count / totalSources) * 100);
          return \`
            <div class="bar-row">
              <div class="bar-meta">
                <span class="bar-name">\${s.icon} \${s.name}</span>
                <span style="color: var(--text-muted);"><strong>\${s.count}</strong> (\${pct}%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill \${s.class}" style="width: \${pct}%"></div>
              </div>
            </div>
          \`;
        }).join('');

        // Render Recent Visits Table
        const tbody = document.getElementById('visits-table-body');
        if (data.recentVisits && data.recentVisits.length > 0) {
          tbody.innerHTML = data.recentVisits.map(v => {
            let badgeClass = 'badge-direct';
            if (v.source === 'Reddit') badgeClass = 'badge-reddit';
            else if (v.source === 'Twitter / X') badgeClass = 'badge-twitter';
            else if (v.source === 'Hacker News') badgeClass = 'badge-hn';

            return \`
              <tr>
                <td class="time-mono">\${v.formattedTime}</td>
                <td><span class="badge \${badgeClass}">\${v.source}</span></td>
                <td><span style="font-family: var(--font-mono); font-size: 11px; color: #94A3B8;">\${v.tag || 'direct'}</span></td>
                <td><span class="badge badge-device">\${v.device || 'Desktop'}</span></td>
                <td>\${v.country || 'Global'}</td>
                <td class="time-mono" style="opacity: 0.7;">\${v.ipMasked || 'unknown'}</td>
              </tr>
            \`;
          }).join('');
        }
      } catch (err) {
        console.error('Failed to update stats:', err);
      }
    }

    // Initial fetch and 3s poll loop
    fetchStats();
    setInterval(fetchStats, 3000);
  </script>
</body>
</html>`;

  res.send(html);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'APIFlow Studio Backend & CORS Proxy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    metrics: {
      activeVisitors: getActiveVisitorsCount(),
      uniqueVisitors: globalStats.uniqueIps.size,
      totalPageviews: globalStats.totalPageviews,
      totalSimulations: globalStats.totalSimulations,
    },
  });
});

// Universal CORS Bypass Proxy
app.all('/proxy', async (req, res) => {
  const targetUrl = req.query.url || req.headers['x-target-url'];

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({
      error: 'Missing required query parameter "url" or header "x-target-url"',
      example: '/proxy?url=https://api.github.com/users/octocat',
    });
  }

  const startTime = Date.now();

  try {
    const urlObj = new URL(targetUrl);

    // Filter headers to forward
    const forwardHeaders = {};
    const prohibitedHeaders = ['host', 'connection', 'content-length', 'x-target-url'];

    for (const [key, val] of Object.entries(req.headers)) {
      if (!prohibitedHeaders.includes(key.toLowerCase()) && !key.toLowerCase().startsWith('x-forwarded')) {
        forwardHeaders[key] = val;
      }
    }

    forwardHeaders['host'] = urlObj.host;

    let bodyData = undefined;
    if (!['GET', 'HEAD'].includes(req.method.toUpperCase())) {
      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        bodyData = req.body;
      } else if (typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        bodyData = JSON.stringify(req.body);
      } else if (typeof req.body === 'string' && req.body.length > 0) {
        bodyData = req.body;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
      signal: controller.signal,
    };

    if (bodyData) {
      fetchOptions.body = bodyData;
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const latency = Date.now() - startTime;
    const responseHeaders = {};
    upstreamResponse.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const responseBuffer = await upstreamResponse.arrayBuffer();
    const buffer = Buffer.from(responseBuffer);

    // Send headers back
    res.status(upstreamResponse.status);
    for (const [k, v] of Object.entries(responseHeaders)) {
      if (!['transfer-encoding', 'content-encoding'].includes(k.toLowerCase())) {
        res.setHeader(k, v);
      }
    }
    res.setHeader('x-apiflow-latency', `${latency}ms`);
    res.setHeader('x-apiflow-proxy', 'true');

    res.send(buffer);
  } catch (err) {
    const latency = Date.now() - startTime;
    console.error('[Proxy Error]:', err.message);

    res.status(502).json({
      error: 'Proxy Gateway Error',
      message: err.message,
      targetUrl,
      latencyMs: latency,
    });
  }
});

// Middleware for recording direct page requests on root static route
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/proxy') && !req.path.includes('.')) {
    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    recordVisit({
      ip: clientIp,
      userAgent: req.headers['user-agent'] || '',
      referrer: req.headers['referer'] || req.headers['referrer'] || 'direct',
      refParam: req.query.ref || req.query.utm_source || req.query.source || '',
      path: req.path,
      country: req.headers['cf-ipcountry'] || 'Global',
    });
  }
  next();
});

// Serve frontend build if dist directory exists (Fullstack phone/PC hosting)
const distPath = path.resolve(__dirname, '../frontend/dist');

if (fs.existsSync(distPath)) {
  console.log(`[APIFlow] Serving static production frontend from ${distPath}`);
  app.use(express.static(distPath));

  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[APIFlow Studio Server] running on http://0.0.0.0:${PORT}`);
  console.log(`  - Live Stats Admin: http://localhost:${PORT}/stats`);
  console.log(`  - Health Check:     http://localhost:${PORT}/health`);
  console.log(`  - CORS Proxy:       http://localhost:${PORT}/proxy?url=https://...`);
});
