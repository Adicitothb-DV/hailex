import type { ReactNode } from 'react';
import type { ClimateSeries, Envelope } from '../types/api';

export function StatusBadge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'historical' | 'simulated';
}) {
  return <span className={`status-badge badge-${variant}`}>{children}</span>;
}
export function LoadingState({ children = 'Cargando…' }: { children?: ReactNode }) {
  return (
    <p className="state-message" role="status">
      {children}
    </p>
  );
}
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice error-state" role="alert">
      <strong>No se pudo completar la consulta.</strong>
      <p>{message}</p>
      {retry && (
        <button type="button" className="button button-secondary" onClick={retry}>
          Reintentar
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
  const { data, warnings } = result;
  const mode = data.retrieval.retrieval_mode;
  return (
    <section className="surface provenance" aria-labelledby="provenance-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TRANSPARENCIA</p>
          <h2 id="provenance-title">Procedencia y límites</h2>
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
            ? 'Respaldo histórico'
            : mode === 'demo_fixture'
              ? 'SIMULADO'
              : mode === 'cache'
                ? 'Caché'
                : 'Proveedor upstream'}
        </StatusBadge>
      </div>
      {mode === 'historical_fixture' && (
        <p className="notice">
          Datos históricos archivados, no una consulta en vivo. Se conserva la fecha de recuperación
          original.
        </p>
      )}
      {mode === 'demo_fixture' && (
        <p className="notice">SIMULADO · Estos datos no son observaciones reales.</p>
      )}
      {data.period.end_date < new Date().toISOString().slice(0, 10) && (
        <p className="fine-print">
          Periodo histórico: los datos corresponden a las fechas consultadas, no a condiciones
          actuales.
        </p>
      )}
      <dl className="provenance-grid">
        <div>
          <dt>Fuente</dt>
          <dd>
            {data.source.organization} · {data.source.product}
          </dd>
        </div>
        <div>
          <dt>Comunidad / tiempo</dt>
          <dd>
            {data.community} · {data.time_standard}
          </dd>
        </div>
        <div>
          <dt>Coordenadas consultadas</dt>
          <dd>
            {data.location.latitude}, {data.location.longitude}
          </dd>
        </div>
        <div>
          <dt>Periodo</dt>
          <dd>
            {data.period.start_date} — {data.period.end_date}
          </dd>
        </div>
        <div>
          <dt>Recuperado</dt>
          <dd>{data.retrieval.retrieved_at ?? 'No disponible'}</dd>
        </div>
        <div>
          <dt>Servido</dt>
          <dd>{data.retrieval.served_at}</dd>
        </div>
        <div>
          <dt>Modo</dt>
          <dd>{mode}</dd>
        </div>
        <div>
          <dt>Normalizador</dt>
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
