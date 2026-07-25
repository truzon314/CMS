"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/ui/status-pill";
import { SelectField } from "@/components/forms/SelectField";
import { useBlogPostsList, useCreateBlogPost } from "@/hooks/useBlog";
import { NewPostDialog } from "@/modules/blog/NewPostDialog";
import type { BlogPostListItem } from "@/types/blog";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

export function BlogPostsListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const createPost = useCreateBlogPost();

  const { data, isLoading } = useBlogPostsList({ search: search || undefined, status: status || undefined });

  const columns: ColumnDef<BlogPostListItem>[] = [
    { id: "title", header: "Title", cell: (p) => p.title },
    {
      id: "categories",
      header: "Categories",
      cell: (p) => (p.category_names.length ? p.category_names.join(", ") : "—"),
    },
    { id: "author", header: "Author", cell: (p) => p.author_name },
    { id: "status", header: "Status", cell: (p) => <StatusPill status={p.status} /> },
    {
      id: "featured",
      header: "Featured",
      cell: (p) => (p.is_featured ? <Badge variant="outline">Featured</Badge> : null),
    },
    {
      id: "published_at",
      header: "Published",
      cell: (p) => (p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Blog</h1>
        <Button onClick={() => setNewPostOpen(true)}>
          <Plus size={16} />
          New Post
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="w-44">
          <SelectField label="" id="status_filter" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        getRowId={(p) => p.id}
        onRowClick={(p) => router.push(`/blog/posts/${p.id}`)}
        emptyTitle="No blog posts yet"
        emptyDescription="Publish your first post to get started."
      />

      <NewPostDialog
        open={newPostOpen}
        isLoading={createPost.isPending}
        onClose={() => setNewPostOpen(false)}
        onConfirm={async (payload) => {
          const created = await createPost.mutateAsync(payload);
          setNewPostOpen(false);
          router.push(`/blog/posts/${created.id}`);
        }}
      />
    </div>
  );
}
