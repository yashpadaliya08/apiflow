import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ParamTable } from '@/components/request/ParamTable';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import type { Environment, KeyValue } from '@/types';

export const EnvironmentModal: React.FC = () => {
  const { envOpen, setEnvOpen } = useUIStore();
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    saveEnvironment,
    deleteEnvironment,
  } = useCollectionStore();

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(
    activeEnvironmentId || environments[0]?.id || null
  );

  const selectedEnv = environments.find((e) => e.id === selectedEnvId) || environments[0];

  const handleUpdateVariables = async (vars: KeyValue[]) => {
    if (!selectedEnv) return;
    const updated: Environment = { ...selectedEnv, variables: vars };
    await saveEnvironment(updated);
  };

  const handleCreateEnv = async () => {
    const name = prompt('Enter new environment name (e.g. Staging):');
    if (!name?.trim()) return;

    const newEnv: Environment = {
      id: `env-${Date.now()}`,
      name: name.trim(),
      isActive: false,
      variables: [
        { id: `v-${Date.now()}-1`, key: 'baseUrl', value: 'https://staging.api.enterprise.dev', enabled: true },
      ],
    };
    await saveEnvironment(newEnv);
    setSelectedEnvId(newEnv.id);
  };

  const handleDeleteEnv = async (id: string) => {
    if (environments.length <= 1) {
      alert('You must keep at least one environment.');
      return;
    }
    if (confirm('Delete this environment?')) {
      await deleteEnvironment(id);
      setSelectedEnvId(environments.filter((e) => e.id !== id)[0]?.id || null);
    }
  };

  return (
    <Modal
      isOpen={envOpen}
      onClose={() => setEnvOpen(false)}
      title="Environment Variables"
      description="Define variable templates like {{baseUrl}} or {{token}} to dynamically resolve across paths and headers"
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4 text-xs">
        {/* Left column: Environments list */}
        <div className="space-y-1 border-r border-[#2A2F45] pr-3">
          <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-white/50 uppercase">
            <span>Environments</span>
            <button
              onClick={handleCreateEnv}
              className="p-1 rounded text-indigo-400 hover:bg-indigo-500/10"
              title="Add Environment"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {environments.map((env) => {
              const isCurrent = env.id === selectedEnv?.id;
              const isActive = env.id === activeEnvironmentId;

              return (
                <div
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                    isCurrent ? 'bg-[#1C2030] text-white font-medium' : 'text-white/70 hover:bg-[#141720]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEnvironmentId(env.id);
                      }}
                      title={isActive ? 'Active environment' : 'Set as active environment'}
                      className="text-emerald-400 focus:outline-none"
                    >
                      {isActive ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-white/30 hover:text-white/60" />
                      )}
                    </button>
                    <span className="truncate">{env.name}</span>
                  </div>

                  {environments.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEnv(env.id);
                      }}
                      className="text-white/30 hover:text-red-400 p-0.5 rounded"
                      title="Delete environment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Variables table */}
        <div className="space-y-3">
          {selectedEnv ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white/90 text-sm">{selectedEnv.name}</h4>
                  <p className="text-white/40 text-[11px]">
                    Use syntax <code className="text-indigo-400 font-mono">{'{{key}}'}</code> in URLs and Headers
                  </p>
                </div>

                <button
                  onClick={() => setActiveEnvironmentId(selectedEnv.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedEnv.id === activeEnvironmentId
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium'
                      : 'bg-[#1C2030] text-white/60 hover:text-white border border-[#2A2F45]'
                  }`}
                >
                  {selectedEnv.id === activeEnvironmentId ? 'Active Environment' : 'Set Active'}
                </button>
              </div>

              <ParamTable
                items={selectedEnv.variables}
                onChange={handleUpdateVariables}
                keyPlaceholder="Variable (e.g. token)"
                valuePlaceholder="Value (e.g. bearer_xyz)"
              />
            </>
          ) : (
            <div className="p-6 text-center text-white/40">Select or create an environment.</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
