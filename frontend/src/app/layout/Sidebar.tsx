import { navigation, type ScreenId } from '../navigation/navigation';
import { NavigationIcon } from '../../components/NavigationIcon';

export function Sidebar({
  active,
  onNavigate,
}: {
  active: ScreenId | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <a
        className="brand"
        href="#/dashboard"
        onClick={onNavigate}
        aria-label="HaiLex — ir al Dashboard"
      >
        <span className="brand-mark" aria-hidden="true">
          H<span>↗</span>
        </span>
        <span>
          HaiLex<span className="brand-caption">EARTH & AGRICULTURE</span>
        </span>
      </a>
      <p className="nav-caption">ESPACIO DE TRABAJO</p>
      <nav aria-label="Navegación principal" className="primary-nav">
        {navigation.map((item) => (
          <a
            key={item.id}
            href={`#/${item.id}`}
            aria-current={active === item.id ? 'page' : undefined}
            onClick={onNavigate}
          >
            <NavigationIcon screen={item.id} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="sidebar-note">
        <span className="sidebar-note-label">CIENCIA CON CONTEXTO</span>
        <p>Datos, alternativas y límites. La decisión sigue en tus manos.</p>
      </div>
      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>Fuentes sin consultar</span>
        <span className="version-label">V1 · UI</span>
      </div>
    </>
  );
}
