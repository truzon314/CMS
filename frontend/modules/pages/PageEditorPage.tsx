"use client";

import { useState } from "react";
import { VersionHistoryDrawer } from "@/components/ui/version-history-drawer";
import { useBlockDefinitions, usePage, usePageActions, usePageVersions } from "@/hooks/usePages";
import { BlockBuilderCanvas } from "@/modules/pages/BlockBuilderCanvas";
import { PageEditorHeader } from "@/modules/pages/PageEditorHeader";
import { PreviewDialog } from "@/modules/pages/PreviewDialog";
import { ScheduleDialog } from "@/modules/pages/ScheduleDialog";
import { SeoPanel } from "@/components/seo/SeoPanel";
import type { PageType } from "@/types/page";

interface PageEditorPageProps {
  pageType: PageType;
}

export function PageEditorPage({ pageType }: PageEditorPageProps) {
  const { data: page, isLoading, isError, error, refetch } = usePage(pageType);
  const { data: blockDefinitions } = useBlockDefinitions();
  const { updatePage, publish, unpublish, schedule, restoreVersion } = usePageActions(pageType);
  const { data: versions, isLoading: versionsLoading } = usePageVersions(pageType);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-14 animate-pulse rounded-lg border bg-neutral-100" />
        <div className="h-64 animate-pulse rounded-lg border bg-neutral-100" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-red-200 bg-red-50 text-center text-red-700">
        <p className="font-semibold text-base mb-1">Failed to load {pageType} page</p>
        <p className="text-sm text-red-600 mb-4">{error instanceof Error ? error.message : "Ensure the backend service is running and accessible."}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageEditorHeader
        key={page.id}
        page={page}
        isSavingTitle={updatePage.isPending}
        isPublishing={publish.isPending || unpublish.isPending}
        onSaveTitle={(title) => updatePage.mutate({ title })}
        onPublish={() => publish.mutate()}
        onUnpublish={() => unpublish.mutate()}
        onOpenSchedule={() => setScheduleOpen(true)}
        onOpenPreview={() => setPreviewOpen(true)}
        onOpenVersions={() => setVersionsOpen(true)}
      />

      <BlockBuilderCanvas page={page} blockDefinitions={blockDefinitions ?? []} />

      <div className="mt-4">
        <h3 className="mb-3 font-semibold text-base text-neutral-900">Page SEO & Social Metadata</h3>
        <SeoPanel
          value={page.seo}
          onChange={(seo) => updatePage.mutate({ seo })}
          slug={page.slug}
        />
      </div>

      <PreviewDialog pageType={pageType} open={previewOpen} onClose={() => setPreviewOpen(false)} />

      <VersionHistoryDrawer
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        versions={versions}
        isLoading={versionsLoading}
        isRestoring={restoreVersion.isPending}
        onRestore={(versionId) => restoreVersion.mutateAsync(versionId)}
        restoreDescription="This overwrites the page's current blocks and title. This can't be undone."
      />

      <ScheduleDialog
        key={scheduleOpen ? "open" : "closed"}
        open={scheduleOpen}
        isLoading={schedule.isPending}
        onClose={() => setScheduleOpen(false)}
        onConfirm={async (iso) => {
          await schedule.mutateAsync(iso);
          setScheduleOpen(false);
        }}
      />
    </div>
  );
}
