declare module "shapefile" {
  export function open(
    shp: string | Buffer | ArrayBuffer,
    dbf?: string | Buffer | ArrayBuffer,
    options?: any
  ): Promise<{
    read(): Promise<{ done: boolean; value?: any }>;
  }>;
}
