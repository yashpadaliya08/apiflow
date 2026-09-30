import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Globe,
  Sparkles,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import { encodeEndpointToUrl } from '@/lib/utils/share-encoder';
import { copyToClipboard } from '@/lib/utils';

export const ShareModal: React.FC = () => {
  const { shareOpen, setShareOpen } = useUIStore();
  const { activeEndpoint } = useCollectionStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);

  if (!activeEndpoint) return null;

  const shareUrl = encodeEndpointToUrl(activeEndpoint);
  const markdownBadge = `[![Test Mock in APIFlow](https://img.shields.io/badge/APIFlow-Test_Mock-6366F1?style=flat-square&logo=fastapi)](${shareUrl})`;

  const handleCopyLink = async () => {
    await copyToClipboard(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  const handleCopyBadge = async () => {
    await copyToClipboard(markdownBadge);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 1500);
  };

  return (
    <Modal
      isOpen={shareOpen}
      onClose={() => setShareOpen(false)}
      title="Share Interactive Mock Link"
      description="Anyone opening this link can immediately run and test this mock endpoint in their browser. Zero sign-up, zero server requirement."
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Endpoint preview banner */}
        <div className="p-3 bg-[#0C0E12] border border-[#2A2F45] rounded-lg flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
              Sharing Endpoint
            </span>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-400">
                {activeEndpoint.method}
              </span>
              <span className="font-semibold text-white/90">{activeEndpoint.name}</span>
            </div>
            <div className="font-mono text-[11px] text-white/50">{activeEndpoint.path}</div>
          </div>

          <div className="text-right">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Scenario: {activeEndpoint.mockScenario || 200} OK
            </span>
          </div>
        </div>

        {/* Share Link Input */}
        <div>
          <label className="block text-white/70 font-semibold mb-1">
            Direct Shareable URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-[#0C0E12] border border-[#2A2F45] rounded-md px-3 py-2 font-mono text-xs text-white/80 focus:outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedLink ? 'Copied Link!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* GitHub / Markdown Badge */}
        <div className="p-3 bg-[#141720] border border-[#2A2F45] rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-white/90 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>GitHub README / PR Badge</span>
              </h4>
              <p className="text-[11px] text-white/50">
                Paste this badge in your repo README so contributors can run this API contract in 1 click.
              </p>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopyBadge}
              leftIcon={copiedBadge ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            >
              {copiedBadge ? 'Copied' : 'Copy Badge'}
            </Button>
          </div>

          <pre className="p-2 bg-[#0C0E12] border border-[#2A2F45] rounded text-[10px] font-mono text-white/70 overflow-x-auto whitespace-pre-wrap">
            {markdownBadge}
          </pre>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={() => setShareOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
