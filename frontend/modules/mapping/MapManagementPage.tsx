"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/modules/mapping/MapView"),
  { ssr: false }
);

export function MapManagementPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0f172a] shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Map & GIS Management System
          </h1>
          <p className="text-xs text-slate-400">
            Spatial data, interactive GIS layers, map providers, and location analytics admin.
          </p>
        </div>
      </div>
      <div className="relative flex-1 w-full h-full">
        <MapView mode="admin" />
      </div>
    </div>
  );
}

export default MapManagementPage;
