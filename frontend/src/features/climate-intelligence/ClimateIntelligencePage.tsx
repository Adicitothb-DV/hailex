import { useState, type FormEvent } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../../app/AppContext';
import { LocationSelect } from '../../components/LocationSelect';
import { PageHeading } from '../../components/PageHeading';
import {
  DataProvenancePanel,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '../../components/Shared';
import type { ClimatePoint, Variable, VariableId } from '../../types/api';
import { SolarScene } from './SolarScene';

const variables: { id: VariableId; title: string; subtitle: string }[] = [
  { id: 'T2M', title: 'Temperatura a 2 metros', subtitle: 'Temperatura diaria' },
  { id: 'PRECTOTCORR', title: 'Precipitación corregida', subtitle: 'Precipitación diaria' },
  {
    id: 'ALLSKY_SFC_SW_DWN',
    title: 'Radiación solar',
    subtitle: 'Irradiancia diaria en superficie',
  },
];
function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}
function recent(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return [iso(start), iso(end)] as const;
}
function Chart({
  points,
  meta,
  id,
  title,
  subtitle,
}: {
  points: ClimatePoint[];
  meta: Variable | undefined;
  id: VariableId;
  title: string;
  subtitle: string;
}) {
  const last = points
    .slice()
    .reverse()
    .find((point) => point[id] !== null);
  return (
    <section className="surface chart-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{id}</p>
          <h2>{title}</h2>
          <p className="muted">
            {subtitle} · {meta?.unit ?? 'Unidad no disponible'}
          </p>
        </div>
        <StatusBadge variant={meta?.missing_count ? 'warning' : 'success'}>
          {meta
            ? `${meta.valid_count} válidos · ${meta.missing_count} faltantes`
            : 'Metadatos no disponibles'}
        </StatusBadge>
      </div>
      <p className="chart-latest">
        {last ? (
          <>
            Último valor válido:{' '}
            <strong>
              {last[id]} {meta?.unit}
            </strong>{' '}
            · {last.date}
          </>
        ) : (
          'No hay valores disponibles para este periodo.'
        )}
      </p>
      {meta && (
        <p className="fine-print">
          Tipo: {meta.data_type} · Resolución: {meta.spatial_resolution ?? 'no disponible'} ·{' '}
          {meta.temporal_resolution}
        </p>
      )}
      {meta?.valid_count ? (
        <div className="chart-container" aria-label={`Serie ${title}, ${meta.unit ?? ''}`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 18, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
              <XAxis dataKey="date" minTickGap={45} tick={{ fontSize: 11 }} />
              <YAxis width={52} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value) => [
                  value == null ? 'Sin dato' : `${value} ${meta.unit ?? ''}`,
                  title,
                ]}
              />
              <Line
                type="linear"
                dataKey={id}
                name={title}
                stroke="var(--chart-line)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState title="Sin datos para graficar">
          Los valores faltantes no se sustituyen por cero.
        </EmptyState>
      )}
      {meta?.limitations.map((limit) => (
        <p className="fine-print" key={limit}>
          {limit}
        </p>
      ))}
    </section>
  );
}
export function ClimateIntelligencePage() {
  const { location, climate, queryClimate, connection } = useApp();
  const [preset, setPreset] = useState('2025');
  const [start, setStart] = useState('2025-01-01');
  const [end, setEnd] = useState('2025-12-31');
  const [validation, setValidation] = useState('');
  function choose(value: string) {
    setPreset(value);
    if (value === '2025') {
      setStart('2025-01-01');
      setEnd('2025-12-31');
    } else if (value === '7' || value === '30') {
      const range = recent(Number(value));
      setStart(range[0]);
      setEnd(range[1]);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !start ||
      !end ||
      start > end ||
      end > iso(new Date()) ||
      (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000 >= 366
    ) {
      setValidation('Selecciona un periodo válido, sin fechas futuras y de hasta 366 días.');
      return;
    }
    setValidation('');
    void queryClimate(start, end);
  }
  const result = climate.result;
  return (
    <>
      <PageHeading
        eyebrow="OBSERVACIONES Y CONTEXTO"
        title="Climate Intelligence"
        description="Explora series diarias de NASA POWER con sus metadatos, faltantes y limitaciones."
      />
      <div className="climate-intro">
        <form className="surface climate-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">CONSULTA CLIMÁTICA</p>
              <h2>Selecciona el contexto</h2>
            </div>
            <StatusBadge variant={connection === 'connected' ? 'success' : 'warning'}>
              {connection === 'connected'
                ? 'Backend disponible'
                : 'Backend sin comprobar o desconectado'}
            </StatusBadge>
          </div>
          <div className="form-grid">
            <LocationSelect />
            <label className="field">
              Periodo
              <select value={preset} onChange={(e) => choose(e.target.value)}>
                <option value="2025">Histórico 2025</option>
                <option value="7">Últimos 7 días UTC</option>
                <option value="30">Últimos 30 días UTC</option>
                <option value="custom">Rango personalizado</option>
              </select>
            </label>
            <label className="field">
              Desde
              <input
                type="date"
                value={start}
                max={iso(new Date())}
                onChange={(e) => {
                  setStart(e.target.value);
                  setPreset('custom');
                }}
                required
              />
            </label>
            <label className="field">
              Hasta
              <input
                type="date"
                value={end}
                max={iso(new Date())}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setPreset('custom');
                }}
                required
              />
            </label>
          </div>
          <p className="fine-print">
            Los días recientes pueden no estar publicados por el proveedor. Máximo 366 días; fechas
            UTC.
          </p>
          {validation && <p role="alert">{validation}</p>}
          <button
            className="button button-primary"
            type="submit"
            disabled={climate.status === 'loading'}
          >
            {climate.status === 'loading' ? 'Consultando…' : 'Consultar NASA POWER'}
          </button>
        </form>
        <SolarScene
          latitude={location.latitude}
          longitude={location.longitude}
          label={location.label}
        />
      </div>
      {climate.status === 'loading' && <LoadingState>Consultando la serie climática…</LoadingState>}
      {climate.status === 'error' && (
        <ErrorState message={climate.error} retry={() => void queryClimate(start, end)} />
      )}
      {climate.status === 'idle' && (
        <EmptyState title="Aún no hay una consulta climática">
          Selecciona ubicación y periodo para consultar el servicio. Los datos recientes pueden no
          estar disponibles.
        </EmptyState>
      )}
      {result && (
        <>
          <div className="climate-results-heading">
            <div>
              <p className="eyebrow">NASA POWER · DAILY POINT</p>
              <h2>Serie diaria</h2>
              <p>
                {result.data.period.start_date} — {result.data.period.end_date} ·{' '}
                {result.data.location.latitude}, {result.data.location.longitude}
              </p>
            </div>
            <StatusBadge
              variant={
                result.data.variables.some((v) => v.missing_count > 0) ? 'warning' : 'success'
              }
            >
              {result.data.variables.some((v) => v.missing_count > 0)
                ? 'Datos parciales'
                : 'Serie disponible'}
            </StatusBadge>
          </div>
          <div className="charts-grid">
            {variables.map((variable) => (
              <Chart
                key={variable.id}
                {...variable}
                points={result.data.series}
                meta={result.data.variables.find((item) => item.id === variable.id)}
              />
            ))}
          </div>
          <DataProvenancePanel result={result} />
        </>
      )}
    </>
  );
}
