"use client";

import { useState } from "react";
import { AppDrawer } from "@/components/ui/app-drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextField } from "@/components/forms/TextField";
import { ApiError } from "@/lib/api-client";
import { useDeleteMedia, useMediaUsage, useUpdateMedia } from "@/hooks/useMedia";
import type { Media } from "@/types/media";

interface MediaDetailsDrawerProps {
  media: Media | null;
  open: boolean;
  onClose: () => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaDetailsDrawer({ media, open, onClose }: MediaDetailsDrawerProps) {
  const { data: usage } = useMediaUsage(media?.id ?? null);
  const updateMedia = useUpdateMedia();
  const deleteMedia = useDeleteMedia();

  const [altText, setAltText] = useState(media?.alt_text ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [forceConfirm, setForceConfirm] = useState<{ usageCount: number } | null>(null);

  if (!media) return null;
  const isImage = media.mime_type.startsWith("image/");

  async function handleDelete() {
    try {
      await deleteMedia.mutateAsync({ id: media!.id });
      setConfirmOpen(false);
      onClose();
    } catch (err) {
      setConfirmOpen(false);
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setForceConfirm({ usageCount: (err.details?.usage_count as number) ?? (usage?.length ?? 0) });
      }
    }
  }

  return (
    <AppDrawer key={media.id} open={open} onClose={onClose} title={media.file_name} width="md">
      <div className="flex flex-col gap-4 py-4">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt={media.alt_text ?? media.file_name} className="max-h-48 w-full rounded-md object-contain" />
        ) : null}

        <div className="grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-neutral-500 sm:grid-cols-2">
          <span>Type</span>
          <span className="text-right text-neutral-800">{media.mime_type}</span>
          <span>Size</span>
          <span className="text-right text-neutral-800">{formatSize(media.size_bytes)}</span>
          {media.width && media.height ? (
            <>
              <span>Dimensions</span>
              <span className="text-right text-neutral-800">
                {media.width} × {media.height}
              </span>
            </>
          ) : null}
        </div>

        <TextField
          id="media_alt_text"
          label="Alt text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
        />
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={updateMedia.isPending || altText === (media.alt_text ?? "")}
          onClick={() => updateMedia.mutate({ id: media.id, payload: { alt_text: altText } })}
        >
          Save alt text
        </Button>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">Used in</div>
          {!usage || usage.length === 0 ? (
            <p className="text-sm text-neutral-500">Not used anywhere yet.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {usage.map((u) => (
                <li key={u.id} className="rounded-md border px-2.5 py-1.5 text-neutral-700">
                  {u.entity_type} · {u.field_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="destructive" size="sm" className="mt-2 self-start" onClick={() => setConfirmOpen(true)}>
          Delete file
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this file?"
        description="This can't be undone."
        variant="destructive"
        confirmLabel="Delete"
        isLoading={deleteMedia.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!forceConfirm}
        title="This file is still in use"
        description={`It's referenced in ${forceConfirm?.usageCount ?? 0} place(s). Deleting it will leave those references broken. Delete anyway?`}
        variant="destructive"
        confirmLabel="Delete anyway"
        isLoading={deleteMedia.isPending}
        onCancel={() => setForceConfirm(null)}
        onConfirm={async () => {
          await deleteMedia.mutateAsync({ id: media.id, force: true });
          setForceConfirm(null);
          onClose();
        }}
      />
    </AppDrawer>
  );
}
