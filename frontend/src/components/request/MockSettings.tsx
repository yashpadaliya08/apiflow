import React, { useState } from 'react';
import type { Endpoint } from '@/types';

export function MockSettings({ endpoint, onChange }: { endpoint: Endpoint; onChange: (updates: Partial<Endpoint>) => void }) {
  const [schema, setSchema] = useState(endpoint.responseSchema ? JSON.stringify(endpoint.responseSchema, null, 2) : '');
  const [example, setExample] = useState(endpoint.responseExample !== undefined ? JSON.stringify(endpoint.responseExample, null, 2) : '');
  const [error, setError] = useState('');
  function save() {
    try {
      const responseSchema = schema.trim() ? JSON.parse(schema) : undefined;
      if (responseSchema && (typeof responseSchema !== 'object' || Array.isArray(responseSchema))) throw new Error('Schema must be a JSON object.');
      const responseExample = example.trim() ? JSON.parse(example) : undefined;
      onChange({ responseSchema, responseExample });
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Invalid JSON'); }
  }
  return <div className="space-y-4 text-xs">
    <p className="text-white/60">For successful responses, an explicit example takes priority over the schema. With neither, APIFlow uses its built-in sample generator.</p>
    <label className="block space-y-1">Response JSON Schema
      <textarea aria-label="Response JSON Schema" className="w-full p-3 font-mono bg-[#141720] border border-[#2A2F45] rounded" rows={8} value={schema} onChange={e => setSchema(e.target.value)} onBlur={save} placeholder={'{"type":"object","properties":{"id":{"type":"string","format":"uuid"}}}'} />
    </label>
    <label className="block space-y-1">Response example (optional)
      <textarea aria-label="Response example" className="w-full p-3 font-mono bg-[#141720] border border-[#2A2F45] rounded" rows={4} value={example} onChange={e => setExample(e.target.value)} onBlur={save} placeholder={'{"id":"example-id"}'} />
    </label>
    <div className="flex gap-3">
      <label>Seed (optional)<input aria-label="Mock seed" type="number" step="1" className="block w-28 p-2 bg-[#141720] border border-[#2A2F45] rounded" value={endpoint.mockSeed ?? ''} onChange={e => onChange({ mockSeed: e.target.value === '' ? undefined : Math.trunc(Number(e.target.value)) })} /></label>
      <label>Delay (ms)<input aria-label="Mock delay" type="number" min="0" max="10000" className="block w-28 p-2 bg-[#141720] border border-[#2A2F45] rounded" value={endpoint.mockLatency ?? ''} placeholder="Automatic" onChange={e => onChange({ mockLatency: e.target.value === '' ? undefined : Math.max(0, Math.min(10000, Number(e.target.value))) })} /></label>
    </div>
    <p className="text-white/40">Supports objects, arrays, primitive types, enum/const, examples, common formats, and length/numeric bounds. Advanced constraints require an explicit example.</p>
    {error && <p role="alert" className="text-red-300">{error}</p>}
  </div>;
}
