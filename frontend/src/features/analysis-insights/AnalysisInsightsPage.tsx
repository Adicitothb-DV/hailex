import { useEffect, useRef, useState, type FormEvent } from 'react';
import { PageHeading } from '../../components/PageHeading';
import { api } from '../../services/api';
import type { RotationComparison, SavedAnalysis } from '../../types/monitoring';
import { AgriculturalProfile } from './AgriculturalProfile';
import { useTranslation } from 'react-i18next';

const crops = [
  ['maiz_forrajero', 'Maíz forrajero en verde'],
  ['sorgo', 'Sorgo forrajero en verde'],
  ['alfalfa', 'Alfalfa verde'],
  ['cebada', 'Cebada grano'],
] as const;

export function AnalysisInsightsPage() {
  const { t, i18n } = useTranslation();
  const english = i18n.resolvedLanguage === 'en-US';
  const text = (es: string, en: string) => (english ? en : es);
  const [previous, setPrevious] = useState('');
  const [region, setRegion] = useState('');
  const [water, setWater] = useState('unknown');
  const [priority, setPriority] = useState(false);
  const [analysisId, setAnalysisId] = useState('');
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [analysisMessage, setAnalysisMessage] = useState('loading');
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
        setAnalysisMessage(data.length ? '' : 'empty');
      })
      .catch(() => {
        if (!controller.signal.aborted) setAnalysisMessage('error');
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
        eyebrow={text('PERFIL Y ROTACIÓN', 'PROFILE AND ROTATION')}
        title={t('analysis-insights')}
        description={text(
          'Registra tu contexto y compara alternativas de rotación con criterios transparentes.',
          'Record your context and compare rotation alternatives using transparent criteria.',
        )}
      />
      <AgriculturalProfile />
      <section className="surface agricultural-profile rotation-workspace">
        <h2>{text('Explorar rotación de cultivos', 'Explore crop rotation')}</h2>
        <p>
          {text(
            'Elige un análisis archivado si está disponible y declara el cultivo anterior de esa parcela. Cada análisis es una observación, no una parcela guardada.',
            'Select an archived analysis if available and specify the previous crop for that field. Each analysis is an observation, not a saved field.',
          )}
        </p>
        <form onSubmit={submit}>
          <div className="parcel-grid">
            <label className="field">
              {text('Cultivo anterior de esta parcela', 'Previous crop in this field')}
              <select
                value={previous}
                onChange={(e) => {
                  setPrevious(e.target.value);
                  invalidate();
                }}
              >
                <option value="">{text('No registrado', 'Not recorded')}</option>
                {crops.map(([id, name]) => (
                  <option key={id} value={id}>
                    {english
                      ? (
                          {
                            maiz_forrajero: 'Green forage maize',
                            sorgo: 'Green forage sorghum',
                            alfalfa: 'Green alfalfa',
                            cebada: 'Barley grain',
                          } as Record<string, string>
                        )[id]
                      : name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              {text('Municipio declarado', 'Reported municipality')}
              <select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  invalidate();
                }}
              >
                <option value="">{text('No registrado', 'Not recorded')}</option>
                <option value="el_marques_queretaro">El Marqués</option>
                <option value="colon_queretaro">Colón</option>
              </select>
            </label>
            <label className="field">
              {text('Modalidad declarada', 'Reported water regime')}
              <select
                value={water}
                onChange={(e) => {
                  setWater(e.target.value);
                  invalidate();
                }}
              >
                <option value="unknown">{text('Desconocida', 'Unknown')}</option>
                <option value="rainfed">{text('Temporal', 'Rainfed')}</option>
                <option value="irrigated">{text('Riego', 'Irrigated')}</option>
              </select>
            </label>
            <label className="field">
              {text(
                'Análisis satelital archivado (opcional)',
                'Archived satellite analysis (optional)',
              )}
              <select
                value={analysisId}
                onChange={(e) => {
                  setAnalysisId(e.target.value);
                  invalidate();
                }}
              >
                <option value="">{text('Ninguno', 'None')}</option>
                {analyses.map((a) => (
                  <option key={a.analysis_id} value={a.analysis_id}>
                    {a.name || text('Sin nombre', 'Unnamed')} ·{' '}
                    {a.acquired_at || text('fecha desconocida', 'unknown date')} ·{' '}
                    {a.analysis_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {analysisMessage && (
            <p>
              {analysisMessage === 'loading'
                ? text('Cargando análisis archivados…', 'Loading archived analyses…')
                : analysisMessage === 'empty'
                  ? text('No hay análisis archivados.', 'No archived analyses.')
                  : text(
                      'No se pudieron consultar análisis archivados.',
                      'Could not load archived analyses.',
                    )}
            </p>
          )}
          <label>
            <input
              type="checkbox"
              checked={priority}
              onChange={(e) => {
                setPriority(e.target.checked);
                invalidate();
              }}
            />{' '}
            {text(
              'Priorizar cambio de familia botánica (criterio elegido por mí)',
              'Prioritize a change in botanical family (my chosen criterion)',
            )}
          </label>
          <div className="monitor-actions">
            <button className="button button-primary" disabled={status === 'loading'}>
              {text('Comparar opciones', 'Compare options')}
            </button>
          </div>
        </form>
        {status === 'loading' && (
          <p role="status">{text('Preparando comparación…', 'Preparing comparison…')}</p>
        )}
        {status === 'error' && <p role="alert">{error}</p>}
        {result && (
          <div>
            <h3>{text('Opciones para evaluar', 'Options to evaluate')}</h3>
            <p>
              {result.ordering === 'family_change_requested'
                ? text(
                    'Ordenadas únicamente por cambio de familia solicitado; no es un ranking de aptitud ni rentabilidad.',
                    'Ordered only by the requested family change; this is not a suitability or profitability ranking.',
                  )
                : text(
                    'Sin orden de preferencia: selecciona el cultivo anterior y activa el criterio de familia para aplicar ese único orden.',
                    'No preference order: select the previous crop and enable the family criterion to apply that single ordering.',
                  )}
            </p>
            <ol>
              {result.options.map((option) => (
                <li key={option.crop_id}>
                  <strong>
                    {english
                      ? (
                          {
                            maiz_forrajero: 'Green forage maize',
                            sorgo: 'Green forage sorghum',
                            alfalfa: 'Green alfalfa',
                            cebada: 'Barley grain',
                          } as Record<string, string>
                        )[option.crop_id] || option.name
                      : option.name}
                  </strong>{' '}
                  · {option.family || text('Familia desconocida', 'Unknown family')} ·{' '}
                  {option.same_family_as_previous === null
                    ? text('familia anterior no evaluable', 'previous family not assessable')
                    : option.same_family_as_previous
                      ? text('misma familia anterior', 'same as previous family')
                      : text('familia distinta', 'different family')}
                  {option.repeated_crop ? text(' · cultivo repetido', ' · repeated crop') : ''}
                </li>
              ))}
            </ol>
            <h3>{text('Factores y datos faltantes', 'Factors and missing data')}</h3>
            <p>
              {text(
                'Suelo, requerimientos de agua, calendario, clima y economía: no evaluables para ordenar con los datos disponibles. Municipio y modalidad son datos declarados, no prueban aptitud.',
                'Soil, water requirements, calendar, climate and economics cannot be assessed for ordering with the available data. Municipality and water regime are reported, not proof of suitability.',
              )}
            </p>
            {result.satellite && (
              <div>
                <h3>{text('Contexto satelital seleccionado', 'Selected satellite context')}</h3>
                <p>
                  {text('Fecha', 'Date')}: {result.satellite.acquired_at || t('notAvailable')} ·{' '}
                  {text('NDVI medio', 'Mean NDVI')}:{' '}
                  {result.satellite.ndvi?.mean ?? t('notAvailable')} ·{' '}
                  {text('NDMI medio', 'Mean NDMI')}:{' '}
                  {result.satellite.ndmi?.mean ?? t('notAvailable')} ·{' '}
                  {text('Cobertura válida NDVI', 'Valid NDVI coverage')}:{' '}
                  {result.satellite.valid_pixel_percent_in_aoi == null
                    ? t('notAvailable')
                    : `${result.satellite.valid_pixel_percent_in_aoi}%`}
                </p>
                <p>{result.satellite.note}</p>
              </div>
            )}
            <h3>{text('Limitaciones y siguiente paso', 'Limitations and next step')}</h3>
            <ul>
              {result.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              {text(
                'Consulta a un técnico local y revisa agua, suelo, calendario, costos y mercado antes de decidir. Pronóstico numérico: no confiable.',
                'Consult a local specialist and review water, soil, calendar, costs and markets before deciding. Numerical forecast: unreliable.',
              )}
            </p>
            <p className="fine-print">
              {text(
                'Familias botánicas: catálogo local HaiLex; referencias',
                'Botanical families: local HaiLex catalog; references',
              )}{' '}
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
        {text('Consultar a Lex', 'Ask Lex')}
      </button>
    </>
  );
}
