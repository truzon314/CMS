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
  const { data: post, isLoading } = useBlogPost(postId);
  const { update, duplicate, publish, unpublish, schedule, restoreVersion } = useBlogPostActions(postId);
  const { data: versions, isLoading: versionsLoading } = useBlogPostVersions(postId);

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  if (isLoading || !post) {
    return <div className="h-40 animate-pulse rounded-lg border bg-neutral-100" />;
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
