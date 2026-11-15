export interface Envelope<T> {
  data: T;
  warnings: string[];
}
export interface Health {
  status: 'ok';
  service: 'hailex-api';
  version: string;
  contract_version: string;
}
export interface Source {
  id: string;
  organization: string;
  product: string;
  endpoint: string | null;
  product_version: string | null;
  reference: string | null;
  status: 'implemented' | 'partial' | 'planned' | 'unavailable';
  limitations: string[];
}
export interface SourceEntry extends Source {
  parameters: string[];
}
export interface Variable {
  id: string;
  source_id: string;
  unit: string | null;
  data_type: 'observation' | 'estimate' | 'model' | 'derived' | 'simulation' | 'unknown';
  spatial_resolution: string | null;
  temporal_resolution: 'daily';
  valid_count: number;
  missing_count: number;
  limitations: string[];
}
export type VariableId = 'T2M' | 'PRECTOTCORR' | 'ALLSKY_SFC_SW_DWN';
export interface ClimatePoint {
  date: string;
  T2M: number | null;
  PRECTOTCORR: number | null;
  ALLSKY_SFC_SW_DWN: number | null;
}
export interface ClimateSeries {
  snapshot_id: string;
  snapshot_expires_at: string;
  location: { latitude: number; longitude: number };
  period: { start_date: string; end_date: string };
  community: 'AG';
  time_standard: 'UTC';
  normalizer_version: string;
  source: Source;
  retrieval: {
    retrieval_mode: 'upstream' | 'cache' | 'historical_fixture' | 'demo_fixture';
    retrieved_at: string | null;
    served_at: string;
    display_label: string | null;
  };
  variables: Variable[];
  series: ClimatePoint[];
}
