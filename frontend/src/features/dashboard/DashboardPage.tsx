import { ArrowUpRight, CloudSun, Database, MapPin, Thermometer, Droplets, Sun } from 'lucide-react';
import { useApp } from '../../app/AppContext';
import { navigation } from '../../app/navigation/navigation';
import { NavigationIcon } from '../../components/NavigationIcon';
import { PageHeading } from '../../components/PageHeading';
import { StatusBadge } from '../../components/Shared';
import type { VariableId } from '../../types/api';

export function DashboardPage() {
  const { location, connection, sources, sourcesError, climate } = useApp();
  const data = climate.result?.data;
  function latest(id: VariableId) {
    const point = data?.series
      .slice()
      .reverse()
      .find((item) => item[id] !== null);
    const meta = data?.variables.find((item) => item.id === id);
    return point ? `${point[id]} ${meta?.unit ?? ''} · ${point.date}` : 'No disponible';
  }
  return (
    <>
      <PageHeading
        eyebrow="VISIÓN GENERAL"
        title="La tierra, en perspectiva."
        description="Datos terrestres y contexto local para explorar decisiones con mayor claridad."
      />
      <section className="hero-v2 topographic">
        <div>
          <StatusBadge variant="info">INTELIGENCIA AGRÍCOLA EXPLICABLE</StatusBadge>
          <h2>
            Una mejor perspectiva
            <br />
            comienza con un lugar.
          </h2>
          <p>
            Conecta información climática y contexto territorial sin perder de vista sus límites.
          </p>
          <a className="button button-primary" href="#/climate-intelligence">
            Explorar el clima <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-inner">
            <MapPin size={38} />
            <span>HAILEX</span>
          </div>
        </div>
        <div className="hero-location">
          <MapPin size={17} />
          <span>
            <small>UBICACIÓN DE ESTUDIO</small>
            <strong>{location.label}</strong>
            <small>
              {location.latitude}, {location.longitude}
            </small>
          </span>
          <a href="#/earth-explorer" aria-label="Cambiar ubicación">
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <div className="metric-grid">
        {(
          [
            { label: 'Temperatura', id: 'T2M', Icon: Thermometer },
            { label: 'Precipitación', id: 'PRECTOTCORR', Icon: Droplets },
            { label: 'Radiación solar', id: 'ALLSKY_SFC_SW_DWN', Icon: Sun },
          ] as const
        ).map(({ label, id, Icon }) => (
          <article className="surface metric" key={id}>
            <div className="metric-heading">
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{latest(id)}</strong>
            <small>
              {data
                ? `Último valor válido · ${data.retrieval.retrieval_mode}`
                : 'Sin consulta climática'}
            </small>
          </article>
        ))}
        <article className="surface metric">
          <div className="metric-heading">
            <span>Estado del backend</span>
            <Database size={19} />
          </div>
          <strong>
            {connection === 'connected'
              ? 'Disponible'
              : connection === 'loading'
                ? 'Comprobando'
                : 'Desconectado'}
          </strong>
          <small>Health no verifica al proveedor NASA</small>
        </article>
      </div>
      <div className="dashboard-bottom">
        <section className="surface">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PROCEDENCIA</p>
              <h2>Fuentes de datos</h2>
            </div>
            <CloudSun size={22} />
          </div>
          {sourcesError && <p>{sourcesError}</p>}
          {sources === null && !sourcesError && <p>Consultando fuentes…</p>}
          {sources?.length === 0 && <p>No hay fuentes publicadas por el servicio.</p>}
          {sources?.map((source) => (
            <div className="source-row" key={source.id}>
              <span>
                <strong>{source.organization}</strong>
                <small>{source.product}</small>
              </span>
              <StatusBadge variant={source.status === 'implemented' ? 'success' : 'warning'}>
                {source.status}
              </StatusBadge>
            </div>
          ))}
          <small>El estado indica integración, no disponibilidad actual del proveedor.</small>
        </section>
        <section className="surface session-panel-v2">
          <p className="eyebrow">TU ESPACIO</p>
          <h2>Todo por explorar.</h2>
          <p>
            No existe historial de análisis persistido. Inicia una consulta climática o explora la
            ubicación.
          </p>
          <a href="#/earth-explorer" className="text-link">
            Abrir Earth Explorer →
          </a>
        </section>
      </div>
      <section className="explore-section">
        <div className="section-heading">
          <h2>Explora el espacio de trabajo</h2>
          <span className="muted">De la ubicación a la explicación</span>
        </div>
        <div className="quick-links">
          {navigation.slice(1).map((item) => (
            <a key={item.id} href={`#/${item.id}`}>
              <NavigationIcon screen={item.id} />
              <strong>{item.label}</strong>
              <span>{item.description}</span>
              <span className="quick-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
