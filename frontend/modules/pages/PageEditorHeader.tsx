"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/TextField";
import { StatusPill } from "@/components/ui/status-pill";
import type { Page } from "@/types/page";

interface PageEditorHeaderProps {
  page: Page;
  isSavingTitle: boolean;
  isPublishing: boolean;
  onSaveTitle: (title: string) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onOpenSchedule: () => void;
  onOpenPreview: () => void;
  onOpenVersions: () => void;
}

export function PageEditorHeader({
  page,
  isSavingTitle,
  isPublishing,
  onSaveTitle,
  onPublish,
  onUnpublish,
  onOpenSchedule,
  onOpenPreview,
  onOpenVersions,
}: PageEditorHeaderProps) {
  const [title, setTitle] = useState(page.title);
  const titleDirty = title.trim() !== page.title && title.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link href="/pages" className="text-neutral-400 hover:text-neutral-700">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {page.page_type}
        </span>
        <StatusPill status={page.status} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex max-w-sm flex-1 items-end gap-2">
          <TextField
            id="page_title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button
            variant="outline"
            disabled={!titleDirty || isSavingTitle}
            onClick={() => onSaveTitle(title.trim())}
          >
            Save
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onOpenPreview}>
            <Eye size={14} />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenVersions}>
            <History size={14} />
            Version History
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenSchedule}>
            Schedule
          </Button>
          {page.status === "published" ? (
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
