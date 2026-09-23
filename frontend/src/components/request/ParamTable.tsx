import React from 'react';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import type { KeyValue } from '@/types';

interface ParamTableProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  allowPathExtract?: boolean;
}

export const ParamTable: React.FC<ParamTableProps> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}) => {
  const handleToggle = (id: string) => {
    onChange(
      items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleChangeKey = (id: string, key: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, key } : item)));
  };

  const handleChangeValue = (id: string, value: string) => {
    onChange(items.map((item) => (item.id === id ? { ...item, value } : item)));
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleAdd = () => {
    const newItem: KeyValue = {
      id: `kv-${Date.now()}`,
      key: '',
      value: '',
      enabled: true,
    };
    onChange([...items, newItem]);
  };

  return (
    <div className="w-full text-xs">
      <div className="border border-[#2A2F45] rounded-md overflow-hidden bg-[#0C0E12]">
        {/* Table Header */}
        <div className="grid grid-cols-[36px_1fr_1fr_36px] bg-[#141720] border-b border-[#2A2F45] text-[11px] font-semibold text-white/50 px-2 py-1.5 uppercase tracking-wider">
          <div className="flex items-center justify-center">Use</div>
          <div className="px-2">Key</div>
          <div className="px-2">Value</div>
          <div className="flex items-center justify-center">Del</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#2A2F45]/50 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-center text-white/40 italic">No parameters defined.</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`grid grid-cols-[36px_1fr_1fr_36px] items-center px-2 py-1 hover:bg-[#141720]/60 transition-colors ${
                  !item.enabled ? 'opacity-50' : ''
                }`}
              >
                {/* Checkbox */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="text-white/60 hover:text-indigo-400 focus:outline-none"
                  >
                    {item.enabled ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Key */}
                <div className="px-1">
                  <input
                    type="text"
                    value={item.key}
                    onChange={(e) => handleChangeKey(item.id, e.target.value)}
                    placeholder={keyPlaceholder}
                    className="w-full bg-transparent px-2 py-1 text-white font-mono text-xs focus:outline-none focus:bg-[#1C2030] rounded"
                  />
                </div>

                {/* Value */}
                <div className="px-1">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleChangeValue(item.id, e.target.value)}
                    placeholder={valuePlaceholder}
                    className="w-full bg-transparent px-2 py-1 text-white font-mono text-xs focus:outline-none focus:bg-[#1C2030] rounded"
                  />
                </div>

                {/* Delete */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-white/40 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Row</span>
        </button>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] text-white/40 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};
