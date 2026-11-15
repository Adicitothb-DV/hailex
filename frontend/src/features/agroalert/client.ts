import { apiBase } from '../../services/api';
import type { MoistureData, MunicipalityCollection } from './types';

export interface Response<T> {
  data: T;
  warnings: string[];
}

async function get<T>(path: string, signal: AbortSignal): Promise<Response<T>> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${apiBase}/api/v1/agroalert${path}`, { signal });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error('No se pudo conectar con el backend.', { cause: error });
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = result as { error?: { message?: string } } | null;
    throw new Error(error?.error?.message || 'No se pudo consultar la información.');
  }
  if (!result || typeof result !== 'object' || !('data' in result) || !('warnings' in result))
    throw new Error('Respuesta del servidor inválida.');
  return result as Response<T>;
}

export function getMunicipalities(signal: AbortSignal) {
  return get<MunicipalityCollection>('/municipalities', signal);
}
export function getMoisture(
  municipality: string,
  endDate: string,
  historyDays: number,
  signal: AbortSignal,
) {
  const params = new URLSearchParams({
    municipality,
    end_date: endDate,
    history_days: String(historyDays),
  });
  return get<MoistureData>(`/moisture?${params}`, signal);
}
