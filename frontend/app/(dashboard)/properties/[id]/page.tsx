import { PropertyEditorPage } from "@/modules/properties/PropertyEditorPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropertyEditorPage propertyId={id} />;
}
