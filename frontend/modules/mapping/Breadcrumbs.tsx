"use client";

type Props = {
  companyName?: string;
  projectName?: string;
  activeLayerName?: string;
};

export default function Breadcrumbs({
  companyName = "Company Workspace",
  projectName,
  activeLayerName,
}: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
      <span className="hover:text-zinc-800 cursor-pointer">
        🏢 {companyName}
      </span>
      {projectName && (
        <>
          <span className="text-zinc-300">/</span>
          <span className="font-semibold text-zinc-900 truncate max-w-[140px]">
            📁 {projectName}
          </span>
        </>
      )}
      {activeLayerName && (
        <>
          <span className="text-zinc-300">/</span>
          <span className="text-blue-600 truncate max-w-[120px]">
            🥞 {activeLayerName}
          </span>
        </>
      )}
    </nav>
  );
}
