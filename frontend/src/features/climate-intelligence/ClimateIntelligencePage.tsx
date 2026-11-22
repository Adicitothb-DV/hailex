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
import { useTranslation } from 'react-i18next';

const variables: { id: VariableId; title: string; subtitle: string }[] = [
  { id: 'T2M', title: 'climateTemp', subtitle: 'climateTempDaily' },
  { id: 'PRECTOTCORR', title: 'climateRain', subtitle: 'climateRainDaily' },
  {
    id: 'ALLSKY_SFC_SW_DWN',
    title: 'climateRadiation',
    subtitle: 'climateRadiationDaily',
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
  const { t } = useTranslation();
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
            {subtitle} · {meta?.unit ?? t('unitMissing')}
          </p>
        </div>
        <StatusBadge variant={meta?.missing_count ? 'warning' : 'success'}>
          {meta
            ? t('counts', { valid: meta.valid_count, missing: meta.missing_count })
            : t('metadataMissing')}
        </StatusBadge>
      </div>
      <p className="chart-latest">
        {last ? (
          <>
            {t('latestValue')}{' '}
            <strong>
              {last[id]} {meta?.unit}
            </strong>{' '}
            · {last.date}
          </>
        ) : (
          t('noPeriodValues')
        )}
      </p>
      {meta && (
        <p className="fine-print">
          {t('type')}: {meta.data_type} · {t('resolution')}:{' '}
          {meta.spatial_resolution ?? t('notAvailable')} · {meta.temporal_resolution}
        </p>
      )}
      {meta?.valid_count ? (
        <div
          className="chart-container"
          aria-label={t('seriesLabel', { title, unit: meta.unit ?? '' })}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 18, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-soft)" />
              <XAxis dataKey="date" minTickGap={45} tick={{ fontSize: 11 }} />
              <YAxis width={52} tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(value) => [
                  value == null ? t('noValue') : `${value} ${meta.unit ?? ''}`,
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
        <EmptyState title={t('noChartData')}>{t('missingNotZero')}</EmptyState>
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
  const { t } = useTranslation();
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
      setValidation('climateValidation');
      return;
    }
    setValidation('');
    void queryClimate(start, end);
  }
  const result = climate.result;
  return (
    <>
      <PageHeading
        eyebrow={t('climateEyebrow')}
        title={t('climate-intelligence')}
        description={t('climateDescription')}
      />
      <div className="climate-intro">
        <form className="surface climate-form" onSubmit={submit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t('climateQuery')}</p>
              <h2>{t('climateSelect')}</h2>
            </div>
            <StatusBadge variant={connection === 'connected' ? 'success' : 'warning'}>
              {connection === 'connected' ? t('connected') : t('backendUnavailable')}
            </StatusBadge>
          </div>
          <div className="form-grid">
            <LocationSelect />
            <label className="field">
              {t('period')}
              <select value={preset} onChange={(e) => choose(e.target.value)}>
                <option value="2025">{t('historical2025')}</option>
                <option value="7">{t('last7')}</option>
                <option value="30">{t('last30')}</option>
                <option value="custom">{t('customRange')}</option>
              </select>
            </label>
            <label className="field">
              {t('from')}
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
              {t('to')}
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
          <p className="fine-print">{t('climateDateNote')}</p>
          {validation && <p role="alert">{t(validation)}</p>}
          <button
            className="button button-primary"
            type="submit"
            disabled={climate.status === 'loading'}
          >
            {t(climate.status === 'loading' ? 'querying' : 'queryNasa')}
          </button>
        </form>
        <SolarScene
          latitude={location.latitude}
          longitude={location.longitude}
          label={location.label}
        />
      </div>
      {climate.status === 'loading' && <LoadingState>{t('climateLoading')}</LoadingState>}
      {climate.status === 'error' && (
        <ErrorState message={climate.error} retry={() => void queryClimate(start, end)} />
      )}
      {climate.status === 'idle' && (
        <EmptyState title={t('climateEmpty')}>{t('climateEmptyDescription')}</EmptyState>
      )}
      {result && (
        <>
          <div className="climate-results-heading">
            <div>
              <p className="eyebrow">NASA POWER · DAILY POINT</p>
              <h2>{t('dailySeries')}</h2>
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
                ? t('partialData')
                : t('seriesAvailable')}
            </StatusBadge>
          </div>
          <div className="charts-grid">
            {variables.map((variable) => (
              <Chart
                key={variable.id}
                id={variable.id}
                title={t(variable.title)}
                subtitle={t(variable.subtitle)}
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
