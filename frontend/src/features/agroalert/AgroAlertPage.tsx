import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeading } from '../../components/PageHeading';
import { getMoisture, getMunicipalities, type Response } from './client';
import { MunicipalityMap } from './MunicipalityMap';
import {
  formatValue,
  selectedValue,
  type Daily,
  type MoistureData,
  type Municipality,
  type MunicipalityCollection,
  type Palette,
  type Parameter,
  type Reading,
  type Theme,
} from './types';
import './agroalert.css';

const queryCache = new Map<string, Response<MoistureData>>();
const today = () => new Date().toISOString().slice(0, 10);
function daysBefore(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}
function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}
function download(data: MoistureData) {
  const columns: (keyof Daily)[] = [
    'date',
    'source_model',
    'SFMC',
    'RZMC',
    'GWETTOP',
    'GWETROOT',
    'SFMC_PRCNTL',
    'RZMC_PRCNTL',
    'status',
  ];
  const rows = [
    [
      'Fecha',
      'Fuente',
      'Superficie SMAP (m³/m³)',
      'Raíces SMAP (m³/m³)',
      'Superficie MERRA-2 (índice 0–1)',
      'Raíces MERRA-2 (índice 0–1)',
      'Percentil superficie (%)',
      'Percentil raíces (%)',
      'Estado',
    ],
    ...data.daily
      .slice()
      .reverse()
      .map((row) => columns.map((key) => row[key] ?? '')),
  ];
  const blob = new Blob(['\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agroalert_${data.municipality === 'Colón' ? 'colon' : 'el_marques'}_humedad.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function LineChartByCell({
  data,
  field,
  source,
}: {
  data: MoistureData;
  field: 'surface' | 'root';
  source: string;
}) {
  const readings = data.cell_readings.filter((row) => row.source_model === source);
  const cells = [...new Map(readings.map((row) => [row.cell_id, row])).values()];
  const dates = [...new Set(readings.map((row) => row.date))].sort();
  const indexed = new Map(readings.map((row) => [`${row.date}|${row.cell_id}`, row]));
  const chart = dates.map((date) => {
    const row: Record<string, string | number | null> = { date };
    for (const cell of cells) {
      const reading = indexed.get(`${date}|${cell.cell_id}`);
      row[cell.cell_id] = reading
        ? reading[
            field === 'surface' ? reading.active_surface_parameter : reading.active_root_parameter
          ]
        : null;
    }
    return row;
  });
  return (
    <div className="agroalert-chart">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chart}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={40} />
          <YAxis />
          <Tooltip />
          <Legend />
          {cells.map((cell, index) => (
            <Line
              key={cell.cell_id}
              dataKey={cell.cell_id}
              name={cell.sector_name}
              stroke={
                ['#0d9488', '#2563eb', '#d97706', '#9333ea', '#dc2626', '#65a30d'][index % 6] ??
                '#0d9488'
              }
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Graphs({ data }: { data: MoistureData }) {
  const sources = [...new Set(data.cell_readings.map((row) => row.source_model))];
  return (
    <div className="agroalert-panel">
      <h2>Evolución por fecha</h2>
      {sources.map((source) => (
        <section key={source}>
          <h3>Humedad en superficie por zona · {source}</h3>
          <p>
            {source.includes('MERRA')
              ? 'Índice 0–1, no contenido volumétrico.'
              : 'Contenido volumétrico m³/m³.'}
          </p>
          <LineChartByCell data={data} field="surface" source={source} />
          <h3>Humedad en zona de raíces por zona · {source}</h3>
          <LineChartByCell data={data} field="root" source={source} />
          <h3>Comparación empírica con el periodo de referencia · {source}</h3>
          <div className="agroalert-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.daily.filter((row) => row.source_model === source)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" minTickGap={40} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <ReferenceArea y1={40} y2={60} fill="#bbf7d0" fillOpacity={0.35} />
                <Line
                  dataKey="SFMC_PRCNTL"
                  name="Superficie (%)"
                  stroke="#0284c7"
                  connectNulls={false}
                />
                <Line
                  dataKey="RZMC_PRCNTL"
                  name="Raíces (%)"
                  stroke="#0d9488"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p>La franja 40–60 representa el rango medio empírico, no un diagnóstico.</p>
        </section>
      ))}
      {!sources.length && <p>Sin datos para graficar.</p>}
    </div>
  );
}

function Tables({ data }: { data: MoistureData }) {
  return (
    <div className="agroalert-panel">
      <h2>Lecturas más recientes por celda</h2>
      <p>Las celdas son observaciones regionales, no parcelas.</p>
      <div className="agroalert-table">
        <table>
          <thead>
            <tr>
              <th>Sector</th>
              <th>Referencia</th>
              <th>Celda / coordenadas</th>
              <th>Cobertura</th>
              <th>Superficie</th>
              <th>Raíces</th>
              <th>Percentil superficie</th>
              <th>Percentil raíces</th>
              <th>Estado</th>
              <th>Fecha y fuente</th>
            </tr>
          </thead>
          <tbody>
            {data.latest_by_cell.map((row) => (
              <tr key={row.cell_id}>
                <td>{row.sector_name}</td>
                <td>{row.nearest_landmark}</td>
                <td>{row.cell_id}</td>
                <td>{row.coverage_percent.toFixed(1)} %</td>
                <td>{formatValue(row[row.active_surface_parameter], row.unit)}</td>
                <td>{formatValue(row[row.active_root_parameter], row.unit)}</td>
                <td>{formatValue(row.SFMC_PRCNTL, '%')}</td>
                <td>{formatValue(row.RZMC_PRCNTL, '%')}</td>
                <td>{row.status}</td>
                <td>
                  {row.date} · {row.source_model}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Historial diario municipal</h2>
      <button type="button" className="button" onClick={() => download(data)}>
        Descargar historial CSV
      </button>
      <div className="agroalert-table">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Fuente</th>
              <th>Superficie</th>
              <th>Raíces</th>
              <th>Percentil superficie</th>
              <th>Percentil raíces</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.daily
              .slice()
              .reverse()
              .map((row) => {
                const merra = row.source_model.includes('MERRA');
                const unit = merra ? 'índice (0–1)' : 'm³/m³';
                return (
                  <tr key={`${row.date}-${row.source_model}`}>
                    <td>{row.date}</td>
                    <td>{row.source_model}</td>
                    <td>{formatValue(merra ? row.GWETTOP : row.SFMC, unit)}</td>
                    <td>{formatValue(merra ? row.GWETROOT : row.RZMC, unit)}</td>
                    <td>{formatValue(row.SFMC_PRCNTL, '%')}</td>
                    <td>{formatValue(row.RZMC_PRCNTL, '%')}</td>
                    <td>{row.status}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AgroAlertPage() {
  const [municipality, setMunicipality] = useState<Municipality>('El Marqués');
  const [endDate, setEndDate] = useState(() => daysBefore(10));
  const [historyDays, setHistoryDays] = useState(30);
  const [parameter, setParameter] = useState<Parameter>('SFMC');
  const [palette, setPalette] = useState<Palette>('agro');
  const [theme, setTheme] = useState<Theme>('light');
  const [labels, setLabels] = useState(true);
  const [landmarks, setLandmarks] = useState(true);
  const [boundaryLabels, setBoundaryLabels] = useState(true);
  const [gibs, setGibs] = useState(false);
  const [tab, setTab] = useState<'map' | 'data' | 'charts'>('map');
  const [collection, setCollection] = useState<MunicipalityCollection | null>(null);
  const [collectionError, setCollectionError] = useState('');
  const [result, setResult] = useState<Response<MoistureData> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const key = `${municipality}|${endDate}|${historyDays}`;

  useEffect(() => {
    const controller = new AbortController();
    getMunicipalities(controller.signal)
      .then((response) => setCollection(response.data))
      .catch(() => {
        if (!controller.signal.aborted)
          setCollectionError('No se pudieron cargar las referencias municipales.');
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const cached = queryCache.get(key);
    if (cached) {
      queueMicrotask(() => {
        if (!controller.signal.aborted) {
          setResult(cached);
          setError('');
          setLoading(false);
        }
      });
      return () => controller.abort();
    }
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setResult(null);
        setError('');
        setLoading(true);
      }
    });
    getMoisture(municipality, endDate, historyDays, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          queryCache.set(key, response);
          setResult(response);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar NASA POWER.');
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [key, municipality, endDate, historyDays, refresh]);
  const data =
    result?.data.municipality === municipality &&
    result.data.end_date === endDate &&
    result.data.start_date === daysStart(endDate, historyDays)
      ? result.data
      : null;
  const sources = data ? [...new Set(data.latest_by_cell.map((row) => row.source_model))] : [];
  const latestDate = data?.latest_by_cell
    .map((row) => row.date)
    .sort()
    .at(-1);
  const latestDaily = data?.daily.filter((row) => row.date === latestDate) ?? [];
  const selectedRows =
    data?.latest_by_cell.filter((row) => selectedValue(row, parameter) != null) ?? [];
  const canCompare =
    parameter.endsWith('PRCNTL') || new Set(selectedRows.map((row) => row.unit)).size <= 1;
  const sorted = canCompare
    ? [...selectedRows].sort(
        (a, b) => (selectedValue(a, parameter) ?? 0) - (selectedValue(b, parameter) ?? 0),
      )
    : [];
  const props = data?.boundary.properties;
  return (
    <div className="agroalert">
      <PageHeading
        eyebrow="NASA POWER · HUMEDAD DEL SUELO"
        title="Parcel Monitoring"
        description="Compara la humedad regional por celdas municipales. No representa mediciones de una parcela ni un diagnóstico."
      />
      <section className="agroalert-hero">
        <p className="eyebrow">HAILEX · DATOS DIARIOS NASA POWER</p>
        <h2>Monitoreo de humedad municipal</h2>
        <p>Consulta observaciones y modelos diarios, con su fecha, fuente y limitaciones.</p>
        <strong>{municipality} · Querétaro</strong>
      </section>
      <section className="agroalert-panel agroalert-controls" aria-label="Filtros de consulta">
        <label>
          Municipio
          <select
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value as Municipality)}
          >
            <option>El Marqués</option>
            <option>Colón</option>
          </select>
        </label>
        <label>
          Fecha final
          <input
            type="date"
            max={today()}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label>
          Historial
          <select value={historyDays} onChange={(e) => setHistoryDays(Number(e.target.value))}>
            {[14, 30, 60, 90].map((days) => (
              <option key={days} value={days}>
                {days} días
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            queryCache.delete(key);
            setResult(null);
            setLoading(true);
            setRefresh((value) => value + 1);
          }}
        >
          Actualizar información
        </button>
      </section>
      {collectionError && <p role="status">{collectionError}</p>}
      {loading && (
        <div className="agroalert-panel" role="status">
          Consultando datos de {municipality}… Puede tardar varios minutos.
        </div>
      )}
      {error && (
        <div className="agroalert-panel" role="alert">
          {error}
        </div>
      )}
      {data && !loading && (
        <>
          {result?.warnings.map((warning) => (
            <p className="agroalert-warning" role="status" key={warning}>
              {warning}
            </p>
          ))}
          <section className="agroalert-profile">
            <div>
              <p className="eyebrow">PERFIL MUNICIPAL</p>
              <h2>{municipality}, Querétaro</h2>
              <p>
                {String(props?.region ?? 'Región no disponible')} · Área:{' '}
                {String(props?.area_km2 ?? 'Sin dato')} km²
              </p>
              <p>
                Cultivos de referencia:{' '}
                {Array.isArray(props?.cultivos)
                  ? props.cultivos.join(', ')
                  : String(props?.cultivos ?? 'Sin dato')}
              </p>
            </div>
            <div>
              <strong>{data.latest_by_cell.length} celdas con datos</strong>
              <p>
                {sources.length > 1
                  ? 'Fuentes mixtas: SMAP L4 / MERRA-2'
                  : (sources[0] ?? 'Sin fuente disponible')}
              </p>
              <p>
                Última observación: {latestDate ?? 'Sin dato'} · Consultado: {data.retrieved_at}
              </p>
            </div>
          </section>
          {latestDaily.map((row) => {
            const merra = row.source_model.includes('MERRA');
            const unit = merra ? 'índice (0–1)' : 'm³/m³';
            return (
              <section
                className="agroalert-kpis"
                key={row.source_model}
                aria-label={`Indicadores ${row.source_model}`}
              >
                <div>
                  <small>Superficie · {row.source_model}</small>
                  <strong>{formatValue(merra ? row.GWETTOP : row.SFMC, unit)}</strong>
                </div>
                <div>
                  <small>Zona de raíces</small>
                  <strong>{formatValue(merra ? row.GWETROOT : row.RZMC, unit)}</strong>
                </div>
                <div>
                  <small>Comparación raíces</small>
                  <strong>{formatValue(row.RZMC_PRCNTL, '%')}</strong>
                </div>
                <div>
                  <small>Estado orientativo</small>
                  <strong>{row.status ?? 'Sin dato'}</strong>
                  <span>{row.interpretation}</span>
                </div>
              </section>
            );
          })}
          <aside className="agroalert-warning">
            Los percentiles son una comparación empírica con la serie disponible, no una declaración
            de sequía. Los datos satelitales y modelados complementan, pero no sustituyen, la
            evaluación de campo. La interpretación depende del suelo, cultivo, etapa y manejo; no se
            determina una dosis ni fecha de riego.
          </aside>
          <nav className="agroalert-tabs" aria-label="Contenido del monitoreo">
            {(
              [
                ['map', 'Mapa de humedad'],
                ['data', 'Datos y descargas'],
                ['charts', 'Evolución por fecha'],
              ] as const
            ).map(([id, name]) => (
              <button
                type="button"
                className={tab === id ? 'active' : ''}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                key={id}
              >
                {name}
              </button>
            ))}
          </nav>
          {tab === 'map' && (
            <section className="agroalert-panel">
              <h2>Mapa de humedad</h2>
              <div className="agroalert-map-controls">
                <label>
                  Variable
                  <select
                    value={parameter}
                    onChange={(e) => setParameter(e.target.value as Parameter)}
                  >
                    <option value="SFMC">Humedad superficial</option>
                    <option value="RZMC">Humedad en raíces</option>
                    <option value="SFMC_PRCNTL">Percentil superficial</option>
                    <option value="RZMC_PRCNTL">Percentil raíces</option>
                  </select>
                </label>
                <label>
                  Paleta
                  <select value={palette} onChange={(e) => setPalette(e.target.value as Palette)}>
                    <option value="agro">Agro</option>
                    <option value="thermal">Térmica</option>
                    <option value="nasa_smap">NASA SMAP</option>
                    <option value="vivid">Intensa</option>
                  </select>
                </label>
                <label>
                  Mapa base
                  <select value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
                    <option value="light">Claro</option>
                    <option value="satellite">Satélite</option>
                    <option value="topo">Relieve</option>
                    <option value="dark">Oscuro</option>
                  </select>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={labels}
                    onChange={(e) => setLabels(e.target.checked)}
                  />{' '}
                  Etiquetas de humedad
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={landmarks}
                    onChange={(e) => setLandmarks(e.target.checked)}
                  />{' '}
                  Localidades clave
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={boundaryLabels}
                    onChange={(e) => setBoundaryLabels(e.target.checked)}
                  />{' '}
                  Bordes y lugares
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={gibs}
                    onChange={(e) => setGibs(e.target.checked)}
                  />{' '}
                  NASA GIBS visual
                </label>
              </div>
              {gibs && (
                <p>GIBS es una capa visual independiente; no modifica los valores de NASA POWER.</p>
              )}
              {!canCompare && (
                <p className="agroalert-warning">
                  Las fuentes mezcladas usan unidades incompatibles. Selecciona un percentil para
                  comparar o consulta las tablas por fuente.
                </p>
              )}
              <MunicipalityMap
                data={data}
                collection={collection}
                parameter={parameter}
                palette={palette}
                theme={theme}
                labels={labels}
                landmarks={landmarks}
                boundaryLabels={boundaryLabels}
                gibs={gibs}
              />
              <div className="agroalert-extremes">
                {sorted[0] && sorted.at(-1) ? (
                  <>
                    <p>
                      <strong>Más seca:</strong> {sorted[0]?.sector_name} ·{' '}
                      {sorted[0]?.nearest_landmark} ·{' '}
                      {formatValue(
                        selectedValue(sorted[0] as Reading, parameter),
                        parameter.endsWith('PRCNTL') ? '%' : sorted[0]?.unit,
                      )}
                    </p>
                    <p>
                      <strong>Más húmeda:</strong> {sorted.at(-1)?.sector_name} ·{' '}
                      {sorted.at(-1)?.nearest_landmark} ·{' '}
                      {formatValue(
                        selectedValue(sorted.at(-1) as Reading, parameter),
                        parameter.endsWith('PRCNTL') ? '%' : sorted.at(-1)?.unit,
                      )}
                    </p>
                  </>
                ) : (
                  <p>Sin datos comparables para esta variable.</p>
                )}
              </div>
              <p className="fine-print">
                Celdas de aproximadamente 0.09°; el contorno proviene de{' '}
                {String(props?.fuente_limites ?? 'un límite local simplificado')} y no es linde
                legal ni parcela. Las teselas cartográficas requieren conexión.
              </p>
              <p className="fine-print">
                Para actualizar los límites, un operador local puede ejecutar el sincronizador del
                backend. No hay una operación pública de escritura sin autorización.
              </p>
            </section>
          )}
          {tab === 'data' && <Tables data={data} />}
          {tab === 'charts' && <Graphs data={data} />}
        </>
      )}
    </div>
  );
}

function daysStart(end: string, count: number) {
  const date = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return '';
  date.setUTCDate(date.getUTCDate() - count + 1);
  return date.toISOString().slice(0, 10);
}
