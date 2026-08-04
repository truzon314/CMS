import { processGeoJsonUpload, processZipUpload } from "@/lib/gisProcessor";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// Thin proxy: file-format parsing (.shp/.zip/.geojson) stays here since it's
// genuinely easier in Node (shapefile/adm-zip/proj4 have no equivalent
// already in the Python backend) — but persistence is real, in the FastAPI
// backend's map_layer table, not a local JSON file. This route does no
// auth of its own; it just forwards the caller's own Authorization header
// (attached client-side via mappingService.getAuthHeader()) straight
// through, so the backend's own get_current_user/require_permission is the
// only place access is actually checked.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  let fileName = "";
  let projectId = "";
  let fileBuffer: Buffer | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    projectId = (formData.get("projectId") as string) || "";

    if (!file) {
      return Response.json({ error: "No file attached" }, { status: 400 });
    }

    fileName = file.name;
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    try {
      const body = await request.json();
      fileName = body.name || "uploaded_layer.geojson";
      projectId = body.projectId || "";
      if (body.geojson) {
        fileBuffer = Buffer.from(JSON.stringify(body.geojson));
      }
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  if (!fileBuffer || fileBuffer.length === 0) {
    return Response.json({ error: "File buffer is empty" }, { status: 400 });
  }
  if (!projectId) {
    return Response.json({ error: "projectId is required" }, { status: 400 });
  }

  const lowerName = fileName.toLowerCase();
  let result;

  if (lowerName.endsWith(".zip")) {
    result = await processZipUpload(fileBuffer, fileName);
  } else if (lowerName.endsWith(".geojson") || lowerName.endsWith(".json")) {
    result = await processGeoJsonUpload(fileBuffer, fileName);
  } else {
    return Response.json({ error: "Unsupported file format. Upload .geojson, .json, or .zip shapefile." }, { status: 400 });
  }

  if (!result.ok || !result.geojson) {
    return Response.json({ error: result.error || "Failed to process GIS file" }, { status: 400 });
  }

  const backendRes = await fetch(`${API_BASE_URL}/api/v1/mapping/layers/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ project_id: projectId, label: result.layerName || fileName, geojson: result.geojson }),
  });
  const envelope = await backendRes.json();

  if (!envelope.success) {
    return Response.json({ error: envelope.error?.message || "Failed to save layer." }, { status: backendRes.status });
  }

  return Response.json({
    ok: true,
    layer: envelope.data,
    features: result.featureCount,
    crs: result.crs,
  });
}
