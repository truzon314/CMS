"use client";

import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/data-table/DataTable";
import { useCareersList } from "@/hooks/useCareers";
import { CareerDrawer } from "@/modules/careers/CareerDrawer";
import type { Career } from "@/types/career";

export function CareersListPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useCareersList();
  const careers = data?.data ?? [];
  const selected = careers.find((c) => c.id === selectedId) ?? null;
  const drawerOpen = creating || !!selected;

  function closeDrawer() {
    setSelectedId(null);
    setCreating(false);
  }

  const columns: ColumnDef<Career>[] = [
    { id: "title", header: "Title", cell: (c) => c.title },
    { id: "department", header: "Department", cell: (c) => c.department ?? "—" },
    { id: "location", header: "Location", cell: (c) => c.location ?? "—" },
    { id: "employment_type", header: "Type", cell: (c) => c.employment_type ?? "—" },
    {
      id: "is_published",
      header: "Status",
      cell: (c) => (
        <span
          className={
            c.is_published
              ? "inline-flex items-center gap-1.5 rounded-full bg-[#e6f4ea] px-3 py-0.5 text-xs font-semibold text-[#137333] border border-[#ceead6]"
              : "inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200"
          }
        >
          {c.is_published ? "Published" : "Draft"}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Briefcase size={18} />
            Careers
          </h1>
          <p className="text-sm text-neutral-500">Job postings shown on the public Careers page.</p>
        </div>
        <Button
          onClick={() => {
            setSelectedId(null);
            setCreating(true);
          }}
        >
          <Plus size={14} />
          New Posting
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={careers}
        isLoading={isLoading}
        getRowId={(c) => c.id}
        onRowClick={(c) => {
          setCreating(false);
          setSelectedId(c.id);
        }}
        emptyTitle="No career postings yet"
        emptyDescription="Job postings you publish here will show up on the public Careers page."
      />

      <CareerDrawer career={creating ? null : selected} open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
}
