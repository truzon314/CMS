import { BlogPostEditorPage } from "@/modules/blog/BlogPostEditorPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BlogPostEditorPage postId={id} />;
}
