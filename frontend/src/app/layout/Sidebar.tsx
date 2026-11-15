import { navigation, type ScreenId } from '../navigation/navigation';
import { NavigationIcon } from '../../components/NavigationIcon';
import { useApp } from '../AppContext';

export function Sidebar({
  active,
  onNavigate,
}: {
  active: ScreenId | null;
  onNavigate?: () => void;
}) {
  const { connection } = useApp();
  return (
    <>
      <a
        className="brand"
        href="#/dashboard"
        onClick={onNavigate}
        aria-label="HaiLex — ir al Dashboard"
      >
        <span className="brand-mark" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M4 20C5 11 10 5 20 4c0 10-5 15-14 14M5 20c3-5 6-7 10-10" />
          </svg>
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
        <span>
          {connection === 'connected'
            ? 'Backend disponible'
            : connection === 'loading'
              ? 'Comprobando backend'
              : 'Backend no disponible'}
        </span>
        <span className="version-label">V2 · UI</span>
      </div>
    </>
  );
}
