import React, { useState } from 'react';
import {
  Zap,
  Play,
  Layers,
  Sparkles,
  Download,
  Smartphone,
  Server,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Cpu,
  Globe,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LandingPageProps {
  onLaunchStudio: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchStudio }) => {
  const [demoStatus, setDemoStatus] = useState<number>(200);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0C0E12] text-white selection:bg-indigo-500/30">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2030] border border-[#2A2F45] text-xs text-indigo-300 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Standalone Browser-First API Testing & Synthetic Mock Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Test APIs Instantly.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Zero Backend Required.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
          APIFlow Studio simulates realistic REST APIs directly inside your browser. Generate schema-driven synthetic data, test 7 HTTP status codes, export OpenAPI 3.1 & Postman contracts, or dispatch live proxy requests.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            variant="accent"
            onClick={onLaunchStudio}
            leftIcon={<Play className="w-4 h-4 fill-white" />}
            className="text-sm px-6 py-3 shadow-lg shadow-indigo-500/25"
          >
            Launch Studio Free
          </Button>

          <a
            href="#features"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-[#141720] hover:bg-[#1C2030] border border-[#2A2F45] text-sm text-white/80 hover:text-white transition-colors"
          >
            <span>Explore Capabilities</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Live Interactive Hero Demo Card */}
        <div className="mt-14 max-w-4xl mx-auto text-left rounded-xl border border-[#2A2F45] bg-[#141720]/90 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-[#1C2030]/70 border-b border-[#2A2F45] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-white/40">APIFlow Interactive Mock Sandbox</span>
            </div>

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

          {/* Sandbox Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#2A2F45]">
            {/* Left: Request preview */}
            <div className="p-4 space-y-3 bg-[#0C0E12]/50">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GET
                </span>
                <span className="text-white/80">/api/v1/users/usr_982</span>
              </div>

              <div className="text-xs text-white/50 space-y-1 font-mono">
                <div>Host: <span className="text-white/80">api.enterprise.dev</span></div>
                <div>Authorization: <span className="text-indigo-400">Bearer eyJhbGci...</span></div>
                <div>Accept: <span className="text-white/80">application/json</span></div>
              </div>

              <div className="pt-2">
                <Button size="xs" variant="primary" onClick={onLaunchStudio} leftIcon={<Sparkles className="w-3 h-3" />}>
                  Test In Full Studio
                </Button>
              </div>
            </div>

            {/* Right: Simulated response */}
            <div className="p-4 bg-[#0C0E12] font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2F45]/50 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    demoStatus >= 200 && demoStatus < 300
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {demoStatus} {demoStatus === 200 ? 'OK' : demoStatus === 201 ? 'Created' : 'Error'}
                </span>
                <span className="text-white/40 text-[11px]">⚡ 24ms • 1.2 KB</span>
              </div>

              <pre className="text-white/80 text-[11px] leading-relaxed overflow-x-auto">
                {demoStatus === 200 &&
                  JSON.stringify(
                    {
                      id: 'usr_982',
                      name: 'Elena Rostova',
                      email: 'elena@enterprise.dev',
                      role: 'Senior Architect',
                      active: true,
                      lastLogin: '2026-09-23T11:20:00Z',
                    },
                    null,
                    2
                  )}
                {demoStatus === 201 &&
                  JSON.stringify(
                    {
                      id: 'usr_' + Math.floor(Math.random() * 9000 + 1000),
                      status: 'created',
                      message: 'Resource provisioned successfully',
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
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto border-t border-[#2A2F45]/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Built for High-Speed Frontend & QA Workflows
          </h2>
          <p className="mt-3 text-sm text-white/50">
            Everything you need to test, mock, document, and generate client code with complete client-side autonomy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/50 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Schema Synthetic Engine</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Powered by <code className="text-indigo-300">@faker-js/faker</code> with field heuristics. Automatically populates UUIDs, emails, avatars, timestamps, and realistic enterprise mock payloads.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/50 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Dual Execution Mode</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Switch effortlessly between instant client-side mock simulation (15–40ms latency) and live network execution via the built-in CORS bypass proxy.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/50 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">1-Click Code Generation</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Instantly export ready-to-paste snippets in cURL, TypeScript Fetch, Axios, and Python <code className="text-purple-300">requests</code> with headers and body pre-formatted.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/50 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Contract Portability</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Full import and export support for official OpenAPI 3.1.0 specifications and Postman Collection v2.1. Zero vendor lock-in.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/50 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Dexie.js IndexedDB</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Your collections, endpoints, environments, and execution history are persisted locally in the browser with zero cloud storage required.
            </p>
          </div>

          {/* Card 6: Hosting & StackDoctor */}
          <div className="p-6 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/50 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Spare Phone / PC Self-Hosting</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Ready for StackDoctor deployment! Host 24/7 on an old Android phone via Termux or on your local PC with Cloudflare Tunnels for zero-cost hosting.
            </p>
          </div>
        </div>
      </section>

      {/* Open Design Manifesto Section */}
      <section id="open-design" className="px-6 py-20 max-w-6xl mx-auto border-t border-[#2A2F45]/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 mb-4">
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
          <div className="p-6 rounded-2xl bg-[#141720]/80 border border-red-500/20 relative">
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
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#182030] to-[#121622] border border-emerald-500/40 relative shadow-xl shadow-emerald-500/5">
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
            <div className="p-5 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center font-mono">
                  1
                </span>
                <span>Zero Vendor Lock-in (Universal Interoperability)</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                In closed tools, your work is trapped behind proprietary cloud sync. In APIFlow, every artifact uses universally accepted open standards: export/import OpenAPI 3.1.0 and Postman v2.1.0 JSON, ingest cURL, or export clean TypeScript, Axios, and Python code.
              </p>
            </div>

            {/* Tenet 2 */}
            <div className="p-5 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <span>Local-First & Data Sovereignty</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                You are the sovereign owner of your data. 100% of collections, drafts, environments, and execution history are stored on your machine in IndexedDB (Dexie.js). No enterprise API secrets or headers are ever uploaded to a remote cloud database.
              </p>
            </div>

            {/* Tenet 3 */}
            <div className="p-5 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 text-xs flex items-center justify-center font-mono">
                  3
                </span>
                <span>Ephemeral, Frictionless Sharing</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                No sign-up walls. Using URL-safe UTF-8 base64 state (<code className="text-cyan-300">?mock=...</code>), an interactive mock is compressed directly into the URL query. When a teammate opens the link, the browser engine recreates the mock state immediately with zero login.
              </p>
            </div>

            {/* Tenet 4 */}
            <div className="p-5 rounded-xl bg-[#141720] border border-[#2A2F45] hover:border-indigo-500/40 transition-colors space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
                <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-mono">
                  4
                </span>
                <span>Design Systems as Shared Public Infrastructure</span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                UI components, tokens, and interactions are built as open, reusable building blocks (Tailwind, Radix primitives, Lucide icons). APIFlow is fully modular, transparent, accessible, and easily forkable or extensible by the developer community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* StackDoctor Integration Section */}
      <section id="edge-hosting" className="px-6 py-16 max-w-6xl mx-auto border-t border-[#2A2F45]/60">
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#141720] via-[#1C2030] to-[#0C0E12] border border-[#2A2F45] relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-pink-400 uppercase tracking-wider">
              <Server className="w-4 h-4" />
              <span>Zero-Cost Edge Infrastructure</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Host APIFlow Studio 24/7 on Your Spare Android Phone
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Configured with Express backend + pre-built Vite client static files. StackDoctor auto-detects this as a MERN Full-Stack project, compiles it, and launches on your phone via Termux and Cloudflare Tunnels with HTTPS.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Button size="md" variant="accent" onClick={onLaunchStudio} leftIcon={<Play className="w-4 h-4" />}>
                Open Studio Console
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#2A2F45]/50 text-center text-xs text-white/40">
        <p>© 2026 APIFlow Studio — Standalone API Testing, Contract Simulator & Mock Runner</p>
      </footer>
    </div>
  );
};
