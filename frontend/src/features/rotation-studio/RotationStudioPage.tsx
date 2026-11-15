import { PageHeading } from '../../components/PageHeading';
import { PendingPanel } from '../../components/PendingPanel';

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
      <PendingPanel title="Todavía no hay escenarios">
        <p>
          El perfil, el historial declarado y la edición de secuencias se implementarán con el
          catálogo documentado. No se han supuesto cultivos ni condiciones locales.
        </p>
        <p>
          El cálculo pertenecerá al backend. Esta interfaz no genera recomendaciones ni puntuaciones
          agronómicas.
        </p>
      </PendingPanel>
    </>
  );
}
