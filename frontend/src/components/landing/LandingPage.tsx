import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  Layers,
  Sparkles,
  Laptop,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Globe,
  Database,
  Radio,
  Check,
  AlertCircle,
  RefreshCw,
  Sliders,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LandingPageProps {
  onLaunchStudio: () => void;
}

type DemoScene = 'mock' | 'assertions' | 'webhooks' | 'pwa';

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  // Demo player state
  const [activeScene, setActiveScene] = useState<DemoScene>('mock');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [demoStatus, setDemoStatus] = useState<number>(200);

  // Assertion simulation toggles
  const [assertionFailScenario, setAssertionFailScenario] = useState<boolean>(false);

  // Webhook dispatch simulation state
  const [webhookSent, setWebhookSent] = useState<boolean>(false);
  const [webhookProvider, setWebhookProvider] = useState<'stripe' | 'github' | 'clerk'>('stripe');

  // Auto-play timeline for the interactive video tour
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next scene
          setActiveScene((current) => {
            if (current === 'mock') return 'assertions';
            if (current === 'assertions') return 'webhooks';
            if (current === 'webhooks') return 'pwa';
            return 'mock';
          });
          return 0;
        }
        return prev + 2.5; // ~4 seconds per scene
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSceneSelect = (scene: DemoScene) => {
    setActiveScene(scene);
    setProgress(0);
  };

  const handleTriggerWebhook = () => {
    setWebhookSent(true);
    setTimeout(() => setWebhookSent(false), 2200);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0C0E12] text-white selection:bg-indigo-500/30 scroll-smooth relative bg-grid-pattern">
      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section className="relative px-4 sm:px-6 pt-14 pb-16 max-w-6xl mx-auto text-center">
        {/* Ambient Animated Glow Orbs */}
        <div className="absolute top-8 left-1/3 -translate-x-1/2 w-[550px] h-[360px] bg-gradient-to-tr from-indigo-600/25 via-purple-600/20 to-cyan-500/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-orb-1" />
        <div className="absolute top-16 right-1/4 w-[450px] h-[320px] bg-gradient-to-bl from-cyan-500/20 via-indigo-500/20 to-pink-500/15 blur-[110px] rounded-full pointer-events-none -z-10 animate-orb-2" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="relative overflow-hidden inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C2030]/90 border border-[#2A2F45] text-xs text-indigo-300 shadow-lg shadow-indigo-950/40 backdrop-blur-md">
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-beam pointer-events-none" />
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Standalone Browser-First API Studio & Test Engine</span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Laptop className="w-3.5 h-3.5" />
            <span>Installable Offline Desktop App</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Design, Test & Validate APIs.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 animate-gradient-text font-black">
            100% Client-Side.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
          Simulate realistic REST APIs directly inside your browser. Build visual schema assertions with zero code, dispatch simulated webhooks to your local server, and install as an offline desktop PWA with zero memory bloat.
        </p>

        {/* Hero CTA Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            variant="accent"
            onClick={onLaunchStudio}
            leftIcon={<Play className="w-4 h-4 fill-white" />}
            className="text-sm px-6 py-3 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] transition-all duration-300 shrink-0"
          >
            Launch Studio Free
          </Button>

          <a
            href="#interactive-demo"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#141720]/90 hover:bg-[#1C2030] border border-[#2A2F45] hover:border-indigo-500/40 text-sm text-white/80 hover:text-white transition-all duration-300 hover:scale-[1.02] shrink-0"
          >
            <span>Watch Interactive Tour</span>
            <ArrowRight className="w-4 h-4 text-indigo-400" />
          </a>
        </div>

        {/* ══════════════════════════════════════════════════════════
            INTERACTIVE VIDEO TOUR / SIMULATED STUDIO SHOWCASE
        ══════════════════════════════════════════════════════════ */}
        <div
          id="interactive-demo"
          className="mt-14 max-w-5xl mx-auto text-left rounded-2xl border border-[#2A2F45] hover:border-indigo-500/40 bg-[#141720]/95 backdrop-blur-xl shadow-2xl shadow-indigo-950/30 overflow-hidden scroll-mt-6 transition-all duration-300"
        >
          {/* Showcase Control Bar */}
          <div className="px-4 py-3 bg-[#1C2030]/80 border-b border-[#2A2F45] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono font-medium text-white/70">
                APIFlow Live Studio Tour
              </span>
            </div>

            {/* Scrubber / Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0C0E12] hover:bg-white/10 border border-[#2A2F45] text-xs text-white/80 transition-colors"
                title={isPlaying ? 'Pause Auto Tour' : 'Play Auto Tour'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 text-amber-400" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>Play Tour</span>
                  </>
                )}
              </button>

              <Button size="xs" variant="primary" onClick={onLaunchStudio}>
                Open Studio
              </Button>
            </div>
          </div>

          {/* Timeline Tab Scrubber */}
          <div className="grid grid-cols-2 md:grid-cols-4 bg-[#0C0E12] border-b border-[#2A2F45] text-xs select-none">
            <button
              onClick={() => handleSceneSelect('mock')}
              className={`p-2.5 text-left transition-all border-r border-[#2A2F45] relative ${
                activeScene === 'mock'
                  ? 'bg-indigo-600/10 text-indigo-300 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">1. Instant Mock Engine</span>
              </div>
              <div className="text-[10px] text-white/40 truncate">Faker heuristics & status codes</div>
              {activeScene === 'mock' && isPlaying && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>

            <button
              onClick={() => handleSceneSelect('assertions')}
              className={`p-2.5 text-left transition-all border-r border-[#2A2F45] relative ${
                activeScene === 'assertions'
                  ? 'bg-emerald-600/10 text-emerald-300 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">2. Visual Test Builder</span>
              </div>
              <div className="text-[10px] text-white/40 truncate">No-code schema assertions</div>
              {activeScene === 'assertions' && isPlaying && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>

            <button
              onClick={() => handleSceneSelect('webhooks')}
              className={`p-2.5 text-left transition-all border-r border-[#2A2F45] relative ${
                activeScene === 'webhooks'
                  ? 'bg-rose-600/10 text-rose-300 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate">3. Webhook Dispatcher</span>
              </div>
              <div className="text-[10px] text-white/40 truncate">Stripe, GitHub, Clerk events</div>
              {activeScene === 'webhooks' && isPlaying && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-rose-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>

            <button
              onClick={() => handleSceneSelect('pwa')}
              className={`p-2.5 text-left transition-all relative ${
                activeScene === 'pwa'
                  ? 'bg-purple-600/10 text-purple-300 font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Laptop className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate">4. Offline Desktop PWA</span>
              </div>
              <div className="text-[10px] text-white/40 truncate">Borderless offline window</div>
              {activeScene === 'pwa' && isPlaying && (
                <div
                  className="absolute bottom-0 left-0 h-0.5 bg-purple-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              )}
            </button>
          </div>

          {/* ── Scene 1: Instant Mock Engine ── */}
          {activeScene === 'mock' && (
            <div key="mock" className="animate-fade-in p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#2A2F45]">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-semibold">
                    Simulated Request
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/40 font-mono">Status Scenario:</span>
                    <select
                      value={demoStatus}
                      onChange={(e) => setDemoStatus(Number(e.target.value))}
                      className="bg-[#0C0E12] border border-[#2A2F45] text-xs font-mono text-indigo-300 rounded px-2 py-0.5 focus:outline-none"
                    >
                      <option value={200}>200 OK</option>
                      <option value={201}>201 Created</option>
                      <option value={400}>400 Bad Request</option>
                      <option value={401}>401 Unauthorized</option>
                      <option value={404}>404 Not Found</option>
                      <option value={500}>500 Server Error</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45] space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      GET
                    </span>
                    <span className="text-white font-medium">/api/v1/users/usr_982</span>
                  </div>
                  <div className="text-[11px] text-white/50 space-y-1 font-mono">
                    <div>Host: <span className="text-white/80">api.enterprise.dev</span></div>
                    <div>Authorization: <span className="text-indigo-400">Bearer eyJhbGciOi...</span></div>
                    <div>Accept: <span className="text-white/80">application/json</span></div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-white/70 space-y-1">
                  <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Realistic Synthetic Heuristics</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Generates realistic names, UUIDs, ISO timestamps, and nested objects using in-browser Faker algorithms without making a single external network request.
                  </p>
                </div>
              </div>

              {/* Right: Response Sandbox */}
              <div className="md:pl-4 space-y-3 pt-3 md:pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        demoStatus >= 200 && demoStatus < 300
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {demoStatus} {demoStatus === 200 ? 'OK' : demoStatus === 201 ? 'Created' : 'Error'}
                    </span>
                    <span className="text-white/40 text-[11px] font-mono">⚡ 18ms • 1.2 KB</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
                    Mock Engine Active
                  </span>
                </div>

                <pre className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45] text-white/80 text-xs font-mono leading-relaxed overflow-x-auto max-h-56">
                  {demoStatus === 200 &&
                    JSON.stringify(
                      {
                        id: 'usr_982',
                        name: 'Elena Rostova',
                        email: 'elena@enterprise.dev',
                        role: 'Senior Architect',
                        active: true,
                        lastLogin: '2026-09-30T14:20:00Z',
                      },
                      null,
                      2
                    )}
                  {demoStatus === 201 &&
                    JSON.stringify(
                      {
                        id: 'usr_8491',
                        status: 'created',
                        message: 'Resource provisioned successfully',
                        createdAt: new Date().toISOString(),
                      },
                      null,
                      2
                    )}
                  {demoStatus === 400 &&
                    JSON.stringify(
                      {
                        statusCode: 400,
                        error: 'Bad Request',
                        message: 'Invalid email parameter format',
                      },
                      null,
                      2
                    )}
                  {demoStatus === 401 &&
                    JSON.stringify(
                      {
                        statusCode: 401,
                        error: 'Unauthorized',
                        message: 'Missing or expired Bearer token in Authorization header',
                      },
                      null,
                      2
                    )}
                  {demoStatus === 404 &&
                    JSON.stringify(
                      {
                        statusCode: 404,
                        error: 'Not Found',
                        message: 'User with identifier usr_982 does not exist',
                      },
                      null,
                      2
                    )}
                  {demoStatus === 500 &&
                    JSON.stringify(
                      {
                        statusCode: 500,
                        error: 'Internal Server Error',
                        message: 'Simulated downstream upstream timeout',
                      },
                      null,
                      2
                    )}
                </pre>
              </div>
            </div>
          )}

          {/* ── Scene 2: Visual Schema Assertions & Test Builder ── */}
          {activeScene === 'assertions' && (
            <div key="assertions" className="animate-fade-in p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2A2F45]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {assertionFailScenario ? '3/4 Passed (1 Failed)' : '4/4 Passed (100%)'}
                  </span>
                  <span className="text-xs text-white/50">Zero-code Postman test replacement</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Simulate scenario:</span>
                  <button
                    onClick={() => setAssertionFailScenario(!assertionFailScenario)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                      assertionFailScenario
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {assertionFailScenario ? 'Toggle Normal (All Pass)' : 'Toggle Latency Spike (Fail)'}
                  </button>
                </div>
              </div>

              {/* Assertion Rows */}
              <div className="space-y-2">
                {/* Assertion 1 */}
                <div className="p-2.5 rounded-lg bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <span className="text-white/80">Status Code equals 200</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">Pass • actual: 200</span>
                </div>

                {/* Assertion 2 */}
                <div
                  className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between text-xs ${
                    assertionFailScenario
                      ? 'bg-red-950/20 border-red-500/40 text-red-200'
                      : 'bg-[#0C0E12] border-[#2A2F45]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center font-bold ${
                        assertionFailScenario
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {assertionFailScenario ? '✕' : '✓'}
                    </span>
                    <span className="text-white/80">Latency (ms) less than 250ms</span>
                  </div>
                  <span
                    className={`font-mono text-[11px] ${
                      assertionFailScenario ? 'text-red-400 font-semibold' : 'text-emerald-400'
                    }`}
                  >
                    {assertionFailScenario
                      ? 'Fail • actual: 412ms (> 250ms)'
                      : 'Pass • actual: 24ms (< 250ms)'}
                  </span>
                </div>

                {/* Assertion 3 */}
                <div className="p-2.5 rounded-lg bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <span className="text-white/80">JSON body.data.id is valid UUID</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">Pass • valid format</span>
                </div>

                {/* Assertion 4 */}
                <div className="p-2.5 rounded-lg bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      ✓
                    </span>
                    <span className="text-white/80">Header Content-Type contains "application/json"</span>
                  </div>
                  <span className="text-emerald-400 font-mono text-[11px]">Pass • application/json; charset=utf-8</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-white/70 flex items-center justify-between">
                <span>
                  No <code className="text-emerald-300">pm.test()</code> JavaScript boilerplate needed. Build assertions visually in 1 click.
                </span>
                <Button size="xs" variant="primary" onClick={onLaunchStudio}>
                  Try In Studio
                </Button>
              </div>
            </div>
          )}

          {/* ── Scene 3: Simulated Webhook Dispatcher ── */}
          {activeScene === 'webhooks' && (
            <div key="webhooks" className="animate-fade-in p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">Provider preset:</span>
                  {(['stripe', 'github', 'clerk'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setWebhookProvider(p)}
                      className={`px-2.5 py-1 rounded text-xs font-mono capitalize transition-colors ${
                        webhookProvider === p
                          ? 'bg-rose-500 text-white font-semibold'
                          : 'bg-[#0C0E12] border border-[#2A2F45] text-white/60 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="accent"
                  onClick={handleTriggerWebhook}
                  leftIcon={<Radio className={`w-3.5 h-3.5 ${webhookSent ? 'animate-ping' : ''}`} />}
                  className="bg-rose-600 hover:bg-rose-500 border-rose-500"
                >
                  {webhookSent ? 'Dispatched!' : 'Dispatch Webhook'}
                </Button>
              </div>

              {/* Webhook Configuration Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45] space-y-2">
                  <div className="text-white/40 text-[11px]">TARGET HANDLER URL</div>
                  <div className="text-white font-medium truncate">http://localhost:3000/api/webhooks</div>
                  <div className="text-white/40 text-[11px] pt-1">SIMULATED HEADERS</div>
                  <div className="text-rose-400 text-[11px] truncate">
                    {webhookProvider === 'stripe' && 'Stripe-Signature: t=169548293,v1=9e8b...'}
                    {webhookProvider === 'github' && 'X-Hub-Signature-256: sha256=4f8a...'}
                    {webhookProvider === 'clerk' && 'svix-signature: v1,g0hM9+...'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">SIMULATED PAYLOAD</span>
                    <span className="text-emerald-400">
                      {webhookSent ? '✓ Received (200 OK)' : 'Ready to Send'}
                    </span>
                  </div>
                  <pre className="text-white/70 text-[11px] overflow-x-auto max-h-24">
                    {webhookProvider === 'stripe' &&
                      JSON.stringify(
                        {
                          id: 'evt_3MtwfyLkd5hx427S0Wx52Xbv',
                          type: 'payment_intent.succeeded',
                          data: { amount: 4900, currency: 'usd' },
                        },
                        null,
                        2
                      )}
                    {webhookProvider === 'github' &&
                      JSON.stringify(
                        {
                          event: 'push',
                          ref: 'refs/heads/main',
                          commits: [{ message: 'feat: add webhooks' }],
                        },
                        null,
                        2
                      )}
                    {webhookProvider === 'clerk' &&
                      JSON.stringify(
                        {
                          type: 'user.created',
                          data: { id: 'user_2N9... ', email: 'dev@apiflow.dev' },
                        },
                        null,
                        2
                      )}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-white/70 flex items-center justify-between">
                <span>
                  No ngrok tunnels or 3rd-party webhook web services required. Test local webhook consumers immediately.
                </span>
                <Button size="xs" variant="primary" onClick={onLaunchStudio}>
                  Open Webhook Studio
                </Button>
              </div>
            </div>
          )}

          {/* ── Scene 4: Installable Desktop PWA ── */}
          {activeScene === 'pwa' && (
            <div key="pwa" className="animate-fade-in p-4 sm:p-6 space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1C2030] to-[#0C0E12] border border-[#2A2F45] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-semibold">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Progressive Web App (PWA)</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    Runs in its own borderless window. 100% offline.
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    With an integrated Service Worker cache and Dexie IndexedDB, APIFlow launches in under 100ms on Windows, macOS, Linux, and Android with zero Electron memory bloat.
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <Button
                    size="md"
                    variant="accent"
                    onClick={() => {
                      alert('To install APIFlow Studio as an app, click the Install icon in your browser address bar.');
                    }}
                    leftIcon={<Laptop className="w-4 h-4" />}
                    className="bg-purple-600 hover:bg-purple-500 border-purple-500 whitespace-nowrap"
                  >
                    Install Desktop App
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onLaunchStudio}>
                    Open in Browser
                  </Button>
                </div>
              </div>

              {/* Specs Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45]">
                  <div className="text-xl font-bold text-emerald-400 font-mono">0 MB</div>
                  <div className="text-white/50 text-[11px] mt-1">Download Size (Instant PWA)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45]">
                  <div className="text-xl font-bold text-indigo-400 font-mono">100%</div>
                  <div className="text-white/50 text-[11px] mt-1">Offline Capability (No Wi-Fi Needed)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#0C0E12] border border-[#2A2F45]">
                  <div className="text-xl font-bold text-purple-400 font-mono">&lt; 80ms</div>
                  <div className="text-white/50 text-[11px] mt-1">Cold Launch Speed</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* ══════════════════════════════════════════════════════════
          FEATURE GRID (Replaced Self-Hosting with Offline PWA)
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="relative px-4 sm:px-6 py-20 max-w-6xl mx-auto scroll-mt-14">
        {/* Subtle Ambient Section Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none -z-10 animate-orb-1" />

        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs font-semibold text-indigo-400 mb-3">
            <Zap className="w-3.5 h-3.5" />
            <span>High-Velocity Engineering</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Built for Modern High-Speed Engineering Workflows
          </h2>
          <p className="mt-3 text-sm text-white/50 leading-relaxed">
            Everything you need to test, mock, document, and validate client APIs with complete browser autonomy and zero vendor lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glow-card group p-6 rounded-xl bg-[#141720]/90 border border-[#2A2F45] backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">Schema Synthetic Engine</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Powered by <code className="text-indigo-300">@faker-js/faker</code> with field heuristics. Automatically populates UUIDs, emails, avatars, timestamps, and realistic enterprise mock payloads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glow-card glow-card-emerald group p-6 rounded-xl bg-[#141720]/90 border border-[#2A2F45] backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">Visual Schema Assertions</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              1-click test builder for Status, Response Latency, Header verification, and nested JSON body types. Pass/fail badges appear live in your response viewer.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glow-card glow-card-rose group p-6 rounded-xl bg-[#141720]/90 border border-[#2A2F45] backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-rose-300 transition-colors">Simulated Webhook Dispatcher</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Built-in event studio simulating Stripe, GitHub, Clerk, and Shopify webhooks with cryptographic HMAC headers directly to your local handler.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glow-card glow-card-cyan group p-6 rounded-xl bg-[#141720]/90 border border-[#2A2F45] backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-cyan-300 transition-colors">Dual Execution Mode</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Switch effortlessly between instant client-side mock simulation (15–40ms latency) and live network execution via the built-in CORS bypass proxy.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glow-card glow-card-orange group p-6 rounded-xl bg-[#141720]/90 border border-[#2A2F45] backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-orange-300 transition-colors">Contract Portability</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Full import and export support for official OpenAPI 3.1.0 specifications and Postman Collection v2.1. Zero vendor lock-in.
            </p>
          </div>

          {/* Card 6: Offline Desktop PWA */}
          <div className="glow-card glow-card-purple group p-6 rounded-xl bg-[#141720]/90 border border-[#2A2F45] backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Laptop className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">Offline Desktop PWA</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Install in 1 click from Chrome, Edge, or Brave. Runs in its own standalone borderless window with 100% offline capability and zero Electron memory footprint.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DEEP DIVE: VISUAL SCHEMA ASSERTIONS BUILDER
      ══════════════════════════════════════════════════════════ */}
      <section
        id="assertions-preview"
        className="relative px-4 sm:px-6 py-20 max-w-6xl mx-auto border-t border-[#2A2F45]/60 scroll-mt-14"
      >
        {/* Subtle Ambient Section Glow */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-orb-2" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automated QA Badges</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Visual Schema Assertions & Test Builder
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Postman forces developers to write boilerplate JavaScript tests like{' '}
              <code className="text-indigo-300">pm.test("status is 200", ...)</code>. APIFlow introduces a 1-click visual assertion builder with zero syntax errors.
            </p>

            <ul className="space-y-2.5 text-xs text-white/70 font-mono">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>Status equals 200 / 201 / 204</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>Response Time &lt; 250ms</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>body.data.id is a valid UUID / String</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                  ✓
                </span>
                <span>body.items has length &gt; 0</span>
              </li>
            </ul>

            <div className="pt-2">
              <Button size="md" variant="accent" onClick={onLaunchStudio} leftIcon={<Play className="w-4 h-4" />}>
                Build Visual Tests Now
              </Button>
            </div>
          </div>

          {/* Graphic Preview */}
          <div className="glow-card glow-card-emerald p-5 rounded-2xl bg-[#141720]/95 backdrop-blur-md border border-emerald-500/30 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F45]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-white/60 text-[11px]">TEST SUITE BREAKDOWN</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                100% PASS RATE (4/4)
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">PASS</span>
                  <span className="text-white/80">Status equals 200</span>
                </div>
                <span className="text-white/40">200 === 200</span>
              </div>

              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">PASS</span>
                  <span className="text-white/80">Latency &lt; 250ms</span>
                </div>
                <span className="text-emerald-400 font-bold">18ms</span>
              </div>

              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">PASS</span>
                  <span className="text-white/80">body.data.id is UUID</span>
                </div>
                <span className="text-white/40">RFC 4122 Compliant</span>
              </div>

              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">PASS</span>
                  <span className="text-white/80">Header Content-Type contains JSON</span>
                </div>
                <span className="text-white/40">application/json</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DEEP DIVE: SIMULATED WEBHOOK DISPATCHER
      ══════════════════════════════════════════════════════════ */}
      <section
        id="webhooks-preview"
        className="relative px-4 sm:px-6 py-20 max-w-6xl mx-auto border-t border-[#2A2F45]/60 scroll-mt-14"
      >
        {/* Subtle Ambient Section Glow */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 w-80 h-80 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none -z-10 animate-orb-1" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Graphic */}
          <div className="glow-card glow-card-rose p-5 rounded-2xl bg-[#141720]/95 backdrop-blur-md border border-rose-500/30 shadow-xl space-y-3 font-mono text-xs order-2 lg:order-1">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2F45]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-rose-400 text-[11px] font-bold">WEBHOOK STUDIO RUNNER</span>
              </div>
              <span className="text-white/40 text-[11px]">Provider: Stripe</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45]">
                <div className="text-white/40 mb-1">EVENT TYPE</div>
                <div className="text-emerald-400 font-bold">payment_intent.succeeded</div>
              </div>

              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45]">
                <div className="text-white/40 mb-1">TARGET HANDLER</div>
                <div className="text-white/90">POST http://localhost:3000/api/webhooks/stripe</div>
              </div>

              <div className="p-2.5 rounded bg-[#0C0E12] border border-[#2A2F45]">
                <div className="text-white/40 mb-1">HMAC SIGNATURE</div>
                <div className="text-rose-400 truncate">Stripe-Signature: t=169548293,v1=9e8bf0...</div>
              </div>
            </div>
          </div>

          {/* Right Copy */}
          <div className="space-y-4 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400">
              <Radio className="w-3.5 h-3.5" />
              <span>Event-Driven Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Simulated Webhook Dispatcher & Receiver
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Modern APIs like Stripe, GitHub, Clerk, and Shopify rely heavily on webhooks. Traditionally, developers have had to setup ngrok tunnels or fake webhook relays just to trigger events locally.
            </p>
            <p className="text-xs text-white/50 leading-relaxed">
              With APIFlow Webhook Studio, select your event preset, customize the payload, and click "Dispatch Webhook" to send it straight to your backend listener with live latency and response status monitoring.
            </p>

            <div className="pt-2">
              <Button size="md" variant="accent" onClick={onLaunchStudio} leftIcon={<Radio className="w-4 h-4" />}>
                Launch Webhook Studio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DEEP DIVE: INSTALLABLE OFFLINE DESKTOP PWA
      ══════════════════════════════════════════════════════════ */}
      <section
        id="offline-desktop"
        className="relative px-4 sm:px-6 py-20 max-w-6xl mx-auto border-t border-[#2A2F45]/60 scroll-mt-14"
      >
        <div className="glow-card glow-card-purple p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#182030] via-[#141720] to-[#0C0E12] border border-purple-500/30 relative overflow-hidden">
          {/* Internal ambient orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/15 blur-[100px] rounded-full pointer-events-none animate-orb-2" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none animate-orb-1" />

          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
              <Laptop className="w-4 h-4" />
              <span>Installable Desktop Tool</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Installable PWA — 100% Offline Desktop Tool
            </h2>
            <p className="text-sm text-white/60 leading-relaxed">
              Matches the desktop feel of Postman without the 500MB download size or memory bloat. APIFlow runs in its own borderless window on Windows, Mac, Linux, and Android, working 100% offline without needing an active internet connection.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Zero Electron memory bloat</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Works on flights & offline setups</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Service Worker static asset caching</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>IndexedDB browser-local persistence</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Button
                size="md"
                variant="accent"
                onClick={() => {
                  alert('To install APIFlow Studio as an app, click the Install icon in your browser address bar (Chrome, Edge, Brave).');
                }}
                leftIcon={<Laptop className="w-4 h-4" />}
                className="bg-purple-600 hover:bg-purple-500 border-purple-500"
              >
                Install Desktop PWA
              </Button>
              <Button size="md" variant="outline" onClick={onLaunchStudio}>
                Open Web Studio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          OPEN DESIGN MANIFESTO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section id="open-design" className="relative px-4 sm:px-6 py-20 max-w-6xl mx-auto border-t border-[#2A2F45]/60 scroll-mt-14">
        {/* Subtle Ambient Section Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none -z-10 animate-orb-2" />

        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-4 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The Open Design Manifesto</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Developer Tools Belong to Developers
          </h2>
          <p className="mt-4 text-sm sm:text-base text-white/60 leading-relaxed">
            Open Design is the philosophy and practice of making the design of products, systems, and developer tools completely transparent, accessible, interoperable, and free from proprietary lock-in.
          </p>
          <p className="mt-2 text-xs sm:text-sm text-indigo-300/80">
            Just as Open Source revolutionized code by rejecting closed binary executables, Open Design rejects closed user experiences, proprietary cloud silos, and artificial feature gating.
          </p>
        </div>

        {/* Traditional Closed vs Open Design Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Closed Design */}
          <div className="glow-card p-6 rounded-2xl bg-[#141720]/90 backdrop-blur-sm border border-red-500/25 hover:border-red-500/50 relative">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#2A2F45]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <h3 className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider">
                Traditional "Closed" Design
              </h3>
            </div>
            <ul className="mt-4 space-y-3 font-mono text-xs text-white/60">
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold">✕</span>
                <span>Proprietary file formats & cloud-only collections</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold">✕</span>
                <span>Forced cloud login & mandatory account lock-in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold">✕</span>
                <span>Vendor hoards your API keys, headers, and payload telemetry</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold">✕</span>
                <span>"Black box" mock server billing and artificial limits</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold">✕</span>
                <span>Opaque closed design system</span>
              </li>
            </ul>
          </div>

          {/* Open Design */}
          <div className="glow-card glow-card-emerald p-6 rounded-2xl bg-gradient-to-b from-[#182030] to-[#121622] border border-emerald-500/40 relative shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#2A2F45]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Open Design (APIFlow)
              </h3>
            </div>
            <ul className="mt-4 space-y-3 font-mono text-xs text-white/90">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Open standard specs (OpenAPI 3.1.0, Postman v2.1, cURL)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Local-first, zero login or registration required</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>User owns 100% of data (persisted securely in IndexedDB)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>In-browser client-side simulation (0–40ms latency, zero fees)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Transparent tokens, open primitives, and full exportability</span>
              </li>
            </ul>
          </div>
        </div>

        {/* The 4 Core Tenets Grid */}
        <div className="space-y-4">
          <h3 className="text-center font-bold text-xl text-white mb-6">
            The 4 Core Tenets of Open Design in APIFlow
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tenet 1 */}
            <div className="glow-card group p-5 rounded-xl bg-[#141720]/90 backdrop-blur-sm border border-[#2A2F45] space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center font-mono group-hover:scale-110 transition-transform">
                  1
                </span>
                <span className="group-hover:text-indigo-300 transition-colors">Zero Vendor Lock-in (Universal Interoperability)</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                In closed tools, your work is trapped behind proprietary cloud sync. In APIFlow, every artifact uses universally accepted open standards: export/import OpenAPI 3.1.0 and Postman v2.1.0 JSON, ingest cURL, or export clean TypeScript, Axios, and Python code.
              </p>
            </div>

            {/* Tenet 2 */}
            <div className="glow-card glow-card-emerald group p-5 rounded-xl bg-[#141720]/90 backdrop-blur-sm border border-[#2A2F45] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-mono group-hover:scale-110 transition-transform">
                  2
                </span>
                <span className="group-hover:text-emerald-300 transition-colors">Local-First & Data Sovereignty</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                You are the sovereign owner of your data. 100% of collections, drafts, environments, and execution history are stored on your machine in IndexedDB (Dexie.js). No enterprise API secrets or headers are ever uploaded to a remote cloud database.
              </p>
            </div>

            {/* Tenet 3 */}
            <div className="glow-card glow-card-cyan group p-5 rounded-xl bg-[#141720]/90 backdrop-blur-sm border border-[#2A2F45] space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 text-xs flex items-center justify-center font-mono group-hover:scale-110 transition-transform">
                  3
                </span>
                <span className="group-hover:text-cyan-300 transition-colors">Ephemeral, Frictionless Sharing</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                No sign-up walls. Using URL-safe UTF-8 base64 state (<code className="text-cyan-300">?mock=...</code>), an interactive mock is compressed directly into the URL query. When a teammate opens the link, the browser engine recreates the mock state immediately with zero login.
              </p>
            </div>

            {/* Tenet 4 */}
            <div className="glow-card glow-card-purple group p-5 rounded-xl bg-[#141720]/90 backdrop-blur-sm border border-[#2A2F45] space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-mono group-hover:scale-110 transition-transform">
                  4
                </span>
                <span className="group-hover:text-purple-300 transition-colors">Design Systems as Shared Public Infrastructure</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                UI components, tokens, and interactions are built as open, reusable building blocks (Tailwind, Radix primitives, Lucide icons). APIFlow is fully modular, transparent, accessible, and easily forkable or extensible by the developer community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════ */}
      <footer className="px-4 sm:px-6 py-12 border-t border-[#2A2F45]/50 text-center text-xs text-white/40 space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-4 text-white/60">
          <a href="#interactive-demo" className="hover:text-white transition-colors">
            Interactive Tour
          </a>
          <span>•</span>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <span>•</span>
          <a href="#assertions-preview" className="hover:text-white transition-colors">
            Test Builder
          </a>
          <span>•</span>
          <a href="#webhooks-preview" className="hover:text-white transition-colors">
            Webhooks
          </a>
          <span>•</span>
          <a href="#offline-desktop" className="hover:text-white transition-colors">
            Desktop PWA
          </a>
        </div>

        {/* Official Social Media Community Links (SEO Signals) */}
        <div className="flex items-center justify-center gap-5 text-white/50">
          <a
            href="https://x.com/apiflowstudio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow APIFlow Studio on X (Twitter)"
            className="hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>X (Twitter)</span>
            </span>
          </a>

          <a
            href="https://github.com/yashpadaliya08/apiflow"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="APIFlow Studio GitHub Repository"
            className="hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </span>
          </a>

          <a
            href="https://www.linkedin.com/company/apiflow-studio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect with APIFlow Studio on LinkedIn"
            className="hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              <span>LinkedIn</span>
            </span>
          </a>

          <a
            href="https://www.youtube.com/@apiflowstudio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Watch APIFlow Studio Tutorials on YouTube"
            className="hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>YouTube</span>
            </span>
          </a>

          <a
            href="https://www.instagram.com/apiflowstudio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow APIFlow Studio on Instagram"
            className="hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>Instagram</span>
            </span>
          </a>

          <a
            href="https://www.facebook.com/apiflowstudio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow APIFlow Studio on Facebook"
            className="hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Facebook</span>
            </span>
          </a>
        </div>

        <p>© 2026 APIFlow Studio — Standalone Browser API Testing, Contract Simulator & Mock Runner</p>
      </footer>
    </div>
  );
};
