"use client";

import Link from "next/link";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { Property } from "@/types/property";

interface PropertyEditorHeaderProps {
  property: Property;
  isPublishing: boolean;
  isDuplicating: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onDuplicate: () => void;
}

export function PropertyEditorHeader({
  property,
  isPublishing,
  isDuplicating,
  onPublish,
  onUnpublish,
  onDuplicate,
}: PropertyEditorHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Link href="/properties" className="text-neutral-400 hover:text-neutral-700">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-lg font-semibold">{property.name}</span>
        <StatusPill status={property.status} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" disabled={isDuplicating} onClick={onDuplicate}>
          <Copy size={14} />
          Duplicate
        </Button>
        {property.status === "published" ? (
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
  );
}
