import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Zap,
  Globe,
  FolderOpen,
  Send,
  Code2,
  Rocket,
  CheckCircle2,
} from 'lucide-react';

const TOUR_KEY = 'apiflow-onboarding-v1';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: <Rocket className="w-7 h-7" />,
    title: 'Welcome to APIFlow Studio',
    description:
      'The 100% private, offline-first API testing and mock simulation studio. No login. No cloud. Your data never leaves your device.',
    highlight: "Let's take a 30-second tour of the three main panels.",
    color: 'from-indigo-500 to-purple-600',
  },
  {
    icon: <FolderOpen className="w-7 h-7" />,
    title: '① Left Panel — Collections & Endpoints',
    description:
      'Your saved API endpoints live here, organised by resource groups. Use the "+ New" button to create your first endpoint, or import an OpenAPI / Postman collection.',
    highlight: 'Tip: Press "/" to instantly focus the search bar.',
    color: 'from-violet-500 to-indigo-600',
  },
  {
    icon: <Send className="w-7 h-7" />,
    title: '② Middle Panel — Request Builder',
    description:
      'Set your HTTP Method, URL, query params, request headers, and body payload. Toggle between Mock mode and Live Proxy mode using the execution selector in the top-right.',
    highlight: 'Tip: Press Ctrl+Enter to send the request instantly.',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: 'Mock Mode — Instant Simulation',
    description:
      'In Mock mode, requests are processed entirely in your browser. Choose a status code (200, 201, 400, 401, 403, 404, 500) and latency — the engine generates realistic Faker-driven JSON schemas automatically.',
    highlight: 'No backend required. Great for frontend prototyping.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: 'Live Mode — Real Network Calls',
    description:
      'In Live mode, requests are routed through the built-in CORS proxy gateway, letting you call real APIs from the browser without CORS errors. Simply toggle the mode selector to "Live".',
    highlight: 'Your API keys are sent directly — they are never logged or stored.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: <Code2 className="w-7 h-7" />,
    title: '③ Right Panel — Response Viewer',
    description:
      'See the status code, latency, full response body (with syntax highlighting and JSON tree view), response headers, cookies, and more. Use the "Code" button to export a ready-to-paste curl / fetch / axios snippet.',
    highlight: 'The Diff tab shows what changed between two responses.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: <CheckCircle2 className="w-7 h-7" />,
    title: "You're All Set!",
    description:
      'Start by clicking "+ New" in the left sidebar to create your first endpoint, or choose from the Templates library in the top navigation.',
    highlight: 'This tour will not show again. Press "?" anytime to re-open it.',
    color: 'from-indigo-500 to-purple-600',
  },
];

export const OnboardingTour: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Re-open with "?" key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        e.key === '?' &&
        !e.ctrlKey &&
        !e.metaKey &&
        tag !== 'INPUT' &&
        tag !== 'TEXTAREA'
      ) {
        setStep(0);
        setVisible(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const close = useCallback(() => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setStep(next);
        setAnimating(false);
      }, 180);
    },
    [animating]
  );

  const prev = () => goTo(Math.max(0, step - 1));
  const next = () => {
    if (step === STEPS.length - 1) close();
    else goTo(step + 1);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
        onClick={close}
      />

      {/* Tour card */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-[#0F1117] border border-[#2A2F45] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
          style={{ animation: 'tour-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          {/* Gradient strip */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${current.color}`} />

          {/* Step dots + close */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === step
                      ? 'w-6 h-2 bg-indigo-500'
                      : 'w-2 h-2 bg-[#2A2F45] hover:bg-indigo-500/50'
                  }`}
                  aria-label={`Step ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={close}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div
            className={`px-5 pb-3 transition-opacity duration-200 ${
              animating ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center text-white shadow-lg mb-4`}
            >
              {current.icon}
            </div>
            <h2 className="text-white font-bold text-lg leading-tight mb-2">
              {current.title}
            </h2>
            <p className="text-white/65 text-sm leading-relaxed mb-3">
              {current.description}
            </p>
            {current.highlight && (
              <div className="flex items-start gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-xl px-3 py-2.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <p className="text-indigo-300/90 text-xs leading-relaxed">
                  {current.highlight}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#2A2F45]/60">
            <span className="text-white/30 text-xs font-mono">
              {step + 1} / {STEPS.length}
            </span>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={next}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-white text-sm bg-gradient-to-r ${current.color} hover:opacity-90 shadow-md transition-opacity`}
              >
                {step === STEPS.length - 1 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Get Started
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tour-pop {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
      `}</style>
    </>
  );
};
