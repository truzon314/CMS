"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { StatusPill } from "@/components/ui/status-pill";
import type { BlogPost } from "@/types/blog";

interface BlogPostEditorHeaderProps {
  post: BlogPost;
  isSaving: boolean;
  isPublishing: boolean;
  isDuplicating: boolean;
  onSaveTitle: (title: string) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDuplicate: () => void;
  onOpenSchedule: () => void;
  onOpenVersions: () => void;
}

export function BlogPostEditorHeader({
  post,
  isSaving,
  isPublishing,
  isDuplicating,
  onSaveTitle,
  onPublish,
  onUnpublish,
  onDuplicate,
  onOpenSchedule,
  onOpenVersions,
}: BlogPostEditorHeaderProps) {
  const [title, setTitle] = useState(post.title);
  const titleDirty = title.trim() !== post.title && title.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link href="/blog" className="text-neutral-400 hover:text-neutral-700">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Blog Post</span>
        <StatusPill status={post.status} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-md flex-1 items-end gap-2">
          <TextField id="post_title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button variant="outline" disabled={!titleDirty || isSaving} onClick={() => onSaveTitle(title.trim())}>
            Save
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" disabled={isDuplicating} onClick={onDuplicate}>
            <Copy size={14} />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenVersions}>
            <History size={14} />
            Version History
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSchedule}>
            Schedule
          </Button>
          {post.status === "published" ? (
            <Button variant="secondary" size="sm" disabled={isPublishing} onClick={onUnpublish}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" disabled={isPublishing} onClick={onPublish}>
              Publish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
