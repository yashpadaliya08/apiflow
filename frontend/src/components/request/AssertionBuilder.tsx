import React from 'react';
import { Plus, Trash2, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ASSERTION_PRESETS } from '@/lib/assertions/evaluator';
import type { Assertion, AssertionTarget, AssertionOperator } from '@/types';

interface AssertionBuilderProps {
  assertions: Assertion[];
  onChange: (assertions: Assertion[]) => void;
}

export const AssertionBuilder: React.FC<AssertionBuilderProps> = ({ assertions = [], onChange }) => {
  const handleAddAssertion = () => {
    const newAssertion: Assertion = {
      id: `assert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      target: 'status',
      operator: 'equals',
      expectedValue: '200',
      enabled: true,
    };
    onChange([...assertions, newAssertion]);
  };

  const handleAddPreset = (preset: typeof ASSERTION_PRESETS[0]) => {
    const newAssertion: Assertion = {
      id: `assert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...preset.assertion,
      enabled: true,
    };
    onChange([...assertions, newAssertion]);
  };

  const handleUpdate = (id: string, updates: Partial<Assertion>) => {
    onChange(assertions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleDelete = (id: string) => {
    onChange(assertions.filter((a) => a.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0C0E12] text-xs select-none">
      {/* Top Banner & 1-Click Presets */}
      <div className="p-3 border-b border-[#2A2F45] bg-[#141720]/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white/90">Visual Contract Assertions</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
              No-Code pm.test
            </span>
          </div>

          <Button
            size="xs"
            variant="primary"
            onClick={handleAddAssertion}
            leftIcon={<Plus className="w-3 h-3" />}
          >
            Add Assertion
          </Button>
        </div>

        {/* 1-Click Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-[10px] text-white/40 uppercase font-semibold flex items-center gap-1 flex-shrink-0 mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Presets:</span>
          </span>
          {ASSERTION_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleAddPreset(preset)}
              className="px-2 py-0.5 rounded bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-[10px] text-white/80 hover:text-white font-medium transition-colors flex-shrink-0 cursor-pointer"
            >
              + {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Assertions Table / Rows */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {assertions.length === 0 ? (
          <div className="p-8 text-center text-white/40 flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#1C2030] flex items-center justify-center border border-[#2A2F45]">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 opacity-60" />
            </div>
            <p className="text-white/80 font-medium">No assertions configured yet</p>
            <p className="text-[11px] text-white/40 max-w-sm">
              Add automated tests for response status code, latency, headers, or JSON body fields without writing any JavaScript code.
            </p>
            <div className="pt-2 flex gap-2">
              <Button size="xs" variant="accent" onClick={handleAddAssertion} leftIcon={<Plus className="w-3 h-3" />}>
                Create Custom Test
              </Button>
            </div>
          </div>
        ) : (
          assertions.map((assertion, index) => (
            <div
              key={assertion.id}
              className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-2 transition-all ${
                assertion.enabled
                  ? 'bg-[#141720] border-[#2A2F45]'
                  : 'bg-[#0C0E12] border-[#2A2F45]/40 opacity-50'
              }`}
            >
              {/* Row Left: Enable Checkbox + Index */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={assertion.enabled}
                  onChange={(e) => handleUpdate(assertion.id, { enabled: e.target.checked })}
                  className="rounded border-[#2A2F45] bg-[#0C0E12] text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                  title="Toggle assertion on/off"
                />
                <span className="font-mono text-[10px] text-white/30 w-4">#{index + 1}</span>
              </div>

              {/* Target Selector */}
              <select
                value={assertion.target}
                onChange={(e) => {
                  const target = e.target.value as AssertionTarget;
                  let defOp: AssertionOperator = 'equals';
                  let defVal = '200';
                  let prop = '';
                  if (target === 'responseTime') {
                    defOp = 'less_than';
                    defVal = '250';
                  } else if (target === 'header') {
                    prop = 'Content-Type';
                    defOp = 'contains';
                    defVal = 'application/json';
                  } else if (target === 'bodyPath') {
                    prop = 'id';
                    defOp = 'exists';
                    defVal = 'true';
                  }
                  handleUpdate(assertion.id, { target, operator: defOp, expectedValue: defVal, property: prop });
                }}
                className="bg-[#0C0E12] border border-[#2A2F45] rounded px-2 py-1 text-xs text-indigo-300 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer flex-shrink-0"
              >
                <option value="status">Status Code</option>
                <option value="responseTime">Response Time (ms)</option>
                <option value="header">Header</option>
                <option value="bodyPath">JSON Body Field</option>
              </select>

              {/* Property Field (for Header or Body Path) */}
              {(assertion.target === 'header' || assertion.target === 'bodyPath') && (
                <input
                  type="text"
                  placeholder={assertion.target === 'header' ? 'Header (e.g. Content-Type)' : 'Path (e.g. data.id)'}
                  value={assertion.property || ''}
                  onChange={(e) => handleUpdate(assertion.id, { property: e.target.value })}
                  className="bg-[#0C0E12] border border-[#2A2F45] rounded px-2 py-1 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 flex-1 min-w-[120px]"
                />
              )}

              {/* Operator Selector */}
              <select
                value={assertion.operator}
                onChange={(e) => handleUpdate(assertion.id, { operator: e.target.value as AssertionOperator })}
                className="bg-[#0C0E12] border border-[#2A2F45] rounded px-2 py-1 text-xs text-white/80 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer flex-shrink-0"
              >
                <option value="equals">equals (==)</option>
                <option value="not_equals">does not equal (!=)</option>
                <option value="contains">contains</option>
                <option value="less_than">is less than (&lt;)</option>
                <option value="greater_than">is greater than (&gt;)</option>
                <option value="exists">exists</option>
                <option value="is_type">type is</option>
              </select>

              {/* Expected Value Input (unless operator is 'exists') */}
              {assertion.operator !== 'exists' && (
                <div className="flex-1 min-w-[100px]">
                  {assertion.operator === 'is_type' ? (
                    <select
                      value={assertion.expectedValue}
                      onChange={(e) => handleUpdate(assertion.id, { expectedValue: e.target.value })}
                      className="w-full bg-[#0C0E12] border border-[#2A2F45] rounded px-2 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="string">string</option>
                      <option value="number">number</option>
                      <option value="boolean">boolean</option>
                      <option value="array">array</option>
                      <option value="object">object</option>
                      <option value="uuid">valid UUID</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Expected value..."
                      value={assertion.expectedValue}
                      onChange={(e) => handleUpdate(assertion.id, { expectedValue: e.target.value })}
                      className="w-full bg-[#0C0E12] border border-[#2A2F45] rounded px-2 py-1 text-xs font-mono text-emerald-400 placeholder-white/30 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              )}

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(assertion.id)}
                className="p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0 cursor-pointer self-end sm:self-auto"
                title="Remove assertion"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
