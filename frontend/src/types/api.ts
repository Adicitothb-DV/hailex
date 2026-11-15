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
export type EvidenceStatus = 'verified_local' | 'documented_general' | 'provisional' | 'unknown';
export interface CropAttribute {
  name: string;
  value: string | number | boolean | null;
  unit: string | null;
  source_refs: string[];
  evidence_status: EvidenceStatus;
  limitations: string[];
}
export interface Crop {
  id: string;
  common_name: string;
  scientific_name: string | null;
  botanical_family: string | null;
  attributes: CropAttribute[];
  identity_source_refs: Record<string, string[]>;
  evidence_status: EvidenceStatus;
  limitations: string[];
}
export interface CropCatalog {
  catalog_version: string;
  data_type: 'documented_reference' | 'simulation';
  display_label: string | null;
  crops: Crop[];
  sources: Source[];
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
