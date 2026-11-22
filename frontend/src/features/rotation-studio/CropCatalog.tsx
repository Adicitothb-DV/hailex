import { useEffect, useState } from 'react';
import { useApp } from '../../app/AppContext';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../components/Shared';
import { api } from '../../services/api';
import type {
  Crop,
  CropCatalog as CatalogData,
  Envelope,
  EvidenceStatus,
  Source,
} from '../../types/api';

const labels: Record<EvidenceStatus, string> = {
  verified_local: 'Verificado localmente',
  documented_general: 'Documentado · referencia general',
  provisional: 'Provisional · requiere validación',
  unknown: 'Desconocido',
};
const attributeNames: Record<string, string> = {
  product_form: 'Forma de producto',
  local_water_requirement: 'Requerimiento de agua local',
  local_planting_window: 'Ventana de siembra local',
};

function references(ids: string[], sources: Source[]) {
  if (!ids.length) return 'Fuente no disponible';
  return ids
    .map(
      (id) =>
        sources.find((source) => source.id === id)?.organization ?? `Fuente ${id} no disponible`,
    )
    .join(', ');
}

function CropDetail({ crop, sources }: { crop: Crop; sources: Source[] }) {
  const ids = new Set([
    ...Object.values(crop.identity_source_refs).flat(),
    ...crop.attributes.flatMap((a) => a.source_refs),
  ]);
  return (
    <section className="surface crop-detail" aria-labelledby="crop-detail-title">
      <p className="eyebrow">FICHA Y VALIDACIÓN</p>
      <h3 id="crop-detail-title">{crop.common_name}</h3>
      <StatusBadge variant={crop.evidence_status === 'verified_local' ? 'success' : 'warning'}>
        {labels[crop.evidence_status]}
      </StatusBadge>
      <p>
        <strong>Nombre científico:</strong> {crop.scientific_name ?? 'Desconocido'} ·{' '}
        {references(crop.identity_source_refs.scientific_name ?? [], sources)}
      </p>
      <p>
        <strong>Familia:</strong> {crop.botanical_family ?? 'Desconocida'} ·{' '}
        {references(crop.identity_source_refs.botanical_family ?? [], sources)}
      </p>
      <p>
        <strong>Nombre común:</strong>{' '}
        {references(crop.identity_source_refs.common_name ?? [], sources)}
      </p>
      {crop.limitations.map((item) => (
        <p className="fine-print" key={item}>
          {item}
        </p>
      ))}
      <div className="crop-attributes">
        {crop.attributes.map((attribute) => (
          <div key={attribute.name}>
            <strong>{attributeNames[attribute.name] ?? attribute.name}</strong>
            <span>
              {attribute.value === null
                ? 'Desconocido · requiere validación'
                : `${String(attribute.value)}${attribute.unit ? ` ${attribute.unit}` : ''}`}
            </span>
            <small>
              {labels[attribute.evidence_status]} · {references(attribute.source_refs, sources)}
            </small>
            {attribute.limitations.map((limit) => (
              <small key={limit}>{limit}</small>
            ))}
          </div>
        ))}
      </div>
      <h4>Fuentes del cultivo</h4>
      {Array.from(ids).map((id) => {
        const source = sources.find((item) => item.id === id);
        if (!source) return <p key={id}>Fuente {id}: no disponible.</p>;
        const href = source.reference?.startsWith('https://') ? source.reference : null;
        return (
          <div className="crop-source" key={id}>
            <strong>
              {source.organization} · {source.product}
            </strong>
            <small>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer">
                  Consultar referencia ↗
                </a>
              ) : (
                (source.reference ?? 'Referencia no disponible')
              )}
            </small>
            {source.limitations.map((limit) => (
              <small key={limit}>{limit}</small>
            ))}
          </div>
        );
      })}
    </section>
  );
}

export function CropCatalog() {
  const { selectedCrop, setSelectedCrop, setSelectedCropName } = useApp();
  const [result, setResult] = useState<Envelope<CatalogData> | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api
      .crops(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult(data);
          setStatus('success');
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setResult(null);
          setError(reason instanceof Error ? reason.message : 'Servicio no disponible.');
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, [attempt]);
  const selected = result?.data.crops.find((crop) => crop.id === selectedCrop);
  return (
    <section className="catalog-section" aria-labelledby="catalog-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">DATOS LOCALES · PROCEDENCIA</p>
          <h2 id="catalog-title">Catálogo agrícola</h2>
        </div>
      </div>
      {status === 'loading' && <LoadingState>Consultando el catálogo…</LoadingState>}
      {status === 'error' && (
        <ErrorState
          message={error}
          retry={() => {
            setStatus('loading');
            setAttempt((n) => n + 1);
          }}
        />
      )}
      {result && (
        <>
          <p className="fine-print">
            Versión {result.data.catalog_version} · {result.data.data_type}{' '}
            {result.data.display_label && `· ${result.data.display_label}`}
          </p>
          {result.data.data_type === 'simulation' && (
            <p className="notice">SIMULADO · Datos ilustrativos.</p>
          )}
          {result.warnings.map((warning) => (
            <p className="notice" key={warning}>
              {warning}
            </p>
          ))}
          {result.data.crops.length === 0 ? (
            <EmptyState title="Catálogo vacío">El servicio no publicó cultivos.</EmptyState>
          ) : (
            <div className="crop-list" aria-label="Cultivos disponibles">
              {result.data.crops.map((crop) => (
                <button
                  type="button"
                  key={crop.id}
                  className={`crop-choice ${selectedCrop === crop.id ? 'selected' : ''}`}
                  aria-pressed={selectedCrop === crop.id}
                  onClick={() => {
                    setSelectedCrop(crop.id);
                    setSelectedCropName(crop.common_name);
                  }}
                >
                  <strong>{crop.common_name}</strong>
                  <small>{labels[crop.evidence_status]}</small>
                </button>
              ))}
            </div>
          )}
          {selected ? (
            <CropDetail crop={selected} sources={result.data.sources} />
          ) : (
            <EmptyState title="Selecciona un cultivo">
              Consulta su identidad, fuentes y campos pendientes de validación.
            </EmptyState>
          )}
        </>
      )}
    </section>
  );
}
