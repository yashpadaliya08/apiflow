import React, { useState } from 'react';
import {
  CreditCard,
  Bot,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Check,
  ArrowRight,
  Layers,
  Zap,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import { PRESET_TEMPLATES, type ApiTemplate } from '@/lib/templates/preset-templates';
import { db } from '@/lib/db/dexie-db';

export const TemplatesModal: React.FC = () => {
  const { templatesOpen, setTemplatesOpen } = useUIStore();
  const { collections, loadCollections, selectCollection, selectEndpoint } = useCollectionStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadedSuccess, setLoadedSuccess] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'CreditCard':
        return <CreditCard className="w-5 h-5 text-indigo-400" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-emerald-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleLoadTemplate = async (template: ApiTemplate) => {
    setLoadingId(template.id);
    setLoadedSuccess(null);

    try {
      // Check if collection already exists by ID
      const existing = await db.collections.get(template.collection.id);
      let targetCollectionId = template.collection.id;

      if (existing) {
        // If it already exists, select it
        targetCollectionId = existing.id;
      } else {
        // Add new collection
        await db.collections.add(template.collection);
        // Bulk add endpoints
        const endpointsWithCol = template.endpoints.map((ep) => ({
          ...ep,
          collectionId: template.collection.id,
        }));
        await db.endpoints.bulkAdd(endpointsWithCol);
      }

      await loadCollections();
      await selectCollection(targetCollectionId);

      // Select first endpoint
      const firstEp = await db.endpoints.where('collectionId').equals(targetCollectionId).first();
      if (firstEp) {
        await selectEndpoint(firstEp.id);
      }

      setLoadedSuccess(`Loaded "${template.name}" into your workspace!`);
      setTimeout(() => {
        setTemplatesOpen(false);
        setLoadedSuccess(null);
      }, 1000);
    } catch (err) {
      console.error('[Templates] Error loading template:', err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Modal
      isOpen={templatesOpen}
      onClose={() => setTemplatesOpen(false)}
      title="Industry API Starter Blueprints"
      description="One-click load production-grade API collections with realistic schemas, synthetic parameters, and status codes."
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {loadedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-medium">{loadedSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_TEMPLATES.map((tpl) => {
            const isInstalled = collections.some((c) => c.id === tpl.collection.id);
            const isLoading = loadingId === tpl.id;

            return (
              <div
                key={tpl.id}
                className="bg-[#0C0E12] border border-[#2A2F45] rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all group shadow-sm hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-[#141720] border border-[#2A2F45] group-hover:border-indigo-500/30">
                      {getIcon(tpl.icon)}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {tpl.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white/95 text-sm mb-1">{tpl.name}</h3>
                  <p className="text-white/50 text-[11px] leading-relaxed mb-3">
                    {tpl.description}
                  </p>

                  <div className="space-y-1 mb-4">
                    <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                      Included Endpoints ({tpl.endpointCount})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tpl.endpoints.slice(0, 3).map((ep, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-[#141720] text-white/70 font-mono text-[10px] border border-[#2A2F45]"
                        >
                          <strong className={ep.method === 'POST' ? 'text-emerald-400' : 'text-blue-400'}>
                            {ep.method}
                          </strong>{' '}
                          {ep.path}
                        </span>
                      ))}
                      {tpl.endpoints.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded bg-[#141720] text-white/40 font-mono text-[10px]">
                          +{tpl.endpoints.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant={isInstalled ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => handleLoadTemplate(tpl)}
                  disabled={isLoading}
                  leftIcon={
                    isInstalled ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isLoading ? 'Loading...' : isInstalled ? 'Switch to Collection' : 'Load Blueprint'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-[#141720]/60 border border-[#2A2F45] rounded-lg flex items-center justify-between text-[11px] text-white/60">
          <span>
            Have an existing spec from Swagger or Postman? You can also import raw JSON files anytime.
          </span>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setTemplatesOpen(false);
              useUIStore.getState().setImportOpen(true);
            }}
            rightIcon={<ArrowRight className="w-3 h-3" />}
          >
            Import JSON Spec
          </Button>
        </div>
      </div>
    </Modal>
  );
};
