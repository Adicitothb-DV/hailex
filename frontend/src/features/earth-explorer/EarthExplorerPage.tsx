import { PageHeading } from '../../components/PageHeading';
import { PendingPanel } from '../../components/PendingPanel';

export function EarthExplorerPage() {
  return (
    <>
      <PageHeading
        eyebrow="CONTEXTO GEOESPACIAL"
        title="Earth Explorer"
        description="La ubicación es el punto de partida. Conoce el alcance espacial antes de interpretar un dato."
      />
      <div className="explorer-grid">
        <section className="map-pending" aria-labelledby="map-title">
          <span className="map-symbol" aria-hidden="true">
            ＋
          </span>
          <span className="badge">Mapa no integrado</span>
          <h2 id="map-title">Aquí empieza la exploración.</h2>
          <p>
            MapLibre y la selección de coordenadas se incorporarán en la fase geoespacial. Este
            espacio no representa cartografía ni imágenes satelitales.
          </p>
        </section>
        <PendingPanel title="Ubicación de estudio">
          <p>
            No hay una ubicación seleccionada. La entrada manual y la selección en el mapa estarán
            disponibles en una próxima fase.
          </p>
          <dl className="detail-list">
            <div>
              <dt>Latitud / longitud</dt>
              <dd>No disponibles</dd>
            </div>
            <div>
              <dt>Capas y leyenda</dt>
              <dd>Sin capas integradas</dd>
            </div>
          </dl>
          <p>La cartografía regional no sustituye mediciones en campo.</p>
        </PendingPanel>
      </div>
    </>
  );
}
