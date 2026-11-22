export type Municipality = 'El Marqués' | 'Colón';
export type Parameter = 'SFMC' | 'RZMC' | 'SFMC_PRCNTL' | 'RZMC_PRCNTL';
export type Palette = 'agro' | 'thermal' | 'nasa_smap' | 'vivid';
export type Theme = 'light' | 'satellite' | 'topo' | 'dark';
export type SoilKey = 'SFMC' | 'RZMC' | 'GWETTOP' | 'GWETROOT';

export interface Cell {
  cell_id: string;
  municipality: Municipality;
  latitude: number;
  longitude: number;
  label_latitude: number;
  label_longitude: number;
  coverage_percent: number;
  sector_name: string;
  nearest_landmark: string;
  clipped_geometry: GeoJSON.Geometry;
}

export interface Reading {
  date: string;
  cell_id: string;
  sector_name: string;
  nearest_landmark: string;
  latitude: number;
  longitude: number;
  coverage_percent: number;
  SFMC: number | null;
  RZMC: number | null;
  GWETTOP: number | null;
  GWETROOT: number | null;
  SFMC_PRCNTL: number | null;
  RZMC_PRCNTL: number | null;
  active_surface_parameter: 'SFMC' | 'GWETTOP';
  active_root_parameter: 'RZMC' | 'GWETROOT';
  source_model: string;
  unit: string;
  baseline_start: string;
  status?: string;
  interpretation?: string;
}

export interface Daily {
  date: string;
  source_model: string;
  SFMC: number | null;
  RZMC: number | null;
  GWETTOP: number | null;
  GWETROOT: number | null;
  SFMC_PRCNTL: number | null;
  RZMC_PRCNTL: number | null;
  status?: string;
  interpretation?: string;
}

export interface MoistureData {
  municipality: Municipality;
  boundary: GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;
  start_date: string;
  end_date: string;
  retrieved_at: string;
  cells: Cell[];
  cell_readings: Reading[];
  latest_by_cell: Reading[];
  daily: Daily[];
  failed_cell_count: number;
  successful_cell_count: number;
}

export interface MunicipalityCollection {
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;
  landmarks: Record<Municipality, [string, number, number][]>;
}

export function selectedValue(reading: Reading, parameter: Parameter): number | null {
  if (parameter === 'SFMC') return reading[reading.active_surface_parameter];
  if (parameter === 'RZMC') return reading[reading.active_root_parameter];
  return reading[parameter];
}

export function formatValue(value: number | null | undefined, unit = ''): string {
  if (value == null || !Number.isFinite(value)) return 'Sin dato';
  return `${value.toFixed(unit === '%' ? 1 : 3)}${unit ? ` ${unit}` : ''}`;
}
