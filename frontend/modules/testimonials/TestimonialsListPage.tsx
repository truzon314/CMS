"use client";

import { useState } from "react";
import { Plus, Quote, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useTestimonialsList } from "@/hooks/useTestimonials";
import { TestimonialDrawer } from "@/modules/testimonials/TestimonialDrawer";
import type { Testimonial } from "@/types/testimonial";

export function TestimonialsListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useTestimonialsList();
  const testimonials = data?.data ?? [];
  const selected = testimonials.find((t) => t.id === selectedId) ?? null;
  const drawerOpen = creating || !!selected;

  function closeDrawer() {
    setSelectedId(null);
    setCreating(false);
  }

  const columns: ColumnDef<Testimonial>[] = [
    { id: "name", header: "Name", cell: (t) => t.name },
    { id: "role", header: "Role / Location", cell: (t) => t.role_or_location ?? "—" },
    { id: "quote", header: "Quote", cell: (t) => <span className="line-clamp-1 max-w-xs">{t.quote}</span> },
    {
      id: "rating",
      header: "Rating",
      cell: (t) =>
        t.rating ? (
          <span className="flex items-center gap-1">
            <Star size={13} className="fill-amber-400 text-amber-400" /> {t.rating}
          </span>
        ) : (
          "—"
        ),
    },
    {
      id: "status",
      header: "Status",
      cell: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.is_featured ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-200">
              Featured
            </span>
          ) : null}
          <span
            className={
              t.is_published
                ? "inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[11px] font-semibold text-[#137333] border border-[#ceead6]"
                : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200"
            }
          >
            {t.is_published ? "Published" : "Draft"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Quote size={18} />
            Testimonials
          </h1>
          <p className="text-sm text-neutral-500">
            Resident quotes shown on the public Testimonials page — mark one "Featured" to show it in the Home page carousel.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedId(null);
            setCreating(true);
          }}
        >
          <Plus size={14} />
          New Testimonial
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={testimonials}
        isLoading={isLoading}
        getRowId={(t) => t.id}
        onRowClick={(t) => {
          setCreating(false);
          setSelectedId(t.id);
        }}
        emptyTitle="No testimonials yet"
        emptyDescription="Resident quotes you publish here will show up on the public Testimonials page and (if featured) the Home page."
      />

      <TestimonialDrawer testimonial={creating ? null : selected} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
