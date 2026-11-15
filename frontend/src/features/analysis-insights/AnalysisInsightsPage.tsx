import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageHeading } from '../../components/PageHeading';
import { api } from '../../services/api';
import type { RotationComparison, SavedAnalysis } from '../../types/monitoring';
import { AgriculturalProfile } from './AgriculturalProfile';

const crops = [
  ['maiz_forrajero', 'Maíz forrajero en verde'],
  ['sorgo', 'Sorgo forrajero en verde'],
  ['alfalfa', 'Alfalfa verde'],
  ['cebada', 'Cebada grano'],
] as const;

export function AnalysisInsightsPage() {
  const [previous, setPrevious] = useState('');
  const [region, setRegion] = useState('');
  const [water, setWater] = useState('unknown');
  const [priority, setPriority] = useState(false);
  const [analysisId, setAnalysisId] = useState('');
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [analysisMessage, setAnalysisMessage] = useState('Cargando análisis archivados…');
  const [result, setResult] = useState<RotationComparison | null>(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('hailex-lex-context', {
        detail: { region, crop: previous, water, analysisId },
      }),
    );
  }, [region, previous, water, analysisId]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .savedAnalyses(controller.signal)
      .then(({ data }) => {
        setAnalyses(data);
        setAnalysisMessage(data.length ? '' : 'No hay análisis archivados.');
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setAnalysisMessage('No se pudieron consultar análisis archivados.');
      });
    return () => controller.abort();
  }, []);

  function invalidate() {
    requestVersion.current += 1;
    setResult(null);
    setError('');
    setStatus('idle');
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const version = ++requestVersion.current;
    setStatus('loading');
    setError('');
    setResult(null);
    try {
      const response = await api.compareRotation({
        previous_crop: previous || null,
        region: region || null,
        water_regime: water,
        prioritize_family_change: priority,
        analysis_id: analysisId || null,
      });
      if (version !== requestVersion.current) return;
      setResult(response.data);
      setStatus('success');
    } catch (err) {
      if (version !== requestVersion.current) return;
      setError(err instanceof Error ? err.message : 'No se pudo comparar.');
      setStatus('error');
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="PERFIL Y ROTACIÓN"
        title="Asesor Agrícola"
        description="Registra tu contexto y compara alternativas de rotación con criterios transparentes."
      />
      <AgriculturalProfile />
      <section className="surface agricultural-profile rotation-workspace">
        <h2>Explorar rotación de cultivos</h2>
        <p>
          Elige un análisis archivado si está disponible y declara el cultivo anterior de esa
          parcela. Cada análisis es una observación, no una parcela guardada.
        </p>
        <form onSubmit={submit}>
          <div className="parcel-grid">
            <label className="field">
              Cultivo anterior de esta parcela
              <select
                value={previous}
                onChange={(e) => {
                  setPrevious(e.target.value);
                  invalidate();
                }}
              >
                <option value="">No registrado</option>
                {crops.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Municipio declarado
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  invalidate();
                }}
              >
                <option value="">No registrado</option>
                <option value="el_marques_queretaro">El Marqués</option>
                <option value="colon_queretaro">Colón</option>
              </select>
            </label>
            <label className="field">
              Modalidad declarada
              <select
                value={water}
                onChange={(e) => {
                  setWater(e.target.value);
                  invalidate();
                }}
              >
                <option value="unknown">Desconocida</option>
                <option value="rainfed">Temporal</option>
                <option value="irrigated">Riego</option>
              </select>
            </label>
            <label className="field">
              Análisis satelital archivado (opcional)
              <select
                value={analysisId}
                onChange={(e) => {
                  setAnalysisId(e.target.value);
                  invalidate();
                }}
              >
                <option value="">Ninguno</option>
                {analyses.map((a) => (
                  <option key={a.analysis_id} value={a.analysis_id}>
                    {a.name || 'Sin nombre'} · {a.acquired_at || 'fecha desconocida'} ·{' '}
                    {a.analysis_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {analysisMessage && <p>{analysisMessage}</p>}
          <label>
            <input
              type="checkbox"
              checked={priority}
              onChange={(e) => {
                setPriority(e.target.checked);
                invalidate();
              }}
            />{' '}
            Priorizar cambio de familia botánica (criterio elegido por mí)
          </label>
          <div className="monitor-actions">
            <button className="button button-primary" disabled={status === 'loading'}>
              Comparar opciones
            </button>
          </div>
        </form>
        {status === 'loading' && <p role="status">Preparando comparación…</p>}
        {status === 'error' && <p role="alert">{error}</p>}
        {result && (
          <div>
            <h3>Opciones para evaluar</h3>
            <p>
              {result.ordering === 'family_change_requested'
                ? 'Ordenadas únicamente por cambio de familia solicitado; no es un ranking de aptitud ni rentabilidad.'
                : 'Sin orden de preferencia: selecciona el cultivo anterior y activa el criterio de familia para aplicar ese único orden.'}
            </p>
            <ol>
              {result.options.map((option) => (
                <li key={option.crop_id}>
                  <strong>{option.name}</strong> · {option.family || 'Familia desconocida'} ·{' '}
                  {option.same_family_as_previous === null
                    ? 'familia anterior no evaluable'
                    : option.same_family_as_previous
                      ? 'misma familia anterior'
                      : 'familia distinta'}
                  {option.repeated_crop ? ' · cultivo repetido' : ''}
                </li>
              ))}
            </ol>
            <h3>Factores y datos faltantes</h3>
            <p>
              Suelo, requerimientos de agua, calendario, clima y economía: no evaluables para
              ordenar con los datos disponibles. Municipio y modalidad son datos declarados, no
              prueban aptitud.
            </p>
            {result.satellite && (
              <div>
                <h3>Contexto satelital seleccionado</h3>
                <p>
                  Fecha: {result.satellite.acquired_at || 'No disponible'} · NDVI medio:{' '}
                  {result.satellite.ndvi?.mean ?? 'No disponible'} · NDMI medio:{' '}
                  {result.satellite.ndmi?.mean ?? 'No disponible'} · Cobertura válida NDVI:{' '}
                  {result.satellite.valid_pixel_percent_in_aoi == null
                    ? 'No disponible'
                    : `${result.satellite.valid_pixel_percent_in_aoi}%`}
                </p>
                <p>{result.satellite.note}</p>
              </div>
            )}
            <h3>Limitaciones y siguiente paso</h3>
            <ul>
              {result.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              Consulta a un técnico local y revisa agua, suelo, calendario, costos y mercado antes
              de decidir. Pronóstico numérico: no confiable.
            </p>
            <p className="fine-print">
              Familias botánicas: catálogo local HaiLex; referencias{' '}
              <a
                href="https://www.fao.org/4/s4314e/s4314e0x.htm"
                target="_blank"
                rel="noopener noreferrer"
              >
                FAO
              </a>{' '}
              y{' '}
              <a
                href="https://dof.gob.mx/nota_detalle_popup.php?codigo=5592222"
                target="_blank"
                rel="noopener noreferrer"
              >
                DOF
              </a>
              .
            </p>
          </div>
        )}
      </section>
      <button
        className="button button-primary"
        type="button"
        onClick={() => window.dispatchEvent(new Event('hailex-open-lex'))}
      >
        Consultar a Lex
      </button>
    </>
  );
}
