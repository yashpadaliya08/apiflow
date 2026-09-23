import React from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ResponseViewer } from '@/components/response/ResponseViewer';
import { SnippetModal } from '@/components/modals/SnippetModal';
import { ImportExportModal } from '@/components/modals/ImportExportModal';
import { EnvironmentModal } from '@/components/modals/EnvironmentModal';
import { HistoryDrawer } from '@/components/modals/HistoryDrawer';

export const AppShell: React.FC = () => {
  return (
    <main className="flex-1 flex overflow-hidden relative">
      {/* Pane 1: Sidebar (Collection & Endpoint Explorer) */}
      <Sidebar />

      {/* Pane 2: Request Builder (Method, URL, Params, Body) */}
      <div className="flex-1 flex flex-col min-w-[340px] overflow-hidden">
        <RequestBuilder />
      </div>

      {/* Pane 3: Response Viewer (Status, Latency, Pretty JSON Tree, Headers) */}
      <div className="flex-1 flex flex-col min-w-[340px] overflow-hidden">
        <ResponseViewer />
      </div>

      {/* Global Modals */}
      <SnippetModal />
      <ImportExportModal />
      <EnvironmentModal />
      <HistoryDrawer />
    </main>
  );
};
