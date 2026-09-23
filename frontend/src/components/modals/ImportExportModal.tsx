import React, { useState } from 'react';
import { Download, Upload, Check, AlertCircle, FileCode, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useUIStore } from '@/store/ui-store';
import { useCollectionStore } from '@/store/collection-store';
import {
  exportToOpenAPI,
  exportToPostman,
  importCollection,
  downloadFile,
} from '@/lib/generators/import-export';
import { copyToClipboard } from '@/lib/utils';
import { db } from '@/lib/db/dexie-db';

export const ImportExportModal: React.FC = () => {
  const { importOpen, setImportOpen } = useUIStore();
  const { activeCollection, endpoints, loadCollections, selectCollection } = useCollectionStore();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<'openapi' | 'postman' | null>(null);

  if (!activeCollection) return null;

  const handleDownloadOpenAPI = () => {
    const json = exportToOpenAPI(activeCollection, endpoints);
    const filename = `${activeCollection.name.toLowerCase().replace(/\s+/g, '-')}-openapi-3.1.json`;
    downloadFile(json, filename);
  };

  const handleDownloadPostman = () => {
    const json = exportToPostman(activeCollection, endpoints);
    const filename = `${activeCollection.name.toLowerCase().replace(/\s+/g, '-')}-postman-v2.1.json`;
    downloadFile(json, filename);
  };

  const handleCopy = async (format: 'openapi' | 'postman') => {
    const json =
      format === 'openapi'
        ? exportToOpenAPI(activeCollection, endpoints)
        : exportToPostman(activeCollection, endpoints);
    await copyToClipboard(json);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const handleDoImport = async () => {
    setImportError(null);
    setImportSuccess(null);

    if (!importJson.trim()) {
      setImportError('Please paste or upload a JSON collection file.');
      return;
    }

    try {
      const result = importCollection(importJson);
      // Save collection into Dexie
      await db.collections.add(result.collection);
      // Save endpoints
      await db.endpoints.bulkAdd(result.endpoints);

      await loadCollections();
      await selectCollection(result.collection.id);

      setImportSuccess(
        `Successfully imported "${result.collection.name}" with ${result.endpoints.length} endpoints!`
      );
      setImportJson('');
      setTimeout(() => {
        setImportOpen(false);
        setImportSuccess(null);
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || 'Failed to parse and import collection.');
    }
  };

  return (
    <Modal
      isOpen={importOpen}
      onClose={() => setImportOpen(false)}
      title="Contract Portability: Import & Export"
      description="Zero vendor lock-in. Seamlessly swap specs with Postman, Insomnia, Swagger & OpenAPI 3.1"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Sub-tabs */}
        <div className="flex border-b border-[#2A2F45] pb-2">
          <div className="flex gap-1 bg-[#0C0E12] p-1 rounded-lg border border-[#2A2F45]">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'export'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Collection</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'import'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Specs</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Export */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            {/* Card 1: OpenAPI 3.1.0 */}
            <div className="p-3.5 bg-[#0C0E12] border border-[#2A2F45] rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-white/90 text-sm">OpenAPI 3.1.0 Spec</span>
                  <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-mono">
                    JSON
                  </span>
                </div>
                <p className="text-white/50 text-[11px]">
                  Standard contract format. Compatible with Swagger UI, Readme, Postman, and code generators.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleCopy('openapi')}
                >
                  {copiedFormat === 'openapi' ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleDownloadOpenAPI}
                  leftIcon={<Download className="w-3 h-3" />}
                >
                  Download
                </Button>
              </div>
            </div>

            {/* Card 2: Postman Collection v2.1.0 */}
            <div className="p-3.5 bg-[#0C0E12] border border-[#2A2F45] rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-white/90 text-sm">Postman Collection v2.1</span>
                  <span className="px-1.5 py-0.2 bg-orange-500/20 text-orange-400 rounded text-[10px] font-mono">
                    JSON
                  </span>
                </div>
                <p className="text-white/50 text-[11px]">
                  Directly importable into Postman Desktop or Web workspace with nested folders and environments.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => handleCopy('postman')}
                >
                  {copiedFormat === 'postman' ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleDownloadPostman}
                  leftIcon={<Download className="w-3 h-3" />}
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Import */}
        {activeTab === 'import' && (
          <div className="space-y-3">
            <div>
              <label className="block text-white/70 font-semibold mb-1">
                Upload JSON File or Paste Specification
              </label>
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer mb-2"
              />
            </div>

            <textarea
              rows={8}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste raw OpenAPI 3.x or Postman Collection v2.1 JSON here..."
              className="w-full bg-[#0C0E12] border border-[#2A2F45] rounded-md p-3 font-mono text-xs text-white/90 focus:outline-none focus:border-indigo-500 placeholder-white/30 resize-none"
            />

            {importError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {importSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                variant="accent"
                size="md"
                onClick={handleDoImport}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import Collection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
