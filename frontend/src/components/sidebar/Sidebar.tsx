import React, { useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  FolderOpen,
  X,
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

  const handleCreateNew = async () => {
    if (!activeCollection) return;
    await createEndpoint(activeCollection.id, {
      name: 'New Endpoint',
      method: 'GET',
      path: '/api/v1/resource',
      resource: 'General',
    });
  };

  const handleDuplicate = async (e: React.MouseEvent, ep: (typeof endpoints)[0]) => {
    e.stopPropagation();
    if (!activeCollection) return;
    await createEndpoint(activeCollection.id, {
      ...ep,
      id: undefined,
      name: `${ep.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
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
      {/* Top Header: Collection name + Add Endpoint */}
      <div className="p-3 border-b border-[#2A2F45]/80 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <FolderOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold text-white/90 truncate">
            {activeCollection?.name || 'Endpoints'}
          </span>
          <span className="text-[10px] px-1.5 py-0.2 bg-[#1C2030] text-white/50 rounded-full font-mono">
            {endpoints.length}
          </span>
        </div>

        <button
          onClick={handleCreateNew}
          className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
          title="Create New Endpoint"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 pt-2.5 pb-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search path, name, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[#141720] border border-[#2A2F45] rounded-md text-white/90 placeholder-white/40 focus:outline-none focus:border-indigo-500 text-xs transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
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
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-[#141720] text-white/60 hover:text-white hover:bg-[#1C2030]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Endpoints List Grouped */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {Object.keys(groupedEndpoints).length === 0 ? (
          <div className="p-4 text-center text-white/40">
            <p>No endpoints match filter</p>
          </div>
        ) : (
          Object.entries(groupedEndpoints).map(([resource, eps]) => (
            <div key={resource} className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                <ChevronRight className="w-3 h-3" />
                <span>{resource}</span>
                <span className="text-[10px] font-mono opacity-60">({eps.length})</span>
              </div>

              <div className="space-y-0.5">
                {eps.map((ep) => {
                  const isActive = ep.id === activeEndpoint?.id;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => selectEndpoint(ep.id)}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-[#1C2030] text-white border-indigo-500/50 shadow-sm'
                          : 'text-white/80 border-transparent hover:bg-[#141720] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <MethodBadge method={ep.method} size="sm" />
                        <div className="overflow-hidden flex-1 min-w-0">
                          <div className="truncate font-medium text-white/95 text-xs">{ep.name}</div>
                          <div className="truncate font-mono text-[10px] text-white/45">{ep.path}</div>
                        </div>
                      </div>

                      {/* Action buttons on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
                        <button
                          onClick={(e) => handleDuplicate(e, ep)}
                          className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10"
                          title="Duplicate endpoint"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, ep.id, ep.name)}
                          className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete endpoint"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-[#2A2F45]/70 text-[11px] text-white/40 flex items-center justify-between bg-[#141720]/40">
        <span>Dexie.js IndexedDB</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Persistent
        </span>
      </div>
    </aside>
  );
};
