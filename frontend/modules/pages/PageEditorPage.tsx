"use client";

import { useState } from "react";
import { VersionHistoryDrawer } from "@/components/ui/version-history-drawer";
import { useBlockDefinitions, usePage, usePageActions, usePageVersions } from "@/hooks/usePages";
import { BlockBuilderCanvas } from "@/modules/pages/BlockBuilderCanvas";
import { PageEditorHeader } from "@/modules/pages/PageEditorHeader";
import { PreviewDialog } from "@/modules/pages/PreviewDialog";
import { ScheduleDialog } from "@/modules/pages/ScheduleDialog";
import type { PageType } from "@/types/page";

interface PageEditorPageProps {
  pageType: PageType;
}

export function PageEditorPage({ pageType }: PageEditorPageProps) {
  const { data: page, isLoading } = usePage(pageType);
  const { data: blockDefinitions } = useBlockDefinitions();
  const { updatePage, publish, unpublish, schedule, restoreVersion } = usePageActions(pageType);
  const { data: versions, isLoading: versionsLoading } = usePageVersions(pageType);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (isLoading || !page) {
    return <div className="h-40 animate-pulse rounded-lg border bg-neutral-100" />;
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
