import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import type { ScreenId } from '../navigation/navigation';
import { Sidebar } from './Sidebar';
import { useApp } from '../AppContext';
import { LexWidget } from '../../features/analysis-insights/LexWidget';
import { useTranslation } from 'react-i18next';
import { PreferencesControls } from '../PreferencesControls';

export function AppLayout({
  children,
  active,
  label,
  routeKey,
}: {
  children: ReactNode;
  active: ScreenId | null;
  label: string;
  routeKey: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { connection, location, refreshConnection } = useApp();
  const { t } = useTranslation();
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(image, 0, 0, 64, 64);
      // La punta visible está aproximadamente en (18, 17), no en la esquina del PNG.
      const cursorImage = `url('${canvas.toDataURL()}') 18 17`;
      document.documentElement.style.setProperty('--hailex-cursor-default', `${cursorImage}, auto`);
      document.documentElement.style.setProperty(
        '--hailex-cursor-pointer',
        `${cursorImage}, pointer`,
      );
    };
    image.src = '/cursor-hailex.png';
    return () => {
      image.onload = null;
      document.documentElement.style.removeProperty('--hailex-cursor-default');
      document.documentElement.style.removeProperty('--hailex-cursor-pointer');
    };
  }, []);
  useEffect(() => {
    dialog.current?.close();
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [routeKey]);
  useEffect(() => {
    document.title = `${label} | HaiLex`;
  }, [label]);
  function close() {
    dialog.current?.close();
  }
  return (
    <div className={`v2-shell ${open ? 'drawer-open' : ''}`}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        {t('skip')}
      </a>
      <dialog
        ref={dialog}
        id="navigation-drawer"
        className="v2-drawer"
        aria-labelledby="drawer-title"
        onClose={() => {
          setOpen(false);
          if (document.activeElement === document.body) button.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="drawer-inner">
          <div className="drawer-title">
            <h2 id="drawer-title">{t('explore')}</h2>
            <button
              className="icon-button drawer-close"
              type="button"
              aria-label={t('closeMenu')}
              onClick={close}
            >
              <X size={20} />
            </button>
          </div>
          <Sidebar active={active} onNavigate={close} />
        </div>
      </dialog>
      <div className="v2-workspace">
        <header className="v2-header">
          <div className="header-context">
            <button
              ref={button}
              type="button"
              className="menu-trigger"
              aria-label={t('openMenu')}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="navigation-drawer"
              onClick={() => {
                dialog.current?.showModal();
                setOpen(true);
              }}
            >
              <Menu size={21} />
            </button>
            <span className="header-product">HaiLex</span>
            <span aria-hidden="true">/</span>
            <span className="header-page">{label}</span>
          </div>
          <div className="header-actions">
            <PreferencesControls />
            <span className="header-location">
              {location.type === 'custom' ? t('customPoint') : location.label}
            </span>
            <button
              type="button"
              className={`connection connection-${connection}`}
              onClick={refreshConnection}
              title={t('checkBackend')}
            >
              <span className="connection-dot" />
              {connection === 'connected'
                ? t('connected')
                : connection === 'loading'
                  ? t('checking')
                  : t('disconnected')}
            </button>
          </div>
        </header>
        <main id="main-content" className="v2-main" ref={main} tabIndex={-1}>
          {children}
        </main>
        <footer className="v2-footer">
          <span>HaiLex · {t('tagline')}</span>
          <span>{t('footer')}</span>
        </footer>
      </div>
      <LexWidget />
    </div>
  );
}
