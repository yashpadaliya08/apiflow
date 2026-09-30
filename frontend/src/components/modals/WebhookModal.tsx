import React, { useState } from 'react';
import {
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Sparkles,
  History,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import { copyToClipboard, formatLatency } from '@/lib/utils';

interface WebhookPreset {
  id: string;
  provider: 'Stripe' | 'GitHub' | 'Clerk' | 'Shopify' | 'Custom';
  eventName: string;
  signatureHeader: string;
  defaultPayload: object;
}

const WEBHOOK_PRESETS: WebhookPreset[] = [
  {
    id: 'stripe-payment-succeeded',
    provider: 'Stripe',
    eventName: 'payment_intent.succeeded',
    signatureHeader: 'Stripe-Signature',
    defaultPayload: {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'pi_3MtwBwLkdIwHu7ix28a3tqPa',
          object: 'payment_intent',
          amount: 2999,
          currency: 'usd',
          status: 'succeeded',
          customer: 'cus_N638z9hX1t9M4A',
          receipt_email: 'elena.rostova@enterprise.dev',
        },
      },
    },
  },
  {
    id: 'github-pull-request',
    provider: 'GitHub',
    eventName: 'pull_request.opened',
    signatureHeader: 'X-GitHub-Event',
    defaultPayload: {
      action: 'opened',
      number: 42,
      pull_request: {
        id: 1048576,
        title: 'feat: add zero-latency synthetic mock caching',
        user: { login: 'octocat', id: 583231 },
        state: 'open',
        base: { ref: 'main' },
        head: { ref: 'feature/mock-engine' },
      },
      repository: {
        name: 'apiflow-studio',
        full_name: 'apiflow/apiflow-studio',
      },
    },
  },
  {
    id: 'clerk-user-created',
    provider: 'Clerk',
    eventName: 'user.created',
    signatureHeader: 'svix-signature',
    defaultPayload: {
      data: {
        id: 'user_2NNEqL7P4BfJ7q2',
        first_name: 'Alex',
        last_name: 'Vance',
        email_addresses: [
          { email_address: 'alex.vance@company.com', id: 'idn_12345' },
        ],
        created_at: Date.now(),
      },
      object: 'event',
      type: 'user.created',
    },
  },
  {
    id: 'shopify-order-created',
    provider: 'Shopify',
    eventName: 'orders/create',
    signatureHeader: 'X-Shopify-Topic',
    defaultPayload: {
      id: 5238749823,
      email: 'customer@store.com',
      financial_status: 'paid',
      total_price: '149.50',
      currency: 'USD',
      line_items: [
        { id: 89234, title: 'Developer Mechanical Keyboard', quantity: 1, price: '149.50' },
      ],
      created_at: new Date().toISOString(),
    },
  },
];

interface DispatchedHistory {
  id: string;
  eventName: string;
  targetUrl: string;
  status: number | null;
  latency: number;
  timestamp: string;
  responseBody: string;
  error?: string;
}

export const WebhookModal: React.FC = () => {
  const { webhookOpen, setWebhookOpen } = useUIStore();

  const [selectedPresetId, setSelectedPresetId] = useState<string>(WEBHOOK_PRESETS[0].id);
  const [targetUrl, setTargetUrl] = useState<string>('http://localhost:3000/api/webhook');
  const [signingSecret, setSigningSecret] = useState<string>('whsec_test_secret_key_88492048');
  const [payloadString, setPayloadString] = useState<string>(() =>
    JSON.stringify(WEBHOOK_PRESETS[0].defaultPayload, null, 2)
  );

  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<{
    status: number | null;
    statusText: string;
    latency: number;
    responseBody: string;
    error?: string;
  } | null>(null);

  const [history, setHistory] = useState<DispatchedHistory[]>([]);
  const [copied, setCopied] = useState(false);

  const activePreset = WEBHOOK_PRESETS.find((p) => p.id === selectedPresetId) || WEBHOOK_PRESETS[0];

  const handleSelectPreset = (preset: WebhookPreset) => {
    setSelectedPresetId(preset.id);
    setPayloadString(JSON.stringify(preset.defaultPayload, null, 2));
    setDispatchResult(null);
  };

  const handleDispatch = async () => {
    if (!targetUrl.trim() || isDispatching) return;
    setIsDispatching(true);
    setDispatchResult(null);

    const startTime = performance.now();
    try {
      // Validate JSON
      JSON.parse(payloadString);

      // Simulated signature / hash token
      const mockSignature = `t=${Math.floor(Date.now() / 1000)},v1=${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

      // Dispatch through proxy or direct fetch
      const isLocalhost = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
      const fetchUrl = isLocalhost ? targetUrl : `/proxy?url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [activePreset.signatureHeader]: mockSignature,
          'X-Webhook-Event': activePreset.eventName,
          'User-Agent': 'APIFlow-Studio-Webhook-Simulator/1.0',
        },
        body: payloadString,
      });

      const latency = Math.round(performance.now() - startTime);
      let text = '';
      try {
        text = await response.text();
      } catch {
        text = '(Empty response body)';
      }

      const resObj = {
        status: response.status,
        statusText: response.statusText,
        latency,
        responseBody: text,
      };
      setDispatchResult(resObj);

      setHistory((prev) => [
        {
          id: `wh-hist-${Date.now()}`,
          eventName: activePreset.eventName,
          targetUrl,
          status: response.status,
          latency,
          timestamp: new Date().toLocaleTimeString(),
          responseBody: text.substring(0, 200),
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      const resObj = {
        status: null,
        statusText: 'Network / Connection Error',
        latency,
        responseBody: '',
        error: err.message || 'Could not connect to webhook target endpoint.',
      };
      setDispatchResult(resObj);

      setHistory((prev) => [
        {
          id: `wh-hist-${Date.now()}`,
          eventName: activePreset.eventName,
          targetUrl,
          status: null,
          latency,
          timestamp: new Date().toLocaleTimeString(),
          responseBody: '',
          error: err.message,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyPayload = async () => {
    await copyToClipboard(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      isOpen={webhookOpen}
      onClose={() => setWebhookOpen(false)}
      title="Simulated Webhook Dispatcher & Event Receiver"
      description="Simulate incoming webhook events from Stripe, GitHub, Clerk, and Shopify directly to your local backend handler."
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Preset Providers Segmented Row */}
        <div className="space-y-1.5">
          <label className="font-semibold text-white/70 block">Select Webhook Event Blueprint</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEBHOOK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  selectedPresetId === preset.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#0C0E12] border-[#2A2F45] text-white/70 hover:bg-[#1C2030] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>{preset.provider}</span>
                </div>
                <div className="font-mono text-[10px] text-white/50 truncate mt-0.5">
                  {preset.eventName}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Target URL and Secret */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold text-white/70">Webhook Target Endpoint URL</label>
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="e.g. http://localhost:3000/api/webhook"
              className="w-full bg-[#0C0E12] border border-[#2A2F45] rounded-md px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-white/70">Signing Secret Key</label>
            <input
              type="password"
              value={signingSecret}
              onChange={(e) => setSigningSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full bg-[#0C0E12] border border-[#2A2F45] rounded-md px-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Payload Editor Header & Actions */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white/70 flex items-center gap-2">
              <span>Event JSON Payload</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1C2030] text-indigo-400 rounded">
                Header: {activePreset.signatureHeader}
              </span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPayload}
                className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPayloadString(JSON.stringify(activePreset.defaultPayload, null, 2))}
                className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Reset payload to template default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={payloadString}
            onChange={(e) => setPayloadString(e.target.value)}
            className="w-full bg-[#0C0E12] border border-[#2A2F45] rounded-md p-3 font-mono text-xs text-indigo-200/90 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Dispatch Button & Result Display */}
        <div className="pt-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/40">
              Dispatches POST request with computed signature headers to verify local consumer handlers.
            </span>

            <Button
              variant="accent"
              size="md"
              onClick={handleDispatch}
              isLoading={isDispatching}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="px-5 font-semibold"
            >
              Dispatch Webhook
            </Button>
          </div>

          {/* Live Dispatch Result Card */}
          {dispatchResult && (
            <div
              className={`p-3 rounded-lg border flex flex-col gap-2 ${
                dispatchResult.status && dispatchResult.status >= 200 && dispatchResult.status < 300
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2">
                  {dispatchResult.status && dispatchResult.status >= 200 && dispatchResult.status < 300 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="font-bold">
                    {dispatchResult.status ? `${dispatchResult.status} ${dispatchResult.statusText}` : 'Delivery Failed'}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-white/60">
                  <Clock className="w-3 h-3 text-white/40" />
                  <span>{formatLatency(dispatchResult.latency)}</span>
                </div>
              </div>

              {dispatchResult.error ? (
                <div className="text-[11px] text-red-300 font-mono bg-black/30 p-2 rounded">
                  {dispatchResult.error}
                </div>
              ) : (
                <div className="text-[11px] font-mono text-white/80 bg-black/30 p-2 rounded max-h-24 overflow-y-auto">
                  {dispatchResult.responseBody || '(Handler returned empty response body)'}
                </div>
              )}
            </div>
          )}

          {/* Recent Dispatch History */}
          {history.length > 0 && (
            <div className="pt-2 border-t border-[#2A2F45]/60 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/40 uppercase">
                <History className="w-3 h-3 text-amber-400" />
                <span>Recent Webhook Dispatches</span>
              </div>

              <div className="space-y-1 max-h-28 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-1.5 bg-[#0C0E12] border border-[#2A2F45] rounded flex items-center justify-between font-mono text-[10px]"
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      <span
                        className={`px-1.5 py-0.2 rounded font-bold ${
                          h.status && h.status >= 200 && h.status < 300
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {h.status || 'ERR'}
                      </span>
                      <span className="text-white/80">{h.eventName}</span>
                      <span className="text-white/40 truncate">{h.targetUrl}</span>
                    </div>
                    <span className="text-white/40 flex-shrink-0">{h.latency}ms • {h.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
