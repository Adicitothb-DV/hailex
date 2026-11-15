import type { ReactNode } from 'react';
import type { ClimateSeries, Envelope } from '../types/api';
import { useTranslation } from 'react-i18next';

export function StatusBadge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'historical' | 'simulated';
}) {
  return <span className={`status-badge badge-${variant}`}>{children}</span>;
}
export function LoadingState({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <p className="state-message" role="status">
      {children ?? t('loading')}
    </p>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="notice error-state" role="alert">
      <strong>{t('requestFailed')}</strong>
      <p>{message}</p>
      {retry && (
        <button type="button" className="button button-secondary" onClick={retry}>
          {t('retry')}
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function DataProvenancePanel({ result }: { result: Envelope<ClimateSeries> }) {
  const { t } = useTranslation();
  const { data, warnings } = result;
  const mode = data.retrieval.retrieval_mode;
  return (
    <section className="surface provenance" aria-labelledby="provenance-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t('transparency')}</p>
          <h2 id="provenance-title">{t('provenanceLimits')}</h2>
        </div>
        <StatusBadge
          variant={
            mode === 'historical_fixture'
              ? 'historical'
              : mode === 'demo_fixture'
                ? 'simulated'
                : 'info'
          }
        >
          {mode === 'historical_fixture'
            ? t('historicalFallback')
            : mode === 'demo_fixture'
              ? t('simulated')
              : mode === 'cache'
                ? t('cache')
                : t('upstream')}
        </StatusBadge>
      </div>
      {mode === 'historical_fixture' && <p className="notice">{t('historicalFallbackNote')}</p>}
      {mode === 'demo_fixture' && <p className="notice">{t('simulatedNote')}</p>}
      {data.period.end_date < new Date().toISOString().slice(0, 10) && (
        <p className="fine-print">{t('historicalPeriodNote')}</p>
      )}
      <dl className="provenance-grid">
        <div>
          <dt>{t('source')}</dt>
          <dd>
            {data.source.organization} · {data.source.product}
          </dd>
        </div>
        <div>
          <dt>{t('communityTime')}</dt>
          <dd>
            {data.community} · {data.time_standard}
          </dd>
        </div>
        <div>
          <dt>{t('queriedCoordinates')}</dt>
          <dd>
            {data.location.latitude}, {data.location.longitude}
          </dd>
        </div>
        <div>
          <dt>{t('period')}</dt>
          <dd>
            {data.period.start_date} — {data.period.end_date}
          </dd>
        </div>
        <div>
          <dt>{t('retrieved')}</dt>
          <dd>{data.retrieval.retrieved_at ?? t('notAvailable')}</dd>
        </div>
        <div>
          <dt>{t('served')}</dt>
          <dd>{data.retrieval.served_at}</dd>
        </div>
        <div>
          <dt>{t('mode')}</dt>
          <dd>{mode}</dd>
        </div>
        <div>
          <dt>{t('normalizer')}</dt>
          <dd>{data.normalizer_version}</dd>
        </div>
      </dl>
      <ul className="limitations">
        {[...data.source.limitations, ...warnings].map((item, i) => (
          <li key={`${i}-${item}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
