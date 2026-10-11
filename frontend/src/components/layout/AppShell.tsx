import React from 'react';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { RequestBuilder } from '@/components/request/RequestBuilder';
import { ResponseViewer } from '@/components/response/ResponseViewer';
import { SnippetModal } from '@/components/modals/SnippetModal';
import { ImportExportModal } from '@/components/modals/ImportExportModal';
import { EnvironmentModal } from '@/components/modals/EnvironmentModal';
import { HistoryDrawer } from '@/components/modals/HistoryDrawer';
import { CollectionRunnerModal } from '@/components/modals/CollectionRunnerModal';
import { TemplatesModal } from '@/components/modals/TemplatesModal';
import { ShareModal } from '@/components/modals/ShareModal';
import { WebhookModal } from '@/components/modals/WebhookModal';
import { OnboardingTour } from '@/components/ui/OnboardingTour';

export const AppShell: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col md:flex-row overflow-auto md:overflow-hidden relative">
      {/* Pane 1: Sidebar (Collection & Endpoint Explorer) */}
      <Sidebar />

      {/* Pane 2: Request Builder (Method, URL, Params, Body) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[440px] md:min-h-0 overflow-hidden">
        <RequestBuilder />
      </div>

      {/* Pane 3: Response Viewer (Status, Latency, Pretty JSON Tree, Headers) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[380px] md:min-h-0 overflow-hidden">
        <ResponseViewer />
      </div>

      {/* Global Modals */}
      <SnippetModal />
      <ImportExportModal />
      <EnvironmentModal />
      <HistoryDrawer />
      <CollectionRunnerModal />
      <TemplatesModal />
      <ShareModal />
      <WebhookModal />
      <OnboardingTour />
    </main>
  );
};
