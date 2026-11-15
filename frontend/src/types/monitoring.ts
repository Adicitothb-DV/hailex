export type PolygonGeometry = { type: 'Polygon'; coordinates: number[][][] };
export type FieldMetrics = { area_ha: number; perimeter_m: number; bbox: number[] };
export type Scene = { item_id: string; acquired_at: string; cloud_cover_scene_percent: number };
export type IndexStats = {
  count: number;
  mean: number;
  median: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
};
export type FieldAnalysis = {
  status: 'success' | 'insufficient_data' | 'no_clear_scene';
  message?: string;
  analysis_id?: string;
  aoi?: {
    geometry: PolygonGeometry;
    area_ha: number;
    perimeter_m: number;
    name: string;
    municipality_label: string;
    crop: string;
  };
  acquired_at?: string;
  item_id?: string;
  cloud_cover_scene_percent?: number;
  valid_pixel_percent_in_aoi?: number;
  ndmi_valid_pixel_percent_in_aoi?: number;
  indices?: { ndvi: IndexStats | null; ndmi: IndexStats | null };
  bbox?: [number, number, number, number];
  layers?: Record<string, string>;
  warnings?: string[];
  limitations?: string[];
};
export type AgricultureRecord = {
  year: number;
  municipality: string;
  crop_original: string;
  cycle: string;
  mode: string;
  unit: string;
  planted: number | null;
  harvested: number | null;
  damaged: number | null;
  volume: number | null;
  yield_reported: number | null;
  production_value: number | null;
  pmr_reported_unverified: number | null;
  workbook_price_unverified: number | null;
  derived_value_per_volume: number | null;
};
export type AgricultureData = {
  status: 'success' | 'empty' | 'source_file_missing';
  records: AgricultureRecord[];
  coverage: {
    years_present: number[];
    years_missing: number[];
    total_rows: number;
    sha256: string;
  } | null;
  source?: string;
  price_warning?: string;
  forecast_status?: string;
};
