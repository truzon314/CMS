"use client";

import { useState, useRef } from "react";
import { mappingService } from "@/services/mapping";

type Props = {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function GisUploadModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    setStatus(null);
    const name = file.name.toLowerCase();
    if (
      !name.endsWith(".geojson") &&
      !name.endsWith(".json") &&
      !name.endsWith(".zip") &&
      !name.endsWith(".shp")
    ) {
      setError(
        "Please upload a .geojson, .json, .shp, or .zip shapefile archive.",
      );
      return;
    }
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setStatus("Uploading and validating GIS layer...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("projectId", projectId);

      const res = await fetch("/api/gis/upload", {
        method: "POST",
        headers: mappingService.getAuthHeader(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }

      setStatus(
        `Successfully imported ${data.features} features (${data.crs || "EPSG:4326"}).`,
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch {
      setError("Network error during file upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-base font-semibold text-zinc-900">
            Upload GIS Layer (.shp, .geojson, .zip)
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50/50"
                : "border-zinc-300 bg-zinc-50 hover:bg-zinc-100/80"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".geojson,.json,.zip,.shp"
              onChange={handleChange}
              className="hidden"
            />
            <svg
              className="h-10 w-10 text-zinc-400 mb-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <p className="text-sm font-medium text-zinc-800">
              Drag & drop shapefile (.zip), Shapefile (.shp), or GeoJSON here
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Supports .geojson, .shp (with .dbf/.prj), or zipped Shapefiles
            </p>
          </div>

          {selectedFile && (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-2.5">
              <span className="truncate text-xs font-mono text-zinc-700">
                📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{" "}
                KB)
              </span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-xs text-red-500 hover:underline ml-2 shrink-0"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
          )}
          {status && (
            <p className="mt-2 text-xs font-medium text-blue-600">{status}</p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              onClick={uploadFile}
              disabled={!selectedFile || uploading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Importing..." : "Upload & Display on Map"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
