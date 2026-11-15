import { PageHeading } from '../../components/PageHeading';
import { PendingPanel } from '../../components/PendingPanel';

export function AnalysisInsightsPage() {
  return (
    <>
      <PageHeading
        eyebrow="RESULTADOS EXPLICABLES"
        title="Analysis & Insights"
        description="Comprende qué sostiene una comparación y qué información falta para interpretarla."
      />
      <PendingPanel title="Aún no hay un análisis que interpretar">
        <p>
          La comparación se mostrará después de configurar los escenarios y conectar el motor del
          backend.
        </p>
        <p>
          Verás los criterios, pesos y contribuciones junto con las fuentes, advertencias y versión
          de reglas. Un criterio no evaluable se distinguirá de una puntuación cero.
        </p>
        <a className="text-link" href="#/rotation-studio">
          Conocer Rotation Studio <span aria-hidden="true">→</span>
        </a>
      </PendingPanel>
      <aside className="method-note">
        <h2>Una evaluación, no una garantía.</h2>
        <p>
          El resultado se expresará como «mejor evaluado bajo estos criterios y datos disponibles».
          No sustituye asesoría agronómica local ni predice rendimiento.
        </p>
      </aside>
    </>
  );
}
