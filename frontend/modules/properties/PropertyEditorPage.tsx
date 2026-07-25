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
  const { data: property, isLoading } = useProperty(propertyId);
  const { update, duplicate, publish, unpublish } = usePropertyActions(propertyId);

  if (isLoading || !property) {
    return <div className="h-40 animate-pulse rounded-lg border bg-neutral-100" />;
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
