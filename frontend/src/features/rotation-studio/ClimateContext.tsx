import { useApp } from '../../app/AppContext';
import { EmptyState, ErrorState, LoadingState } from '../../components/Shared';
import type { VariableId } from '../../types/api';

export function ClimateContext() {
  const { climate } = useApp();
  const result = climate.result;
  const labels: { id: VariableId; title: string }[] = [
    { id: 'T2M', title: 'Temperatura' },
    { id: 'PRECTOTCORR', title: 'Precipitación' },
    { id: 'ALLSKY_SFC_SW_DWN', title: 'Radiación' },
  ];
  return (
    <section className="surface climate-context" aria-labelledby="climate-context-title">
      <p className="eyebrow">NASA POWER · CONTEXTO DESCRIPTIVO</p>
      <h2 id="climate-context-title">Contexto climático</h2>
      <p>
        Producto regional modelado o estimado: el punto consultado no equivale a una medición de
        parcela.
      </p>
      {climate.status === 'loading' && <LoadingState>Consultando clima…</LoadingState>}
      {climate.status === 'error' && (
        <>
          <ErrorState message={climate.error} />
          <a className="text-link" href="#/climate-intelligence">
            Revisar consulta climática →
          </a>
        </>
      )}
      {climate.status === 'idle' && (
        <EmptyState title="Sin consulta climática">
          Abre Climate Intelligence para consultar el punto y periodo de interés.
        </EmptyState>
      )}
      {result && (
        <>
          {result.data.retrieval.retrieval_mode === 'demo_fixture' && (
            <p className="notice">SIMULADO · Datos ilustrativos.</p>
          )}
          <p>
            <strong>
              {result.data.source.organization} · {result.data.source.product}
            </strong>
            <br />
            {result.data.location.latitude}, {result.data.location.longitude} ·{' '}
            {result.data.period.start_date} — {result.data.period.end_date}
            <br />
            Recuperado: {result.data.retrieval.retrieved_at ?? 'No disponible'} ·{' '}
            {result.data.retrieval.retrieval_mode}
          </p>
          <div className="crop-attributes">
            {labels.map(({ id, title }) => {
              const meta = result.data.variables.find((item) => item.id === id);
              const point = result.data.series
                .slice()
                .reverse()
                .find((item) => item[id] !== null);
              return (
                <div key={id}>
                  <strong>{title}</strong>
                  <span>
                    {point
                      ? `${point[id]} ${meta?.unit ?? 'unidad desconocida'} · ${point.date}`
                      : 'Sin valores disponibles'}
                  </span>
                  <small>
                    {meta
                      ? `${meta.data_type} · ${meta.valid_count} válidos / ${meta.missing_count} faltantes · ${meta.spatial_resolution ?? 'resolución desconocida'}`
                      : 'Metadatos no disponibles'}
                  </small>
                  {meta?.limitations.map((limit) => (
                    <small key={limit}>{limit}</small>
                  ))}
                </div>
              );
            })}
          </div>
          {[...result.data.source.limitations, ...result.warnings].map((item, i) => (
            <p className="fine-print" key={`${i}-${item}`}>
              {item}
            </p>
          ))}
        </>
      )}
      <a className="text-link" href="#/climate-intelligence">
        Abrir Climate Intelligence →
      </a>
    </section>
  );
}
