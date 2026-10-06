import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  X,
  Play,
} from 'lucide-react';
import { useCollectionStore } from '@/store/collection-store';
import { useUIStore } from '@/store/ui-store';
import { MethodBadge } from '@/components/ui/Badge';
import type { HttpMethod } from '@/types';

export const Sidebar: React.FC = () => {
  const {
    endpoints,
    activeEndpoint,
    activeCollection,
    selectEndpoint,
    createEndpoint,
    deleteEndpoint,
  } = useCollectionStore();

  const {
    searchQuery,
    setSearchQuery,
    methodFilter,
    setMethodFilter,
    sidebarWidth,
  } = useUIStore();

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ep.resource && ep.resource.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMethod = methodFilter === 'ALL' || ep.method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [endpoints, searchQuery, methodFilter]);

  // Group by resource
  const groupedEndpoints = useMemo(() => {
    const groups: Record<string, typeof endpoints> = {};
    filteredEndpoints.forEach((ep) => {
      const res = ep.resource || 'General';
      if (!groups[res]) groups[res] = [];
      groups[res].push(ep);
    });
    return groups;
  }, [filteredEndpoints]);

  const [collapsedResources, setCollapsedResources] = useState<Record<string, boolean>>({});

  const toggleResource = (resource: string) => {
    setCollapsedResources((prev) => ({
      ...prev,
      [resource]: !prev[resource],
    }));
  };

  const handleCreateNew = async () => {
    let colId = activeCollection?.id;
    if (!colId) {
      const created = await useCollectionStore.getState().createCollection('My API Collection');
      colId = created.id;
    }
    // Clear filters so new endpoint is immediately visible
    setMethodFilter('ALL');
    setSearchQuery('');

    await createEndpoint(colId, {
      name: 'New Endpoint',
      method: 'GET',
      path: '/api/v1/resource',
      resource: 'General',
    });
  };

  const handleDuplicate = async (e: React.MouseEvent, ep: (typeof endpoints)[0]) => {
    e.stopPropagation();
    if (!activeCollection) return;
    setMethodFilter('ALL');
    setSearchQuery('');

    const { id, ...rest } = ep;
    const duplicated = await createEndpoint(activeCollection.id, {
      ...rest,
      name: `${ep.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (duplicated) {
      await selectEndpoint(duplicated.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Delete endpoint "${name}"?`)) {
      await deleteEndpoint(id);
    }
  };

  const methods: ('ALL' | HttpMethod)[] = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="h-full bg-[#0C0E12] border-r border-[#2A2F45] flex flex-col flex-shrink-0 select-none text-xs"
    >
      {/* Top Header: Collection name + Run + New */}
      <div className="p-3 border-b border-[#2A2F45]/80 bg-[#141720]/60 flex items-center justify-between gap-2 backdrop-blur-sm">
        <div className="flex items-center gap-2 min-w-0 flex-1" title={activeCollection?.name || 'Endpoints'}>
          <div className="w-6 h-6 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="font-semibold text-white/95 truncate tracking-tight">
            {activeCollection?.name || 'Endpoints'}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-[#1C2030] border border-[#2A2F45] text-indigo-300 rounded-full font-mono flex-shrink-0 font-medium">
            {endpoints.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => useUIStore.getState().setRunnerOpen(true)}
            className="p-1 rounded bg-[#1C2030] hover:bg-[#2A2F48] text-indigo-300 hover:text-white border border-[#2A2F45] hover:border-indigo-500/40 transition-colors flex items-center gap-1 text-[11px] px-2 font-medium shadow-sm"
            title="Run All Endpoints in Collection"
          >
            <Play className="w-3 h-3 fill-indigo-400 text-indigo-400" />
            <span>Run</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="p-1 rounded bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1 text-[11px] px-2 font-semibold"
            title="Create New Endpoint"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Search Input with Keyboard Cue */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 py-1.5 bg-[#141720] border border-[#2A2F45] rounded-lg text-white/90 placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-xs transition-all font-mono"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.2 bg-[#1C2030] border border-[#2A2F45] text-white/30 rounded text-[9px] font-mono pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* HTTP Method Filter Pills */}
      <div className="px-3 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-[#2A2F45]/50">
        {methods.map((m) => (
          <button
            key={m}
            onClick={() => setMethodFilter(m)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all uppercase ${
              methodFilter === m
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 border border-indigo-400/40'
                : 'bg-[#141720] text-white/50 hover:text-white hover:bg-[#1C2030] border border-[#2A2F45]/50'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Endpoints List Grouped */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {Object.keys(groupedEndpoints).length === 0 ? (
          <div className="p-6 text-center text-white/40 flex flex-col items-center justify-center space-y-2.5">
            {endpoints.length === 0 ? (
              <>
                <div className="w-10 h-10 rounded-xl bg-[#1C2030] flex items-center justify-center border border-[#2A2F45]">
                  <FolderOpen className="w-5 h-5 text-indigo-400 opacity-60" />
                </div>
                <div>
                  <p className="text-white/80 font-medium text-xs">No endpoints in collection</p>
                  <p className="text-[11px] text-white/40 mt-0.5">Start testing by creating an endpoint</p>
                </div>
                <button
                  onClick={handleCreateNew}
                  className="mt-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Endpoint</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-white/60">No endpoints match filter</p>
                <button
                  onClick={() => {
                    setMethodFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1 bg-[#1C2030] hover:bg-[#2A2F48] border border-[#2A2F45] text-white/80 hover:text-white rounded text-[11px] transition-colors"
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          Object.entries(groupedEndpoints).map(([resource, eps]) => {
            const isCollapsed = !!collapsedResources[resource];
            return (
              <div key={resource} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleResource(resource)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-white/50 hover:text-white uppercase tracking-wider hover:bg-[#141720]/80 rounded transition-colors group cursor-pointer"
                  title={isCollapsed ? `Expand ${resource}` : `Collapse ${resource}`}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${
                        isCollapsed ? '-rotate-90 text-white/30' : 'text-indigo-400'
                      }`}
                    />
                    <span className="truncate group-hover:text-white transition-colors">{resource}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1C2030] border border-[#2A2F45] text-white/40 rounded-full flex-shrink-0 ml-1">
                    {eps.length}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {eps.map((ep) => {
                      const isActive = ep.id === activeEndpoint?.id;

                      return (
                        <div
                          key={ep.id}
                          onClick={() => selectEndpoint(ep.id)}
                          className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent text-white border-indigo-500/40 shadow-sm shadow-indigo-500/10 border-l-2 border-l-indigo-400'
                              : 'text-white/70 border-transparent hover:bg-[#141720]/80 hover:text-white hover:border-[#2A2F45]/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden flex-1">
                            <MethodBadge method={ep.method} size="sm" />
                            <div className="overflow-hidden flex-1 min-w-0">
                              <div className="truncate font-medium text-white/95 text-xs">{ep.name}</div>
                              <div className="truncate font-mono text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
                                {ep.path}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons on hover */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleDuplicate(e, ep)}
                              className="p-1 rounded text-white/40 hover:text-indigo-300 hover:bg-white/10 transition-colors"
                              title="Duplicate endpoint"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, ep.id, ep.name)}
                              className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete endpoint"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#2A2F45]/70 text-[11px] text-white/40 flex items-center justify-between bg-[#141720]/50 backdrop-blur-sm">
        <span className="font-mono text-[10px]">Dexie.js IndexedDB</span>
        <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Local Storage Ready
        </span>
      </div>
    </aside>
  );
};
