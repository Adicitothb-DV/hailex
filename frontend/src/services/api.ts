import type { ClimateSeries, CropCatalog, Envelope, Health, SourceEntry } from '../types/api';
import type {
  AgricultureData,
  FieldAnalysis,
  FieldMetrics,
  PolygonGeometry,
  Scene,
  SavedAnalysis,
} from '../types/monitoring';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
export const apiBase = base;

async function post<T>(path: string, body: unknown): Promise<Envelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    throw new Error('No se pudo conectar con el backend o la consulta agotó el tiempo.', {
      cause: error,
    });
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = result as { error?: { message?: string } } | null;
    throw new Error(error?.error?.message || `Error HTTP ${response.status}`);
  }
  if (!result || typeof result !== 'object' || !('data' in result) || !('warnings' in result))
    throw new Error('Respuesta inválida.');
  return result as Envelope<T>;
}

async function request<T>(path: string, signal?: AbortSignal): Promise<Envelope<T>> {
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1${path}`, {
      signal: signal ?? null,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      'No se pudo conectar con el backend. Comprueba que esté en ejecución y que CORS permita este origen.',
      { cause: error },
    );
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body as { error?: { message?: string; code?: string } } | null;
    throw new Error(error?.error?.message || `Error HTTP ${response.status}`);
  }
  if (
    !body ||
    typeof body !== 'object' ||
    !('data' in body) ||
    !('warnings' in body) ||
    !Array.isArray(body.warnings)
  ) {
    throw new Error('La respuesta del servicio no coincide con el contrato.');
  }
  return body as Envelope<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
function validCatalog(value: unknown): value is CropCatalog {
  if (
    !isRecord(value) ||
    typeof value.catalog_version !== 'string' ||
    !['documented_reference', 'simulation'].includes(String(value.data_type)) ||
    !(value.display_label === null || typeof value.display_label === 'string') ||
    !Array.isArray(value.crops) ||
    !Array.isArray(value.sources)
  )
    return false;
  const statuses = ['verified_local', 'documented_general', 'provisional', 'unknown'];
  return (
    value.sources.every(
      (source: unknown) =>
        isRecord(source) &&
        typeof source.id === 'string' &&
        typeof source.organization === 'string' &&
        typeof source.product === 'string' &&
        (source.reference === null || typeof source.reference === 'string') &&
        isStrings(source.limitations),
    ) &&
    value.crops.every(
      (crop: unknown) =>
        isRecord(crop) &&
        typeof crop.id === 'string' &&
        typeof crop.common_name === 'string' &&
        (crop.scientific_name === null || typeof crop.scientific_name === 'string') &&
        (crop.botanical_family === null || typeof crop.botanical_family === 'string') &&
        statuses.includes(String(crop.evidence_status)) &&
        isStrings(crop.limitations) &&
        isRecord(crop.identity_source_refs) &&
        Object.values(crop.identity_source_refs).every(isStrings) &&
        Array.isArray(crop.attributes) &&
        crop.attributes.every(
          (attribute: unknown) =>
            isRecord(attribute) &&
            typeof attribute.name === 'string' &&
            (attribute.value === null ||
              ['string', 'number', 'boolean'].includes(typeof attribute.value)) &&
            (attribute.unit === null || typeof attribute.unit === 'string') &&
            isStrings(attribute.source_refs) &&
            statuses.includes(String(attribute.evidence_status)) &&
            isStrings(attribute.limitations),
        ),
    )
  );
}
export const api = {
  savedAnalyses: (signal?: AbortSignal) => request<SavedAnalysis[]>('/fields/analyses', signal),
  savedAnalysis: (id: string, signal?: AbortSignal) =>
    request<FieldAnalysis>(`/fields/analyses/${encodeURIComponent(id)}`, signal),
  validateField: (geometry: PolygonGeometry) =>
    post<FieldMetrics>('/fields/validate', { geometry }),
  scenes: (body: unknown) => post<Scene[]>('/fields/scenes', body),
  analyzeField: (body: unknown) => post<FieldAnalysis>('/fields/analyses', body),
  agriculture: (query: URLSearchParams, signal?: AbortSignal) =>
    request<AgricultureData>(`/agriculture/series?${query}`, signal),
  health: (signal?: AbortSignal) => request<Health>('/health', signal),
  sources: (signal?: AbortSignal) => request<{ sources: SourceEntry[] }>('/sources', signal),
  crops: async (signal?: AbortSignal) => {
    const result = await request<CropCatalog>('/crops', signal);
    if (!validCatalog(result.data)) {
      throw new Error('El catálogo recibido no coincide con el contrato.');
    }
    return result;
  },
  climate: (
    latitude: number,
    longitude: number,
    start_date: string,
    end_date: string,
    signal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      start_date,
      end_date,
    });
    return request<ClimateSeries>(`/climate/series?${query}`, signal);
  },
};
