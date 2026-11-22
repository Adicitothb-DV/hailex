import { PageHeading } from '../../components/PageHeading';
import { PendingPanel } from '../../components/PendingPanel';
import { CropCatalog } from './CropCatalog';
import { ParcelPanel } from './ParcelPanel';
import { ClimateContext } from './ClimateContext';

export function RotationStudioPage() {
  return (
    <>
      <PageHeading
        eyebrow="ALTERNATIVAS PARA EXPLORAR"
        title="Rotation Studio"
        description="Organiza el contexto de la parcela y prepara tres escenarios para compararlos bajo criterios explícitos."
      />
      <ol className="workflow-steps">
        <li>
          <span>01</span>
          <strong>Contexto</strong>
          <p>Suelo, agua y cultivo actual</p>
        </li>
        <li>
          <span>02</span>
          <strong>Escenarios</strong>
          <p>Secuencias por ciclo</p>
        </li>
        <li>
          <span>03</span>
          <strong>Prioridades</strong>
          <p>Preferencias y restricciones</p>
        </li>
      </ol>
      <CropCatalog />
      <ParcelPanel />
      <ClimateContext />
      <PendingPanel title="Todavía no hay escenarios">
        <p>
          El historial y la edición de secuencias aún no están disponibles. El perfil es local a
          esta sesión y no supone condiciones de campo.
        </p>
        <p>
          El cálculo pertenecerá al backend. Esta interfaz no genera recomendaciones ni puntuaciones
          agronómicas.
        </p>
      </PendingPanel>
    </>
  );
}
