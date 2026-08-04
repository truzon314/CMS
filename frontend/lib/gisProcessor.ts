import { createHash } from "node:crypto";
import path from "node:path";
import { open as openShapefile } from "shapefile";
import AdmZip from "adm-zip";
import proj4 from "proj4";
import type { FeatureCollection, Feature, Geometry } from "geojson";

export type UploadValidationResult = {
  ok: boolean;
  error?: string;
  geojson?: FeatureCollection;
  layerName?: string;
  crs?: string;
  featureCount?: number;
  contentHash?: string;
};

const WGS84 = "EPSG:4326";

export function computeContentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function isValidGeometry(geom: Geometry | null): boolean {
  if (!geom || !geom.type) return false;
  const validTypes = ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"];
  return validTypes.includes(geom.type);
}

export function reprojectFeatureCollection(fc: FeatureCollection, prjText?: string): FeatureCollection {
  if (!prjText || prjText.trim() === "") return fc;

  try {
    if (prjText.includes("WGS_1984") || prjText.includes("EPSG:4326") || prjText.includes("4326")) {
      return fc;
    }

    const reprojectCoords = (coords: any): any => {
      if (typeof coords[0] === "number") {
        const [x, y] = coords;
        const [lng, lat] = proj4(prjText, WGS84, [x, y]);
        return [lng, lat];
      }
      return coords.map(reprojectCoords);
    };

    const reprojectGeom = (geom: Geometry | null): Geometry | null => {
      if (!geom) return null;
      if (geom.type === "GeometryCollection") {
        return {
          ...geom,
          geometries: geom.geometries.map((g) => reprojectGeom(g)!).filter(Boolean),
        };
      }
      return {
        ...geom,
        coordinates: reprojectCoords(geom.coordinates),
      };
    };

    const features = fc.features.map((f) => ({
      ...f,
      geometry: reprojectGeom(f.geometry)!,
    }));

    return { ...fc, features };
  } catch (err) {
    console.warn("CRS reprojection notice:", err);
    return fc;
  }
}

export async function processGeoJsonUpload(buffer: Buffer, fileName: string): Promise<UploadValidationResult> {
  const contentHash = computeContentHash(buffer);
  let parsed: any;
  try {
    parsed = JSON.parse(buffer.toString("utf-8"));
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }

  if (!parsed || parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    return { ok: false, error: "Uploaded file is not a valid GeoJSON FeatureCollection." };
  }

  const validFeatures: Feature[] = parsed.features.filter((f: Feature) => isValidGeometry(f.geometry));
  if (validFeatures.length === 0) {
    return { ok: false, error: "GeoJSON contains no valid vector geometries." };
  }

  const layerName = fileName.replace(/\.(geojson|json)$/i, "");
  return {
    ok: true,
    geojson: { type: "FeatureCollection", features: validFeatures },
    layerName,
    featureCount: validFeatures.length,
    crs: "EPSG:4326",
    contentHash,
  };
}

export async function processZipUpload(buffer: Buffer, fileName: string): Promise<UploadValidationResult> {
  const contentHash = computeContentHash(buffer);
  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return { ok: false, error: "Invalid or corrupted ZIP archive." };
  }

  const zipEntries = zip.getEntries();
  const shpEntry = zipEntries.find((e) => e.entryName.toLowerCase().endsWith(".shp"));
  if (!shpEntry) {
    return { ok: false, error: "No .shp file found inside the ZIP archive." };
  }

  const baseName = shpEntry.entryName.slice(0, -4).toLowerCase();
  const dbfEntry = zipEntries.find((e) => e.entryName.toLowerCase() === `${baseName}.dbf`);
  const prjEntry = zipEntries.find((e) => e.entryName.toLowerCase() === `${baseName}.prj`);

  const shpBuf = shpEntry.getData();
  const dbfBuf = dbfEntry ? dbfEntry.getData() : undefined;
  const prjText = prjEntry ? prjEntry.getData().toString("utf-8") : undefined;

  try {
    const source = await openShapefile(shpBuf, dbfBuf);
    const features: Feature[] = [];
    let result = await source.read();
    while (!result.done) {
      if (result.value && isValidGeometry(result.value.geometry)) {
        features.push(result.value as Feature);
      }
      result = await source.read();
    }

    if (features.length === 0) {
      return { ok: false, error: "Shapefile inside ZIP contains no valid features." };
    }

    let fc: FeatureCollection = { type: "FeatureCollection", features };
    fc = reprojectFeatureCollection(fc, prjText);

    const layerName = path.basename(shpEntry.entryName, ".shp");
    return {
      ok: true,
      geojson: fc,
      layerName,
      featureCount: features.length,
      crs: prjText ? "Custom / Reprojected" : "EPSG:4326",
      contentHash,
    };
  } catch (err: any) {
    return { ok: false, error: `Shapefile parsing failed: ${err?.message || "Invalid shapefile structure"}` };
  }
}
