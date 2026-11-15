import type { ClimateSeries, Envelope, Health, SourceEntry } from '../types/api';

const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

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
export const api = {
  health: (signal?: AbortSignal) => request<Health>('/health', signal),
  sources: (signal?: AbortSignal) => request<{ sources: SourceEntry[] }>('/sources', signal),
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
