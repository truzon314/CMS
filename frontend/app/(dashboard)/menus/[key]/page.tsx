import { MenuEditorPage } from "@/modules/menus/MenuEditorPage";

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <MenuEditorPage menuKey={key} />;
}
