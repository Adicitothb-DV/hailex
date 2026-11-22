import { navigation, type ScreenId } from '../navigation/navigation';
import { NavigationIcon } from '../../components/NavigationIcon';
import { useApp } from '../AppContext';
import { useTranslation } from 'react-i18next';

export function Sidebar({
  active,
  onNavigate,
}: {
  active: ScreenId | null;
  onNavigate?: () => void;
}) {
  const { connection } = useApp();
  const { t } = useTranslation();
  return (
    <>
      <a className="brand" href="#/dashboard" onClick={onNavigate} aria-label={t('home')}>
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
          HaiLex<span className="brand-caption">{t('tagline')}</span>
        </span>
      </a>
      <p className="nav-caption">{t('workspace')}</p>
      <nav aria-label={t('navigation')} className="primary-nav">
        {navigation
          .filter((item) => item.id !== 'pest-monitor')
          .map((item) => (
            <a
              key={item.id}
              href={`#/${item.id}`}
              aria-current={active === item.id ? 'page' : undefined}
              onClick={onNavigate}
            >
              <NavigationIcon screen={item.id} />
              <span>{t(item.id)}</span>
            </a>
          ))}
      </nav>
      <div className="sidebar-note">
        <span className="sidebar-note-label">{t('science')}</span>
        <p>{t('sidebarNote')}</p>
      </div>
      <div className="sidebar-footer">
        <span className="status-dot" aria-hidden="true" />
        <span>
          {connection === 'connected'
            ? t('connected')
            : connection === 'loading'
              ? t('checking')
              : t('disconnected')}
        </span>
        <span className="version-label">V2 · UI</span>
      </div>
    </>
  );
}
