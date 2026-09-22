"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VersionHistoryDrawer } from "@/components/ui/version-history-drawer";
import { useBlogPost, useBlogPostActions, useBlogPostVersions } from "@/hooks/useBlog";
import { BlogPostContentEditor } from "@/modules/blog/BlogPostContentEditor";
import { BlogPostEditorHeader } from "@/modules/blog/BlogPostEditorHeader";
import { ScheduleDialog } from "@/modules/pages/ScheduleDialog";

interface BlogPostEditorPageProps {
  postId: string;
}

export function BlogPostEditorPage({ postId }: BlogPostEditorPageProps) {
  const router = useRouter();
  const { data: post, isLoading, isError, error, refetch } = useBlogPost(postId);
  const { update, duplicate, publish, unpublish, schedule, restoreVersion } = useBlogPostActions(postId);
  const { data: versions, isLoading: versionsLoading } = useBlogPostVersions(postId);

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

  if (isError || !post) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-red-200 bg-red-50 text-center text-red-700">
        <p className="font-semibold text-base mb-1">Failed to load blog post</p>
        <p className="text-sm text-red-600 mb-4">{error instanceof Error ? error.message : "Ensure the backend service is running and accessible."}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BlogPostEditorHeader
        key={`header-${post.id}`}
        post={post}
        isSaving={update.isPending}
        isPublishing={publish.isPending || unpublish.isPending}
        isDuplicating={duplicate.isPending}
        onSaveTitle={(title) => update.mutate({ title })}
        onPublish={() => publish.mutate()}
        onUnpublish={() => unpublish.mutate()}
        onDuplicate={() => duplicate.mutate(undefined, { onSuccess: (created) => router.push(`/blog/posts/${created.id}`) })}
        onOpenSchedule={() => setScheduleOpen(true)}
        onOpenVersions={() => setVersionsOpen(true)}
      />

      <BlogPostContentEditor
        key={`content-${post.id}`}
        post={post}
        authorName={post.author_name}
        isSaving={update.isPending}
        onSave={(payload) => update.mutate(payload)}
      />

      <VersionHistoryDrawer
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        versions={versions}
        isLoading={versionsLoading}
        isRestoring={restoreVersion.isPending}
        onRestore={(versionId) => restoreVersion.mutateAsync(versionId)}
        restoreDescription="This overwrites the post's current content. This can't be undone."
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
