import { useEffect, useMemo, useState } from 'react';
import { apiBase } from '../../services/api';
import { PestMap } from './PestMap';
import type { Evaluation, Municipality, Region, Weather } from './types';
import './pest-monitor.css';

const crops: Record<string, string> = {
  ALL: 'Todos los cultivos',
  maiz: 'Maíz',
  alfalfa: 'Alfalfa',
  brocoli: 'Brócoli',
  sorgo: 'Sorgo',
  cebada: 'Cebada',
};
const presets: Record<string, Weather> = {
  'Onda de calor seca': { temp: 31.5, rh: 36, rain7d: 2, soil: 22 },
  'Temporal húmedo': { temp: 20.5, rh: 84, rain7d: 58, soil: 78 },
  'Sequía prolongada': { temp: 29.5, rh: 28, rain7d: 0, soil: 14 },
  'Condición equilibrada': { temp: 22, rh: 54, rain7d: 14, soil: 44 },
};
const initial: Weather = { temp: 24, rh: 55, rain7d: 12, soil: 45, data_type: 'simulation' };
const metrics = [
  { key: 'temp', label: 'Temperatura media', unit: '°C', min: -90, max: 70, step: 0.5 },
  { key: 'rh', label: 'Humedad relativa', unit: '%', min: 0, max: 100, step: 1 },
  { key: 'rain7d', label: 'Lluvia acumulada (7 días)', unit: 'mm', min: 0, max: 3000, step: 1 },
  {
    key: 'soil',
    label: 'Humedad superficial · índice MERRA-2',
    unit: '% del índice',
    min: 0,
    max: 100,
    step: 1,
  },
] as const;
const display = (score: number | null | undefined) =>
  score == null
    ? 'No evaluable'
    : `${score >= 70 ? 'Alto' : score >= 40 ? 'Moderado' : 'Bajo'} · ${score}/100`;
const tone = (score: number | null | undefined) =>
  score == null ? 'unknown' : score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

async function request<T>(path: string, signal: AbortSignal, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}/api/v1/agroalert/pests/${path}`, {
    signal,
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const json = await response.json();
  if (!response.ok)
    throw new Error(json?.error?.message || 'No fue posible consultar el servicio.');
  return json.data as T;
}

export function PestMonitorPage() {
  const [municipality, setMunicipality] = useState<Municipality>('El Marqués');
  const [region, setRegion] = useState<Region | null>(null);
  const [neighbor, setNeighbor] = useState<Region | null>(null);
  const [selected, setSelected] = useState('0');
  const [crop, setCrop] = useState('ALL');
  const [mode, setMode] = useState<'live' | 'simulator'>('live');
  const [simulation, setSimulation] = useState<Weather>(initial);
  const [weather, setWeather] = useState<Weather[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [layer, setLayer] = useState<'light' | 'satellite' | 'relief'>('light');
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState('');
  const [weatherError, setWeatherError] = useState('');
  const [evaluationError, setEvaluationError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [neighborPrompt, setNeighborPrompt] = useState(false);
  const other: Municipality = municipality === 'Colón' ? 'El Marqués' : 'Colón';

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setLoading(true);
        setRegion(null);
        setNeighbor(null);
        setSelected('0');
        setWeather([]);
        setEvaluations([]);
        setError('');
        setNeighborPrompt(false);
      }
    });
    const query = (name: Municipality) => `sectors?municipality=${encodeURIComponent(name)}`;
    request<Region>(query(municipality), controller.signal)
      .then(setRegion)
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    request<Region>(query(other), controller.signal)
      .then(setNeighbor)
      .catch(() => {});
    return () => controller.abort();
  }, [municipality, other, refresh]);
  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setWeatherLoading(true);
        setWeatherError('');
      }
    });
    request<{ sectors: Weather[] }>(
      `weather?municipality=${encodeURIComponent(municipality)}`,
      controller.signal,
    )
      .then((data) => setWeather(data.sectors))
      .catch((e: Error) => {
        if (!controller.signal.aborted) setWeatherError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setWeatherLoading(false);
      });
    return () => controller.abort();
  }, [municipality, refresh]);
  const weatherMap = useMemo(
    () =>
      Object.fromEntries(
        (region?.sectors ?? []).map((s) => [
          s.id,
          mode === 'simulator' ? simulation : (weather.find((w) => w.id === s.id) ?? {}),
        ]),
      ),
    [region, mode, simulation, weather],
  );
  useEffect(() => {
    if (!region) return;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setEvaluations([]);
        setEvaluationError('');
      }
    });
    const timer = setTimeout(() => {
      request<{ sectors: Evaluation[] }>('evaluate', controller.signal, {
        municipality,
        crop,
        weather: weatherMap,
      })
        .then((data) => setEvaluations(data.sectors))
        .catch((e: Error) => {
          if (!controller.signal.aborted) setEvaluationError(e.message);
        });
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [municipality, crop, region, weatherMap]);
  const sector = region?.sectors.find((s) => s.id === selected);
  const active = evaluations.find((e) => e.id === selected);
  const current = weatherMap[selected] ?? {};
  function restore() {
    const live = weather.find((w) => w.id === selected);
    if (live && metrics.every(({ key }) => live[key] != null))
      setSimulation({
        temp: live.temp ?? null,
        rh: live.rh ?? null,
        rain7d: live.rain7d ?? null,
        soil: live.soil ?? null,
        data_type: 'simulation',
      });
    else setSimulation(initial);
  }
  function exportCsv() {
    if (!sector || !active) return;
    const rows = [
      [
        'data_type',
        'municipio',
        'localidad_ilustrativa',
        'clima_fuente',
        'fecha',
        'temperatura_C',
        'humedad_relativa_pct',
        'lluvia_7d_mm',
        'GWETTOP_indice_pct',
        'plaga',
        'nombre_cientifico',
        'indice_ilustrativo_100',
        'estado',
        'faltantes',
      ],
      ...active.pests.map((p) => [
        'simulation',
        municipality,
        sector.name,
        mode === 'simulator' ? 'SIMULADO' : 'NASA POWER',
        current.date ?? '',
        current.temp ?? '',
        current.rh ?? '',
        current.rain7d ?? '',
        current.soil ?? '',
        p.name,
        p.scientific,
        p.score ?? '',
        p.status,
        p.missing.join('; '),
      ]),
    ];
    const csv =
      '\uFEFF' +
      rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `hailex_fitoproteccion_${sector.id}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="pest-page">
      <header className="pest-hero">
        <div>
          <span>VIGILANCIA FITOSANITARIA · QUERÉTARO</span>
          <h1>Monitor fitosanitario</h1>
          <p>
            Explora escenarios para El Marqués y Colón con contexto climático y localidades
            ilustrativas.
          </p>
        </div>
        <div className="pest-buttons">
          {(['El Marqués', 'Colón'] as const).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={name === municipality}
              onClick={() => setMunicipality(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </header>
      <div className="pest-notice">
        <strong>SIMULADO · data_type: simulation.</strong> Los índices y cultivos del prototipo son
        ilustrativos y no están validados. No son probabilidades, diagnósticos ni presencia
        confirmada; consulta a un especialista y realiza muestreo en campo.
      </div>
      {loading && <p role="status">Cargando localidades y límites…</p>}
      {error && (
        <p role="alert">
          {error} <button onClick={() => setRefresh((n) => n + 1)}>Reintentar</button>
        </p>
      )}
      {region && (
        <div className="pest-layout">
          <aside className="pest-column">
            <section className="pest-card">
              <h2>1. Configuración de análisis</h2>
              <label>
                Cultivo a evaluar
                <select value={crop} onChange={(e) => setCrop(e.target.value)}>
                  {Object.entries(crops).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <p>Escenario climático</p>
              <div className="pest-buttons">
                <button aria-pressed={mode === 'live'} onClick={() => setMode('live')}>
                  NASA POWER
                </button>
                <button
                  aria-pressed={mode === 'simulator'}
                  onClick={() => {
                    restore();
                    setMode('simulator');
                  }}
                >
                  Simulador
                </button>
              </div>
              {mode === 'simulator' && (
                <div className="pest-simulator">
                  <strong>SIMULADO · ¿Qué pasaría si…?</strong>
                  <div className="pest-buttons">
                    {Object.entries(presets).map(([name, values]) => (
                      <button
                        key={name}
                        onClick={() => setSimulation({ ...values, data_type: 'simulation' })}
                      >
                        {name}
                      </button>
                    ))}
                    <button onClick={restore}>Restaurar</button>
                  </div>
                  <p>
                    Restaurar usa NASA cuando todas las variables están disponibles; de lo contrario
                    usa valores simulados iniciales.
                  </p>
                  {metrics.map((m) => (
                    <label key={m.key}>
                      {m.label}{' '}
                      <strong>
                        {simulation[m.key]} {m.unit}
                      </strong>
                      <input
                        type="range"
                        min={m.min}
                        max={m.max}
                        step={m.step}
                        value={simulation[m.key] ?? m.min}
                        onChange={(e) =>
                          setSimulation({ ...simulation, [m.key]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </section>
            <section className="pest-card">
              <h2>2. Localidades · {region.sectors.length}</h2>
              <p>Áreas de proximidad ilustrativas, no límites de localidad.</p>
              <div className="pest-sector-list">
                {region.sectors.map((s) => {
                  const e = evaluations.find((v) => v.id === s.id);
                  return (
                    <button
                      key={s.id}
                      aria-pressed={selected === s.id}
                      onClick={() => setSelected(s.id)}
                    >
                      <strong>{s.name}</strong>
                      <span className={`pest-badge ${tone(e?.overall)}`}>
                        {display(e?.overall)}
                      </span>
                      <small>
                        Cultivos ilustrativos: {s.crops.map((c) => crops[c]).join(', ')}
                      </small>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
          <div className="pest-column">
            <section className="pest-card">
              <div className="pest-heading">
                <div>
                  <small>
                    {municipality} · {municipality === 'Colón' ? '22005' : '22011'} ·{' '}
                    {mode === 'live' ? `NASA POWER ${current.date ?? ''}` : 'SIMULADO'}
                  </small>
                  <h2>{sector?.name}</h2>
                  <p>
                    Índice general ilustrativo: promedio de los tres mayores, si todos son
                    evaluables.
                  </p>
                </div>
                <div>
                  <span className={`pest-badge ${tone(active?.overall)}`}>
                    {display(active?.overall)}
                  </span>{' '}
                  <button onClick={exportCsv} disabled={!active?.pests.length}>
                    Descargar CSV
                  </button>
                </div>
              </div>
              {weatherLoading && mode === 'live' && <p role="status">Consultando NASA POWER…</p>}
              {weatherError && mode === 'live' && <p role="alert">{weatherError}</p>}
              {current.error && mode === 'live' && <p role="alert">{current.error}</p>}
              {evaluationError && <p role="alert">{evaluationError}</p>}
              <div className="pest-metrics">
                {metrics.map((m) => (
                  <div key={m.key}>
                    <small>{m.label}</small>
                    <strong>
                      {current[m.key] == null
                        ? 'Sin dato'
                        : `${Number(current[m.key]).toFixed(1)} ${m.unit}`}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="pest-fine">
                GWETTOP es un índice modelado superficial (0–1), expresado aquí como porcentaje del
                índice; no es humedad volumétrica ni radicular. Lluvia: suma de siete días completos
                terminando en la fecha indicada.
              </p>
            </section>
            <section className="pest-card">
              <div className="pest-heading">
                <div>
                  <h2>Mapa de localidades</h2>
                  <p>
                    Selecciona una zona o el municipio vecino. Voronoi ilustrativo recortado al
                    límite local.
                  </p>
                </div>
                <div className="pest-buttons">
                  <button onClick={() => setRefresh((n) => n + 1)}>Recargar límites y clima</button>
                  {(['light', 'satellite', 'relief'] as const).map((v) => (
                    <button key={v} aria-pressed={layer === v} onClick={() => setLayer(v)}>
                      {v === 'light' ? 'Mapa claro' : v === 'satellite' ? 'Satelital' : 'Relieve'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="pest-fine">
                Límite local:{' '}
                {String(region.boundary.properties?.fuente_limites ?? 'fuente no especificada')}; no
                es linde legal. Recargar consulta la copia local, no sincroniza fuentes externas.
              </p>
              {neighborPrompt && (
                <div className="pest-notice">
                  Municipio vecino: {other}.{' '}
                  <button onClick={() => setMunicipality(other)}>Cambiar a {other}</button>{' '}
                  <button onClick={() => setNeighborPrompt(false)}>Cerrar</button>
                </div>
              )}
              <PestMap
                region={region}
                neighbor={neighbor}
                evaluations={evaluations}
                selected={selected}
                layer={layer}
                onSelect={setSelected}
                onNeighbor={() => setNeighborPrompt(true)}
              />
              <p className="pest-fine">
                🟢 Bajo (&lt;40) · 🟠 Moderado (40–69) · 🔴 Alto (≥70) · gris: no evaluable.
                Categorías ilustrativas, no probabilidades.
              </p>
            </section>
            <section>
              <h2>3. Índice ilustrativo por plaga</h2>
              <p>
                El filtro de cultivo representa una hipótesis del usuario, no cultivos confirmados
                en la localidad.
              </p>
              {active && !active.pests.length && (
                <p>No hay plagas del catálogo para este filtro.</p>
              )}
              <div className="pest-grid">
                {active?.pests.map((p) => (
                  <article className="pest-card" key={p.id}>
                    <div className="pest-heading">
                      <div>
                        <h3>{p.name}</h3>
                        <em>{p.scientific}</em>
                      </div>
                      <span className={`pest-badge ${tone(p.score)}`}>{display(p.score)}</span>
                    </div>
                    {p.score != null && (
                      <div className="pest-bar">
                        <span style={{ width: `${p.score}%` }} />
                      </div>
                    )}
                    <p>
                      <strong>Cultivos considerados:</strong>{' '}
                      {p.crops.map((c) => crops[c]).join(', ')}
                    </p>
                    <p>
                      <strong>Variables del cálculo:</strong>{' '}
                      {p.score == null
                        ? `faltan ${p.missing.join(', ')}`
                        : 'Escenario climático seleccionado; fórmula no validada.'}
                    </p>
                    <p>
                      <strong>Inspección orientativa:</strong> {p.inspect}
                    </p>
                    <p className="pest-fine">
                      Manejo integrado: confirma la plaga y consulta a un técnico antes de
                      intervenir.
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
