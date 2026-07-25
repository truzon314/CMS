import { notFound } from "next/navigation";
import { PageEditorPage } from "@/modules/pages/PageEditorPage";
import type { PageType } from "@/types/page";

const VALID_PAGE_TYPES: PageType[] = ["home", "about", "projects", "blog", "contact"];

export default async function Page({ params }: { params: Promise<{ pageType: string }> }) {
  const { pageType } = await params;
  if (!VALID_PAGE_TYPES.includes(pageType as PageType)) notFound();

  return <PageEditorPage pageType={pageType as PageType} />;
}
