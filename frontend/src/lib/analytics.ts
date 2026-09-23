// ═══════════════════════════════════════════════════
// APIFlow Studio — Lightweight In-Browser Analytics & Event Tracker
// ═══════════════════════════════════════════════════

export interface AnalyticsEvent {
  event: 'request_simulated' | 'code_copied' | 'spec_exported' | 'endpoint_created' | 'collection_created';
  properties?: Record<string, unknown>;
  timestamp: string;
}

export interface AnalyticsSummary {
  totalSimulations: number;
  totalLiveProxy: number;
  totalCodeCopies: number;
  totalExports: number;
  statusDistribution: {
    '2xx': number;
    '4xx': number;
    '5xx': number;
  };
  avgLatencyMs: number;
  firstSeen: string;
  lastActive: string;
}

const STORAGE_KEY = 'apiflow_analytics_summary';
const EVENTS_QUEUE_KEY = 'apiflow_analytics_queue';

function getInitialSummary(): AnalyticsSummary {
  const now = new Date().toISOString();
  return {
    totalSimulations: 0,
    totalLiveProxy: 0,
    totalCodeCopies: 0,
    totalExports: 0,
    statusDistribution: { '2xx': 0, '4xx': 0, '5xx': 0 },
    avgLatencyMs: 0,
    firstSeen: now,
    lastActive: now,
  };
}

export function getStoredSummary(): AnalyticsSummary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getInitialSummary();
  } catch {
    return getInitialSummary();
  }
}

function saveSummary(summary: AnalyticsSummary) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
  } catch (err) {
    console.warn('[Analytics] Failed to save summary to localStorage', err);
  }
}

// Track an event
export function trackEvent(
  event: AnalyticsEvent['event'],
  properties: Record<string, unknown> = {}
) {
  const entry: AnalyticsEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };

  const summary = getStoredSummary();
  summary.lastActive = entry.timestamp;

  if (event === 'request_simulated') {
    const mode = properties.mode as string;
    const status = (properties.status as number) || 200;
    const latency = (properties.latency as number) || 20;

    if (mode === 'live') {
      summary.totalLiveProxy += 1;
    } else {
      summary.totalSimulations += 1;
    }

    if (status >= 500) summary.statusDistribution['5xx'] += 1;
    else if (status >= 400) summary.statusDistribution['4xx'] += 1;
    else summary.statusDistribution['2xx'] += 1;

    // Recalculate average latency
    const totalRequests = summary.totalSimulations + summary.totalLiveProxy;
    summary.avgLatencyMs = Math.round(
      (summary.avgLatencyMs * (totalRequests - 1) + latency) / totalRequests
    );
  } else if (event === 'code_copied') {
    summary.totalCodeCopies += 1;
  } else if (event === 'spec_exported') {
    summary.totalExports += 1;
  }

  saveSummary(summary);

  // Send non-blocking beacon to backend /api/telemetry
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(entry)], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry', blob);
    } else {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking fallback
  }
}

// Track page visit on entry with referrer and campaign tags
export function trackPageView() {
  if (typeof window === 'undefined') return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref') || urlParams.get('utm_source') || urlParams.get('source') || '';

    const visitPayload = {
      event: 'page_view',
      referrer: document.referrer || 'direct',
      refParam,
      path: window.location.pathname,
      search: window.location.search,
      screen: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    };

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(visitPayload)], { type: 'application/json' });
      navigator.sendBeacon('/api/telemetry', blob);
    } else {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitPayload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch (err) {
    // Ignore error
  }
}

