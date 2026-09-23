import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import { generateAllSnippets } from '@/lib/generators/code-snippets';
import { copyToClipboard } from '@/lib/utils';

export const SnippetModal: React.FC = () => {
  const { codeSnippetOpen, setCodeSnippetOpen } = useUIStore();
  const { activeEndpoint, activeCollection, environments, activeEnvironmentId } = useCollectionStore();
  const [activeLang, setActiveLang] = useState<'curl' | 'typescript' | 'axios' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  if (!activeEndpoint) return null;

  const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
  const baseUrl = activeCollection?.baseUrl || 'https://api.enterprise.dev';

  const snippets = generateAllSnippets(activeEndpoint, baseUrl, activeEnv?.variables || []);

  const handleCopy = async () => {
    await copyToClipboard(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tabs: { id: 'curl' | 'typescript' | 'axios' | 'python'; label: string }[] = [
    { id: 'curl', label: 'cURL' },
    { id: 'typescript', label: 'TypeScript (Fetch)' },
    { id: 'axios', label: 'Axios' },
    { id: 'python', label: 'Python (requests)' },
  ];

  return (
    <Modal
      isOpen={codeSnippetOpen}
      onClose={() => setCodeSnippetOpen(false)}
      title="Code Snippets"
      description={`Production-ready client snippets for ${activeEndpoint.method} ${activeEndpoint.path}`}
      maxWidth="2xl"
    >
      <div className="space-y-3">
        {/* Language Tabs & Copy Button */}
        <div className="flex items-center justify-between border-b border-[#2A2F45] pb-2">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLang(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeLang === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-xs text-white/90 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-white/60" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        {/* Code Box */}
        <div className="bg-[#0C0E12] border border-[#2A2F45] rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-[55vh]">
          <pre className="text-white/90 whitespace-pre leading-relaxed select-text">
            {snippets[activeLang]}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
