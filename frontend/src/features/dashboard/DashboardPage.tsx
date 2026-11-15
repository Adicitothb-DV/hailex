import { PageHeading } from '../../components/PageHeading';
import { navigation } from '../../app/navigation/navigation';
import { NavigationIcon } from '../../components/NavigationIcon';

export function DashboardPage() {
  return (
    <>
      <PageHeading
        eyebrow="VISIÓN GENERAL"
        title="La tierra, en perspectiva."
        description="Un espacio para conectar el contexto de tu ubicación con las decisiones de la siguiente temporada."
      />
      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div>
          <span className="badge badge-light">Empieza por el contexto</span>
          <h2 id="welcome-title">
            Cada decisión comienza
            <br className="desktop-break" /> con un lugar.
          </h2>
          <p>
            Aún no hay una ubicación seleccionada. Explora cómo organizaremos la información de
            clima, suelo y cultivos.
          </p>
          <a className="button button-light" href="#/earth-explorer">
            Abrir Earth Explorer <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="location-summary">
          <p className="eyebrow">UBICACIÓN DE ESTUDIO</p>
          <p className="location-unset">Sin seleccionar</p>
          <dl>
            <div>
              <dt>Coordenadas</dt>
              <dd>No disponibles</dd>
            </div>
            <div>
              <dt>Perfil del suelo</dt>
              <dd>Sin información</dd>
            </div>
            <div>
              <dt>Cultivo actual</dt>
              <dd>Sin registrar</dd>
            </div>
          </dl>
          <p className="location-footnote">
            Un punto de referencia no equivale a una parcela medida.
          </p>
        </div>
      </section>
      <div className="dashboard-bottom">
        <section className="surface source-overview" aria-labelledby="sources-title">
          <div className="section-heading">
            <h2 id="sources-title">Datos con procedencia</h2>
            <span className="badge">Sin consultar</span>
          </div>
          <p className="muted">
            La disponibilidad se mostrará cuando existan integraciones reales.
          </p>
          <ul className="source-list">
            <li>
              <span>
                <strong>NASA POWER</strong>
                <small>Clima · integración prevista</small>
              </span>
              <span className="source-status">No consultada</span>
            </li>
            <li>
              <span>
                <strong>Contexto del suelo</strong>
                <small>Entrada de usuario o referencia cartográfica</small>
              </span>
              <span className="source-status">No disponible</span>
            </li>
            <li>
              <span>
                <strong>Catálogo agrícola</strong>
                <small>Cultivos y referencias documentadas</small>
              </span>
              <span className="source-status">Pendiente</span>
            </li>
          </ul>
        </section>
        <section className="session-panel" aria-labelledby="session-title">
          <p className="eyebrow">TU SESIÓN</p>
          <h2 id="session-title">Todo por explorar.</h2>
          <p>
            No hay análisis recientes. Cuando el flujo esté conectado, aquí encontrarás el contexto
            de tu trabajo.
          </p>
          <div className="honesty-note">
            Interfaz en construcción. Sin observaciones, métricas ni resultados simulados.
          </div>
        </section>
      </div>
      <section className="explore-section" aria-labelledby="explore-title">
        <div className="section-heading">
          <h2 id="explore-title">Explora el espacio de trabajo</h2>
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
