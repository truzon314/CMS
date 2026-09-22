"use client";

import { useRouter } from "next/navigation";
import { useProperty, usePropertyActions } from "@/hooks/useProperties";
import { PropertyContentEditor } from "@/modules/properties/PropertyContentEditor";
import { PropertyEditorHeader } from "@/modules/properties/PropertyEditorHeader";

interface PropertyEditorPageProps {
  propertyId: string;
}

export function PropertyEditorPage({ propertyId }: PropertyEditorPageProps) {
  const router = useRouter();
  const { data: property, isLoading, isError, error, refetch } = useProperty(propertyId);
  const { update, duplicate, publish, unpublish } = usePropertyActions(propertyId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-14 animate-pulse rounded-lg border bg-neutral-100" />
        <div className="h-64 animate-pulse rounded-lg border bg-neutral-100" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-red-200 bg-red-50 text-center text-red-700">
        <p className="font-semibold text-base mb-1">Failed to load property</p>
        <p className="text-sm text-red-600 mb-4">{error instanceof Error ? error.message : "Ensure the backend service is running and accessible."}</p>
        <button onClick={() => refetch()} className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PropertyEditorHeader
        key={`header-${property.id}`}
        property={property}
        isPublishing={publish.isPending || unpublish.isPending}
        isDuplicating={duplicate.isPending}
        onPublish={() => publish.mutate()}
        onUnpublish={() => unpublish.mutate()}
        onDuplicate={() => duplicate.mutate(undefined, { onSuccess: (created) => router.push(`/properties/${created.id}`) })}
      />

      <PropertyContentEditor
        key={`content-${property.id}`}
        property={property}
        isSaving={update.isPending}
        onSave={(payload) => update.mutate(payload)}
      />
    </div>
  );
}
