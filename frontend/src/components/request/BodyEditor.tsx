import React, { useState } from 'react';
import { Sparkles, Check, AlertCircle, Copy, RotateCcw } from 'lucide-react';
import { generateSyntheticBody } from '@/lib/engines/synthetic-engine';
import { formatJson, copyToClipboard } from '@/lib/utils';
import type { HttpMethod } from '@/types';

interface BodyEditorProps {
  body: string;
  onChange: (body: string) => void;
  method: HttpMethod;
  endpointPath?: string;
}

export const BodyEditor: React.FC<BodyEditorProps> = ({
  body,
  onChange,
  method,
  endpointPath = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Validate JSON
  let isValid = true;
  let parseError = '';
  if (body.trim()) {
    try {
      JSON.parse(body);
    } catch (err: any) {
      isValid = false;
      parseError = err.message;
    }
  }

  const handleFormat = () => {
    const formatted = formatJson(body);
    onChange(formatted);
  };

  const handleCopy = async () => {
    await copyToClipboard(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleGenerateSynthetic = () => {
    // Generate intelligent synthetic payload based on field heuristics
    const sample = body.trim()
      ? body
      : JSON.stringify({ name: 'Alex Chen', email: 'alex@enterprise.dev', role: 'admin', tier: 'Enterprise' }, null, 2);
    const synthetic = generateSyntheticBody(sample);
    onChange(synthetic);
  };

  const isBodyAllowed = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (!isBodyAllowed) {
    return (
      <div className="p-8 text-center text-white/40 border border-[#2A2F45] rounded-md bg-[#0C0E12]">
        <p className="text-sm">HTTP {method} requests do not typically include a request body.</p>
        <p className="text-xs text-white/30 mt-1">Switch method to POST, PUT, or PATCH to send JSON payload.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-[#141720] border border-[#2A2F45] px-3 py-1.5 rounded-md">
        <div className="flex items-center gap-2">
          <span className="text-white/60 font-semibold text-[11px] uppercase tracking-wider">JSON (application/json)</span>
          {body.trim() && (
            isValid ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <Check className="w-3 h-3" /> Valid JSON
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-red-400" title={parseError}>
                <AlertCircle className="w-3 h-3" /> Syntax Error
              </span>
            )
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGenerateSynthetic}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 rounded font-medium transition-colors"
            title="Generate realistic fake JSON based on field heuristics"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate Synthetic Body</span>
          </button>

          {body.trim() && (
            <>
              <button
                type="button"
                onClick={handleFormat}
                className="px-2 py-1 text-white/60 hover:text-white rounded hover:bg-[#1C2030] transition-colors"
                title="Format JSON"
              >
                Format
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-1 text-white/60 hover:text-white rounded hover:bg-[#1C2030] transition-colors"
                title="Copy body"
              >
                {copied ? 'Copied' : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => onChange('')}
                className="px-2 py-1 text-white/40 hover:text-red-400 rounded hover:bg-[#1C2030] transition-colors"
                title="Clear body"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Textarea */}
      <div className="relative border border-[#2A2F45] rounded-md overflow-hidden bg-[#0C0E12] focus-within:border-indigo-500 transition-colors">
        <textarea
          value={body}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`{\n  "name": "Alex Chen",\n  "email": "alex@enterprise.dev"\n}`}
          rows={11}
          spellCheck={false}
          className="w-full bg-transparent p-3 font-mono text-xs text-white/90 placeholder-white/20 resize-y focus:outline-none leading-relaxed"
        />
      </div>

      {parseError && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 font-mono text-[11px]">
          {parseError}
        </div>
      )}
    </div>
  );
};
