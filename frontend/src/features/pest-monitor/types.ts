export type Municipality = 'El Marqués' | 'Colón';
export interface Sector {
  id: string;
  name: string;
  lat: number;
  lon: number;
  crops: string[];
  geometry: GeoJSON.Geometry | null;
}
export interface Region {
  sectors: Sector[];
  boundary: GeoJSON.Feature;
  data_type: string;
}
export interface Weather {
  id?: string;
  temp?: number | null;
  rh?: number | null;
  rain7d?: number | null;
  soil?: number | null;
  date?: string;
  error?: string;
  data_type?: string;
}
export interface Pest {
  id: string;
  name: string;
  scientific: string;
  crops: string[];
  inspect: string;
  score: number | null;
  missing: string[];
  status: string;
}
export interface Evaluation {
  id: string;
  overall: number | null;
  pests: Pest[];
  data_type: string;
}
