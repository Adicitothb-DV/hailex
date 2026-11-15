import { useEffect, useState } from 'react';
import { PageHeading } from '../../components/PageHeading';
import { api } from '../../services/api';
import type { AgricultureData } from '../../types/monitoring';

const format = (value: number | null) =>
  value === null ? 'No disponible' : value.toLocaleString('es-MX', { maximumFractionDigits: 2 });

export function AnalysisInsightsPage() {
  const [region, setRegion] = useState('el_marques_queretaro');
  const [crop, setCrop] = useState('');
  const [cycle, setCycle] = useState('');
  const [mode, setMode] = useState('');
  const [result, setResult] = useState<AgricultureData | null>(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ region });
    if (crop) params.set('crop', crop);
    if (cycle) params.set('cycle', cycle);
    if (mode) params.set('mode', mode);
    api
      .agriculture(params, controller.signal)
      .then((r) => {
        setResult(r.data);
        setStatus(r.data.status);
        setError('');
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) {
          setStatus('error');
          setError(e instanceof Error ? e.message : 'No se pudo consultar el historial.');
        }
      });
    return () => controller.abort();
  }, [region, crop, cycle, mode]);
  return (
    <>
      <PageHeading
        eyebrow="HISTORIAL AGRÍCOLA"
        title="Agricultural Context"
        description="Consulta el libro consolidado proporcionado por el equipo. Sus registros son municipales, no mediciones de la parcela."
      />
      <section className="surface">
        <div className="parcel-grid">
          <label className="field">
            Municipio
            <select
              value={region}
              onChange={(e) => {
                setStatus('loading');
                setRegion(e.target.value);
              }}
            >
              <option value="el_marques_queretaro">El Marqués</option>
              <option value="colon_queretaro">Colón</option>
            </select>
          </label>
          <label className="field">
            Cultivo
            <select
              value={crop}
              onChange={(e) => {
                setStatus('loading');
                setCrop(e.target.value);
              }}
            >
              <option value="">Todos</option>
              <option value="maiz_forrajero">Maíz forrajero en verde</option>
              <option value="alfalfa">Alfalfa verde</option>
              <option value="cebada">Cebada grano</option>
              <option value="sorgo">Sorgo forrajero en verde</option>
            </select>
          </label>
          <label className="field">
            Ciclo
            <select
              value={cycle}
              onChange={(e) => {
                setStatus('loading');
                setCycle(e.target.value);
              }}
            >
              <option value="">Todos</option>
              <option>Primavera-Verano</option>
              <option>Otoño-Invierno</option>
              <option>Perennes</option>
            </select>
          </label>
          <label className="field">
            Modalidad
            <select
              value={mode}
              onChange={(e) => {
                setStatus('loading');
                setMode(e.target.value);
              }}
            >
              <option value="">Todas</option>
              <option>Riego</option>
              <option>Temporal</option>
            </select>
          </label>
        </div>
        {status === 'loading' && <p role="status">Cargando datos agrícolas…</p>}
        {status === 'error' && <p role="alert">{error}</p>}
        {status === 'source_file_missing' && (
          <p role="status">No se encontró el libro original en backend/data/raw/siap.</p>
        )}
        {status === 'empty' && <p>No hay registros para estos filtros.</p>}
        {result?.coverage && status !== 'loading' && (
          <>
            <p>
              Libro: {result.coverage.total_rows} registros · años disponibles:{' '}
              {result.coverage.years_present.join(', ')}.
            </p>
            <p>
              <strong>Brecha temporal:</strong> {result.coverage.years_missing.join(', ')}. No se
              interpolan años faltantes.
            </p>
            <p>{result.price_warning}</p>
            <p>Pronóstico: no confiable; no se presentan cifras futuras.</p>
            <p className="fine-print">
              {result.source}. SHA-256: {result.coverage.sha256}
            </p>
          </>
        )}
        {status === 'success' && result && (
          <div className="agriculture-table-wrap">
            <table className="agriculture-table">
              <thead>
                <tr>
                  <th>Año</th>
                  <th>Cultivo</th>
                  <th>Ciclo / modalidad</th>
                  <th>Sembrada</th>
                  <th>Cosechada</th>
                  <th>Siniestrada</th>
                  <th>Producción</th>
                  <th>Rendimiento reportado</th>
                  <th>Valor producción</th>
                  <th>Preciomediorural reportado</th>
                  <th>Precio libro no verificado</th>
                  <th>Valor / volumen derivado</th>
                </tr>
              </thead>
              <tbody>
                {result.records.map((r, i) => (
                  <tr key={`${r.year}-${r.crop_original}-${r.cycle}-${r.mode}-${i}`}>
                    <td>{r.year}</td>
                    <td>{r.crop_original}</td>
                    <td>
                      {r.cycle} / {r.mode}
                    </td>
                    <td>{format(r.planted)}</td>
                    <td>{format(r.harvested)}</td>
                    <td>{format(r.damaged)}</td>
                    <td>
                      {format(r.volume)} {r.unit}
                    </td>
                    <td>{format(r.yield_reported)}</td>
                    <td>{format(r.production_value)}</td>
                    <td>{r.volume === 0 ? 'Sin producción' : format(r.pmr_reported_unverified)}</td>
                    <td>
                      {r.volume === 0 ? 'Sin producción' : format(r.workbook_price_unverified)}
                    </td>
                    <td>{format(r.derived_value_per_volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="fine-print">
          Superficies, unidades monetarias y diccionario deben verificarse con la fuente original.
          No se mezclan precios ni se eliminan registros de pérdida total.
        </p>
      </section>
    </>
  );
}
