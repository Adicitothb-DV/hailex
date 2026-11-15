import { PageHeading } from '../../components/PageHeading';
import { PendingPanel } from '../../components/PendingPanel';

export function ClimateIntelligencePage() {
  return (
    <>
      <PageHeading
        eyebrow="OBSERVACIONES Y CONTEXTO"
        title="Climate Intelligence"
        description="Temperatura, precipitación y radiación, con su periodo, unidades y límites de interpretación."
      />
      <div className="notice">
        <strong>No hay una consulta climática.</strong>
        <p>
          NASA POWER no se ha consultado. La selección de periodo y las series temporales están
          pendientes de integración.
        </p>
      </div>
      <PendingPanel title="Primero los datos, después la gráfica">
        <p>
          No se muestran curvas ni valores de ejemplo. Aquí se visualizarán series trazables al
          backend y sus indicadores de datos faltantes.
        </p>
        <ul className="feature-list">
          <li>Temperatura y precipitación en vistas separadas.</li>
          <li>Radiación solar solo si se integra y verifica correctamente.</li>
          <li>Fuente, coordenadas, periodo y fecha de recuperación visibles.</li>
        </ul>
      </PendingPanel>
    </>
  );
}
